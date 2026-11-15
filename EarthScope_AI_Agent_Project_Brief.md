# EarthScope — NASA Space Apps 2026 Project Setup Brief

## 1. Your role

You are the development agent responsible for setting up and implementing **EarthScope**, a solo-participant project for the 2026 NASA Space Apps Challenge:

**Challenge:** Be An Earth System Trend Detective!

Work as an engineering partner, not an autonomous product decision-maker. Set up a working, understandable project and implement the defined scope. Do not silently invent scientific data, pretend unfinished features work, or expand the project beyond the time available.

The participant prefers **JSX and JavaScript** over TypeScript. Keep the code readable and explain important decisions briefly.

## 2. The actual challenge

The official challenge asks us to create a tool that can:

1. Select Earth-science variables measured by NASA missions or produced by NASA Earth-science models.
2. Acquire data for a selected geographic region.
3. Generate and visualize a time series over a sufficiently long period.
4. Analyze the time series to determine:
   - What is changing?
   - Where is it changing?
   - How much is it changing?
   - Is the trend statistically significant?

The application must combine **data acquisition, time-series visualization, and statistical trend analysis**. A dashboard that only displays charts does not satisfy the full challenge.

Official brief:
https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/

Read the complete official brief and its Resources section before making data-source assumptions.

## 3. Product direction

Working name: **EarthScope**

Build an interactive scientific investigation workspace. A user should be able to choose an environmental variable, location/region, and time period, then run an investigation and inspect the evidence.

### Primary user journey

1. Open the application.
2. Choose an available environmental variable.
3. Choose a location or region.
4. Choose a valid date range.
5. Retrieve the relevant NASA data.
6. Inspect the time series.
7. Run statistical trend analysis.
8. Read a clear report showing the direction, magnitude, significance, uncertainty, and limitations of the result.

The experience should feel like a scientific investigation tool, not a generic admin dashboard.

### Initial investigation

Start with **near-surface air temperature** from a NASA source with a sufficiently long historical record. MERRA-2 is a candidate. NASA POWER may provide a convenient API for MERRA-2-derived meteorological data; verify the exact parameter, source lineage, temporal coverage, units, spatial meaning, and API behaviour before relying on it.

A possible first test is a single point in Nigeria over a multi-decade period. Coordinates are only a starting point: make it clear whether the result represents a point/grid cell or an area average. Do not label one coordinate as the average for an entire state or country.

Do not add multiple variables until the first end-to-end investigation works correctly.

## 4. Data sources and data-handling rules

Potential NASA data families named in the challenge include:

- MERRA-2 — atmospheric and meteorological variables.
- GLDAS — land and water variables.
- GPM — precipitation.
- MODIS — land surface and vegetation observations.
- AIRS — atmospheric observations.
- OMI — atmospheric composition observations.

Useful official starting points:

- NASA POWER: https://power.larc.nasa.gov/
- NASA POWER monthly API documentation: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/
- NASA Giovanni: https://giovanni.gsfc.nasa.gov/giovanni/
- NASA Earthdata: https://earthdata.nasa.gov/
- NASA MERRA-2 overview: https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/

### Important instruction: ask for data when needed

If you need a dataset, downloaded file, Earthdata credentials, API key, location coordinates, or any other input that the participant must provide:

1. Stop at that dependency.
2. Explain exactly what is missing and why it is needed.
3. Give the official source and direct steps/URL for obtaining it.
4. State the expected filename or format, if applicable.
5. Ask the participant to provide it.
6. Continue with independent setup work where possible.

**Do not fabricate, silently substitute, or present mock/sample values as real NASA observations.** You may use clearly labelled synthetic data only for temporary layout testing, and it must be visibly marked as synthetic in the UI and removed or disabled for the real demonstration. Prefer a real small dataset as soon as possible.

For every real dataset, preserve metadata:
- NASA source and dataset/product name.
- Variable/parameter identifier.
- Units.
- Temporal resolution and coverage.
- Spatial resolution or grid/point meaning.
- Region/coordinates used.
- Retrieval date and source URL.
- Missing-value handling and any transformations.

