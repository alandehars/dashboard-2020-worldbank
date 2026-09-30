"""Rebuild the dashboard data and auditable statistics from the supplied CSV."""
from __future__ import annotations

import csv
import json
import math
import statistics as stats
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "final_demographics_data.csv"
OUT = ROOT / "dashboard" / "data.js"
SUMMARY = ROOT / "analysis" / "summary.json"

with SOURCE.open(encoding="utf-8-sig", newline="") as fh:
    reader = csv.DictReader(fh)
    columns = reader.fieldnames or []
    raw = list(reader)

assert len(columns) == len(set(columns)), "Duplicate headers"
assert len(raw) == len({row["country"] for row in raw}), "Duplicate countries"

rows = []
for row in raw:
    clean = {"country": row["country"], "Region": row["Region"]}
    for key in columns[2:]:
        value = row[key].strip()
        clean[key] = float(value) if value else None
    rows.append(clean)

def valid(key, subset=rows):
    return [r[key] for r in subset if r[key] is not None]

def ranked(key, reverse=True, count=10):
    return [{"country": r["country"], "value": r[key]} for r in sorted(
        (r for r in rows if r[key] is not None),
        key=lambda r: r[key], reverse=reverse)[:count]]

def rank(values):
    order = sorted(range(len(values)), key=lambda i: values[i])
    result = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i + 1
        while j < len(order) and values[order[j]] == values[order[i]]:
            j += 1
        mean_rank = (i + j - 1) / 2 + 1
        for k in order[i:j]:
            result[k] = mean_rank
        i = j
    return result

def pearson(x, y):
    mx, my = stats.mean(x), stats.mean(y)
    num = sum((a - mx) * (b - my) for a, b in zip(x, y))
    den = math.sqrt(sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y))
    return num / den if den else None

def spearman(a, b):
    pairs = [(r[a], r[b]) for r in rows if r[a] is not None and r[b] is not None]
    return {"n": len(pairs), "rho": pearson(rank([x for x, _ in pairs]), rank([y for _, y in pairs]))}

POP = "Population, total"
GDP = "GDP (constant 2010 US$)"
GDP_PC = "GDP per capita (constant 2010 US$)"
GROWTH = "GDP growth (annual %)"
HCI = "Human capital index (HCI) (scale 0-1)"
URBAN = "Urban population"
CONSUMPTION = "Final consumption expenditure (% of GDP)"
DEP = "Age dependency ratio (% of working-age population)"
OLD = "Age dependency ratio, old (% of working-age population)"
YOUNG = "Age dependency ratio, young (% of working-age population)"

missing = {k: sum(r[k] is None for r in rows) for k in columns[2:]}
growth = valid(GROWTH)
pop_total = sum(valid(POP))
regions = []
for name in sorted(set(r["Region"] for r in rows)):
    sub = [r for r in rows if r["Region"] == name]
    g = valid(GROWTH, sub)
    regions.append({"region": name, "n": len(sub), "population": sum(valid(POP, sub)),
                    "growth_n": len(g), "median_growth": stats.median(g) if g else None,
                    "median_gdp_pc": stats.median(valid(GDP_PC, sub)) if valid(GDP_PC, sub) else None})

audit = {
    "female_plus_male_population_max_abs_error": max(abs(r["Population, female"] + r["Population, male"] - r[POP]) for r in rows),
    "age_dependency_components_max_abs_error": max(abs(r[OLD] + r[YOUNG] - r[DEP]) for r in rows),
    "urban_exceeds_population_count": sum(r[URBAN] > r[POP] for r in rows),
    "negative_population_count": sum(r[POP] < 0 for r in rows),
}
summary = {
    "countries": len(rows), "columns": len(columns), "numeric_indicators": len(columns) - 2,
    "regions": len(regions), "nonmissing_numeric_cells": len(rows) * (len(columns) - 2) - sum(missing.values()),
    "numeric_cells": len(rows) * (len(columns) - 2),
    "sample_population": pop_total,
    "growth_n": len(growth), "growth_negative_n": sum(v < 0 for v in growth),
    "growth_positive_n": sum(v > 0 for v in growth),
    "growth_median": stats.median(growth),
    "gdp_pc_n": len(valid(GDP_PC)), "gdp_pc_median": stats.median(valid(GDP_PC)),
    "hci_median": stats.median(valid(HCI)),
    "sample_urban_share": sum(valid(URBAN)) / pop_total,
    "missing": missing, "regions_detail": regions,
    "top_population": ranked(POP), "top_gdp_pc": ranked(GDP_PC),
    "bottom_growth": ranked(GROWTH, False), "top_growth": ranked(GROWTH),
    "association_gdp_pc_hci": spearman(GDP_PC, HCI),
    "association_urban_hci": spearman(URBAN, HCI),
    "audit": audit,
}
SUMMARY.parent.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)
SUMMARY.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
OUT.write_text("window.WB_DATA = " + json.dumps({"columns": columns, "rows": rows, "summary": summary}, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
print(json.dumps({k: v for k, v in summary.items() if k not in ("missing", "regions_detail", "top_population", "top_gdp_pc", "bottom_growth", "top_growth")}, indent=2))
