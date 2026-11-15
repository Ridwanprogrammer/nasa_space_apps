<<<<<<< HEAD
# EarthScope — NASA Space Apps 2026

**Challenge:** Be An Earth System Trend Detective!

EarthScope is a scientific investigation workspace for the Earth system. Choose a NASA
POWER variable, a place, and a period; the app retrieves real observations for the
nearest grid cell, builds complete annual means, tests for a monotonic trend, and explains
the result in plain language.

No mock observations are used. Every displayed value comes from the NASA POWER Monthly
Point API or a local cache of a previous real request. The interface is deliberately
honest about what a grid cell, a reanalysis product, and a p-value can and cannot show.

---

## What the app does

- Retrieves **real NASA POWER** monthly observations for three variables:
  - Near-Surface Air Temperature (`T2M`)
  - Precipitation, bias-corrected (`PRECTOTCORR`)
  - All Sky Surface Downward Solar Irradiance (`ALLSKY_SFC_SW_DWN`)
- Computes **complete-year annual means** (all 12 months required) and excludes partial
  years from the statistics.
- Runs two independent tests:
  - **Mann–Kendall** for monotonic direction and significance.
  - **Sen's slope** for a robust rate of change with a 95% confidence interval.
  - OLS is available as a secondary reference line and R² diagnostic.
- Shows the **native grid cell** for the selected variable, with NASA nighttime-lights
  imagery for geographic context.
- Surfaces provenance, data lineage, resolution, completeness, and scientific caveats.
- Shares and reproduces an investigation through URL query parameters.
- Exports the annual data as CSV and the full investigation as JSON.
- Works with keyboard navigation, reduced-motion preferences, and mobile screen sizes.

The app has no authentication, database, or cloud infrastructure. A local FastAPI server
performs the NASA request and statistical analysis; the React client renders it.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, JavaScript + JSX, Tailwind CSS 4, Recharts, React Leaflet |
| Typography | IBM Plex Sans Variable + IBM Plex Mono via Fontsource |
| Icons | Lucide React |
| Backend | Python 3, FastAPI, uvicorn |
| Analysis | pandas, NumPy, SciPy, pymannkendall |
| Data | NASA POWER Monthly Point API, local JSON cache |
| Imagery | NASA GIBS VIIRS Black Marble (map), NASA Earth at Night (decorative) |

---

## Prerequisites

- **Python 3.11+** (3.14 was used during development)
- **Node.js 20+** and npm
- Internet access for the first NASA POWER request; repeated identical requests use the
  local cache

No API key or Earthdata login is required for NASA POWER.

---

## 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run the API server (http://127.0.0.1:8000):

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API docs: <http://127.0.0.1:8000/docs>

### Run the backend tests

From the repository root:

```powershell
python -m pytest -q
```

The suite covers the statistical functions against known inputs, fill-value handling,
per-variable year validation, catalog metadata, and cache behaviour.

---

## 2. Frontend

```powershell
cd frontend
npm install
```

Run the dev server (http://127.0.0.1:5173):

```powershell
npm run dev
```

The Vite dev server proxies `/api` to the backend on port 8000, so **start the backend
first**.

Other scripts:

```powershell
npm run build    # production build into frontend/dist
npm run preview  # serve the production build
npm run lint     # oxlint
```

---

## 3. Using the app

1. Open <http://127.0.0.1:5173>. The Abuja benchmark investigation runs automatically.
2. In the **Investigation setup** rail (or the mobile drawer), choose a variable, search
   the offline gazetteer, use browser geolocation, click a benchmark site, click the map,
   or type coordinates directly.
3. Choose a period with the quick ranges or the start/end year fields. Incomplete years
   are visibly held out of the trend statistics.
4. **Run investigation** and inspect:
   - the answer-first summary (direction, rate, significance, complete years, source);
   - the annual time series, optional OLS line, Sen's 95% confidence band, and the
     annual/monthly tables;
   - the native grid cell on the map;
   - the findings and "what this result does and does not establish" panel;
   - the provenance drawer for lineage, resolution, retrieval, and cache details.
5. Copy the reproducible link or export CSV/JSON from the summary or the mobile action
   bar.

### Reproducibility and URL state

The URL always carries the active query:

```text
?variable=T2M&lat=9.0579&lon=7.4951&start=1990&end=2023&place=Abuja%2C+Nigeria
```

Opening a valid link restores and runs that investigation. A malformed link is rejected
with a visible explanation and a **Load benchmark** recovery action instead of being
silently clamped to a different place.

---

## Project structure

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI routes, validation, catalog, presets
│   │   ├── config.py       # Variable catalog, availability, resolutions, lineage
│   │   ├── models.py       # Pydantic request/response models
│   │   ├── nasa_client.py  # NASA POWER fetch + disk cache
│   │   └── analyzer.py     # Aggregation, trend tests, data-driven caveats
│   ├── data/
│   │   ├── raw/            # Cached NASA responses (git-ignored)
│   │   └── processed/      # Reserved for processed outputs
│   └── tests/              # pytest suite
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx                   # State, URL sync, request lifecycle, layout
        ├── components/               # Sidebar, chart, map, findings, provenance, modal
        ├── data/locations.js         # Offline gazetteer (148 places)
        ├── utils/api.js              # Fetch wrapper with abort/timeout handling
        ├── utils/url.js              # URL parsing/building and selection comparison
        └── assets/                   # Local NASA Earth at Night image
```

---

## Data provenance

| Variable | Lineage | Native grid | Availability |
|---|---|---|---|
| `T2M` | NASA MERRA-2 reanalysis via NASA POWER | 0.5° × 0.625° | 1981–2026 |
| `PRECTOTCORR` | NASA MERRA-2 reanalysis via NASA POWER | 0.5° × 0.625° | 1981–2026 |
| `ALLSKY_SFC_SW_DWN` | NASA POWER source-native blend of FLASHFlux, CERES, and MERRA-2 | 1.0° × 1.0° | 1984–2026 |

- **API:** NASA POWER Monthly & Annual Point API v2,
  <https://power.larc.nasa.gov/docs/services/api/temporal/monthly/>
- **Monthly coverage:** data extend into 2026. **2025 is the latest complete calendar
  year**, and partial years are excluded from annual statistics.
- **Fill value:** `-999.0`, excluded from every calculation.
- **Annual rule:** an annual mean requires all 12 valid calendar months.
- **Cache:** successful raw responses are stored under `backend/data/raw/`; the source
  badge reports **Cached** or **Live**.

See `ASSETS.md` for the full data-source, palette, imagery, font, and gazetteer record.

---

## Scientific limitations

- MERRA-2 is a model-based reanalysis constrained by observations, not a direct
  thermometer reading at every coordinate.
- Solar irradiance is satellite-derived or modeled, not a ground-based pyranometer
  reading at the query point.
- Results describe one native grid cell, not an area-weighted administrative average.
- Annual aggregation removes the seasonal cycle; it does not capture seasonal shifts,
  timing changes, or extreme events.
- Mann–Kendall and Sen's slope establish direction, rate, and statistical significance —
  not causation.
- A short period, missing months, or a low number of complete years weakens inference;
  the app reports completeness and caveats alongside the result.

These caveats also appear in the app's **Methods** modal, findings panel, and provenance
drawer.
=======
# nasa_space_apps
>>>>>>> 3036fe39a0b862e448a8ee2e439c84d144d517af
