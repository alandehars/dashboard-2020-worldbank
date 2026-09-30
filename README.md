# World Bank 2020 country sample dashboard

An interactive, source-traceable analysis of the user-supplied 2020 World Bank fact sheet. The project contains a responsive dashboard, a detailed research report, a PDF report and a concise PowerPoint briefing.

## Open the dashboard

Open `dashboard/index.html` in a browser. It uses local JavaScript and has no external library or network dependency. Filter by source region or country name, compare two measures in the bubble chart, rank countries, inspect data coverage and download the filtered rows as CSV. Blank source cells stay missing.

The published dashboard is at [alandehars.github.io/dashboard-2020-worldbank](https://alandehars.github.io/dashboard-2020-worldbank/) once GitHub Pages completes its first build.

## Rebuild the analysis

With Python 3.9 or newer:

```bash
python scripts/build_data.py
```

The script reads `data/final_demographics_data.csv`, validates basic structure, and regenerates `analysis/summary.json` and `dashboard/data.js`. The original CSV is included for auditability. The PDF and slides are presentation exports of the same analysis; their source scripts are under `scripts/`.

`scripts/build_figures.py` uses Python's standard library for the SVG report figures. `scripts/build_pdf.py` uses ReportLab. The PowerPoint builder uses the Codex bundled `@oai/artifact-tool` runtime and finalizer; its environment-specific paths may need adjustment outside Codex.

## Project files

| Path | Purpose |
|---|---|
| `dashboard/index.html` | Browser dashboard |
| `analysis/report.md` | Detailed research report with figures, verdict and recommendations |
| `analysis/methodology.md` | Definitions, limitations and validation |
| `analysis/summary.json` | Reproducible statistics |
| `output/worldbank_2020_report.pdf` | Designed PDF report |
| `output/worldbank_2020_briefing.pptx` | Concise presentation |
| `data/final_demographics_data.csv` | Supplied dataset, unchanged |

## Interpretation

The dataset has 57 selected countries and no year column or documented selection method. Its country totals and rankings do not describe all countries. The 2020 date comes from the user's supplied context. GDP per capita is labeled in constant 2010 US dollars in the CSV. See the report for coverage counts and source links.