Do not claim all datasets are directly interchangeable. Check units, grids, temporal resolution, definitions, and provenance before comparing them.

## 5. Scientific analysis requirements

The first version should analyze annual averages derived from monthly temperature observations. This reduces the initial seasonal-cycle complication and gives a long time series for trend analysis.

Implement and document:

- Data validation and missing-value handling.
- Monthly-to-annual aggregation, with a documented completeness rule.
- Linear regression for an interpretable rate of change.
- Mann–Kendall test for a monotonic trend.
- Sen's slope as a robust trend-magnitude estimate.
- A confidence interval where supported by the chosen method.
- A clear significance interpretation, including the p-value and threshold used.

Use suitable, established Python libraries such as pandas, SciPy, and a maintained Mann–Kendall implementation (for example, `pymannkendall`) after checking compatibility.

Scientific safeguards:

- Do not replace missing observations with zero.
- Do not infer causation from correlation or a trend.
- Do not describe a trend as statistically significant unless the implemented test supports that conclusion.
- Distinguish direction, magnitude, statistical significance, and practical importance.
- State the analysis period and number of observations.
- Explain that reanalysis products are model-based estimates informed by observations, not direct measurements at every location.
- Be careful with autocorrelation and seasonality. Annual aggregation is the first-version simplification, not a universal solution. Document the limitation.
- Validate statistical functions with a known test dataset or independent calculation before trusting the results.

If a method cannot be implemented or validated reliably within the hackathon, disclose that limitation instead of presenting it as complete.

## 6. Stack and implementation preferences

Use this stack unless a concrete technical blocker requires a change. Discuss the blocker before changing the stack.

### Frontend
- React
- Vite
- **JavaScript + JSX (not TypeScript)**
- Tailwind CSS for styling, if it can be configured cleanly
- Recharts for time-series charts
- Leaflet + React Leaflet for geographic maps

### Analysis/backend
- Python
- FastAPI for a small API between the frontend and analysis code
- pandas for data preparation
- SciPy for regression/statistical support
- `pymannkendall` or another verified library for Mann–Kendall and Sen's slope

### Storage
- No database in the initial version.
- Store downloaded raw data and processed investigation outputs locally in a clearly organised data directory.
- Keep raw source data separate from processed results.
- Do not commit credentials or large raw datasets to Git.

### API and data access
- Prefer server-side data fetching through Python where browser CORS, credentials, or data processing make that more reliable.
- Keep data-source logic separate from analysis logic.
- Handle timeouts, failed requests, invalid responses, and missing values.
- Never expose private credentials in frontend code.

Do not add authentication, accounts, complex cloud infrastructure, an LLM agent, or a database unless a demonstrated requirement emerges.

## 7. Visual design direction

The visual identity should use:

- **Charcoal** as the primary dark surface.
- **Grey** for secondary surfaces, borders, muted labels, and neutral information.
- **A restrained red** as the accent for selected controls, important highlights, and trend indicators.
- Use white/off-white for readable primary text.

Suggested starting palette (adjust only if contrast testing requires it):

- Background: `#17191C`
- Main surface: `#22252A`
- Raised surface: `#2B2F35`
- Border: `#3A3F46`
- Primary text: `#F1F2F3`
- Secondary text: `#A7ADB5`
- Accent red: `#E05252`
- Deep red: `#A93232`

Avoid excessive gradients, glowing borders, glassmorphism, oversized rounded cards, decorative clutter, and generic AI-generated dashboard styling. Prioritise hierarchy, legibility, useful whitespace, and precise data presentation. Include a light theme only if it can be implemented without compromising the core work.

### Internet images and visual assets

Use images from the Internet where they genuinely improve the experience:

- Prefer official NASA imagery and NASA Earth Observatory/Earthdata imagery for relevant visual context.
- Unsplash or another reputable source may be used for non-scientific atmospheric/background imagery if needed.
- Search for suitable images, download them into the project's local assets folder, and avoid fragile hotlinked image URLs where practical.
- Record image source URLs and attribution/licensing information in `ASSETS.md`.
- Do not use decorative imagery as a substitute for actual scientific data.
- Never use an image, map, or chart that could make synthetic or illustrative values appear to be real NASA observations.
- Ensure image compression and dimensions are appropriate for web performance.

