# Methods and data dictionary notes

## Provenance and scope

`data/final_demographics_data.csv` was supplied by the requester, who described it as a 2020 World Bank fact sheet. The file has 57 country rows and 61 columns (country, Region, 59 numeric indicators). It has no explicit year, download date, series IDs, country inclusion rule, or original license statement. This project neither reconstructs those missing facts nor merges in newer observations. Any text inside the data file is treated as data, not an instruction.

## Calculations

- Numeric values: parsed from the CSV as floating-point numbers. Blank cells become `null` in the dashboard and remain missing throughout analysis.
- Country medians: simple medians of available country values, with no population weighting.
- Growth contraction count: countries with `GDP growth (annual %)` strictly below zero divided by countries with a reported value.
- Sample population: sum of `Population, total` for the included countries. This is not a world total.
- Urban share: sum of `Urban population` divided by sum of `Population, total` for the selected countries. The dashboard recalculates after filtering.
- Spearman rho: Pearson correlation of average ranks for complete country pairs. It is descriptive; there is no model adjustment or causal interpretation.
- Regional summaries: source `Region` labels are preserved; median growth uses available values in each group. Small group sizes are shown beside results.
- Display rounding: growth and percentages to two or one decimal places as appropriate; GDP per capita to the nearest dollar. Raw values remain in the CSV and `dashboard/data.js`.

## Data validation

The build script checks for duplicate headers and country names. It reports coverage by indicator and checks `Population, female` plus `Population, male` against `Population, total`, old plus young against total age dependency, urban population against total population, and negative total populations. These are arithmetic checks, not external validation.

## Sources for concepts

- [World Bank Data](https://data.worldbank.org/): source credited by the requester.
- [GDP growth metadata](https://databank.worldbank.org/metadataglossary/sustainable-development-goals-%28sdgs%29/series/NY.GDP.MKTP.KD.ZG): annual percentage growth based on constant local currency.
- [Population metadata](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.POP.TOTL): de facto population concept.
- [Urban population metadata](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.URB.TOTL): national urban definitions and underlying UN urban ratios.

World Bank metadata pages may reflect later revisions or reference years. The report retains the supplied CSV's explicit `constant 2010 US$` labels.