## 8. Suggested interface structure

Keep the initial product focused. Suggested areas:

### A. Investigation controls
- Variable selector (only variables actually supported).
- Location/region selector.
- Start and end year.
- Run investigation action.
- Clear validation and loading/error states.

### B. Geographic context
- Map showing the selected point or region.
- A clear indication of what the selected spatial unit represents.
- Do not imply a detailed regional average if only a single grid cell/coordinate was queried.

### C. Time-series analysis
- Actual observations plotted against time.
- Trend line where applicable.
- Units, dates, source, and missing-data context.
- Tooltips and readable axis labels.

### D. Findings panel
- Trend direction.
- Estimated rate and units per year or decade.
- Statistical test and p-value.
- Significance interpretation.
- Confidence interval, if available.
- Observation count and analysis period.
- A concise explanation of what the result does and does not establish.

### E. Data and methodology
- Dataset provenance.
- Processing steps.
- Definitions of technical terms.
- Known limitations.

A short guided example or sample investigation may be useful, but it must be clearly labelled and traceable to real data.

## 9. Project setup and working process

First inspect the current workspace and available tools. Do not overwrite an existing project without checking it.

Then:

1. Create the project structure and install the agreed dependencies.
2. Configure the React JSX frontend and Python analysis service.
3. Add a README with setup/run instructions.
4. Add `.gitignore` and an `.env.example` if configuration variables are needed.
5. Implement a small, reliable NASA data-fetching test.
6. Validate and inspect the returned data and metadata.
7. Implement the first analysis pipeline.
8. Build the interface around verified outputs.
9. Test the complete user journey.
10. Review the result against the acceptance criteria below.

Work in small, testable steps. Run the application and tests rather than assuming code works. Fix errors you introduce. Do not leave placeholder buttons that look functional but do nothing.

If the environment lacks a dependency, network access, dataset, or credential, tell the participant exactly what is needed. Do not conceal the blocker.

## 10. Definition of done — mandatory scope audit

At the end of implementation, perform an explicit audit. Do not merely say that the project is complete.

| Requirement | Evidence required |
|---|---|
| NASA data source | A real request or imported real NASA dataset succeeds |
| Variable selection | User can select a supported variable |
| Geographic selection | User can specify a point/region and understand its spatial meaning |
| Time period | User can choose a valid historical period |
| Time series | Actual observations are displayed with units and dates |
| Trend magnitude | A rate of change is calculated and labelled with units |
| Statistical significance | A documented statistical test runs and its result is shown |
| Interpretation | Findings explain direction, magnitude, significance, and limitations |
| Provenance | Source, variable, period, location, and processing are visible |
| Error handling | Invalid inputs, missing data, and API failures are handled clearly |
| Reproducibility | The same investigation inputs can be used to reproduce the result |
| Project usability | Setup instructions work and the app can be run locally |

For each row, report one of:
- **PASS** — implemented and tested; state the evidence.
- **PARTIAL** — partly implemented; explain what remains.
- **NOT DONE** — not implemented; explain what is needed.
- **BLOCKED** — cannot proceed without participant input, data, credentials, or another dependency.

### Final report format

When you finish a setup or implementation pass, report:

1. What you created or changed.
2. How to run the frontend and backend.
3. What was tested and the actual test results.
4. The scope-audit table above.
5. Any missing data, credentials, or participant decisions.
6. The next highest-priority actions, in order.

**Be honest about completion.** If the application is visually polished but does not acquire real NASA data and perform a valid statistical trend analysis, the challenge's core objective has not been achieved. Say so explicitly and identify the remaining work.

## 11. Official challenge reference

NASA's official challenge description:
https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/

The challenge describes the central deliverable as a tool that identifies Earth-science variables, acquires data for a region, visualizes a sufficiently long time series, calculates the rate of change, and tests trend significance. Keep implementation decisions aligned with that objective.
