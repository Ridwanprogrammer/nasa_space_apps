# EarthScope Visual Assets & Data Provenance

EarthScope displays only real NASA POWER observations (or a local cache of a previous
real request). It does not generate synthetic observations, interpolate missing months,
or substitute illustrative values for results.

## NASA data sources

| Variable | Product and lineage | Native grid | Availability |
|---|---|---|---|
| `T2M` — Near-Surface Air Temperature | NASA MERRA-2 reanalysis via NASA POWER | 0.5° latitude × 0.625° longitude | 1981–2026 |
| `PRECTOTCORR` — Precipitation (Bias-Corrected) | NASA MERRA-2 reanalysis via NASA POWER | 0.5° latitude × 0.625° longitude | 1981–2026 |
| `ALLSKY_SFC_SW_DWN` — All Sky Surface Downward Solar Irradiance | NASA POWER source-native product blending FLASHFlux, CERES, and MERRA-2 | 1.0° latitude × 1.0° longitude | 1984–2026 |

- **API provider:** NASA POWER Monthly & Annual Point API v2
  (<https://power.larc.nasa.gov/docs/services/api/temporal/monthly/>)
- **Data access viewer:** <https://power.larc.nasa.gov/data-access-viewer/>
- **Temporal input:** monthly values, aggregated to annual means only when all 12
  calendar months are valid.
- **Fill value:** `-999.0`, treated as missing and excluded.
- **Latest complete year:** 2025. Months in 2026 are available, but a partial year is
  never used in the trend statistics.
- **Caching:** the backend stores successful raw responses under `backend/data/raw/`
  and reuses them for identical requests. The interface labels cached responses.

MERRA-2 is a model-based reanalysis constrained by satellite, aircraft, and surface
observations. It is not a direct in-situ thermometer or rain gauge at every coordinate.
Solar irradiance is modeled or satellite-derived, not a ground-based pyranometer
reading at the query point. These limitations are shown in the app's methodology,
findings, and provenance panels.

## Visual assets & attribution

### Palette — Ink & Solar Amber

| Token | Value | Use |
|---|---|---|
| Base | `#0B0F14` | Page background |
| Surface | `#121820` | Cards and sidebar |
| Raised | `#1A222C` | Hover and nested surfaces |
| Line | `#2A3542` | Borders and dividers |
| Ink | `#ECF1F5` | Primary text |
| Inverse | `#0B0F14` | Text on amber |
| Muted | `#9AA7B4` | Secondary text |
| Accent | `#F2A93B` | Brand, selection, focus, trend, CTA |
| Accent deep | `#C97F1E` | Amber hover |
| Cool | `#6FA8C9` | OLS reference line only |
| Significant | `#4ADE80` | Statistically significant results only |
| Danger | `#EF4444` | Errors and invalid input |

Semantic colors are never used alone: direction is always shown with an arrow **and** a
word, and significance is always shown with the word **Significant** or **Not
significant** plus the p-value.

### Typography

- **IBM Plex Sans Variable** and **IBM Plex Mono**, installed locally through
  `@fontsource-variable/ibm-plex-sans` and `@fontsource/ibm-plex-mono`.
- License: SIL Open Font License 1.1. No runtime font requests are made to Google Fonts
  or other third-party font services.

### Icons

- **Lucide React** icons, ISC License (<https://lucide.dev/license>).

### NASA imagery

- **Header and empty-state image:** `frontend/src/assets/nasa-earth-at-night.jpg`,
  a local copy of NASA's **Earth at Night / VIIRS City Lights 2012** imagery served by
  NASA GIBS (<https://gibs.earthdata.nasa.gov/>). Used decoratively; it is not a data
  layer and is labeled as such in the interface.
- **Map tiles:** NASA GIBS WMTS `VIIRS_Black_Marble` (Suomi NPP nighttime lights),
  `GoogleMapsCompatible_Level8`, EPSG:3857, max native zoom 8. Tiles are loaded directly
  from GIBS at runtime and credited in the map panel. No API key is required.
- The map imagery is contextual only. The dashed rectangle marks the native NASA POWER
  grid cell; tile brightness does not encode the selected variable.

### Offline location gazetteer

- `frontend/src/data/locations.js` contains **148 hand-curated cities and
  climate-reference sites** with approximate coordinates, region labels, and aliases.
- It supports search without a network request or a third-party geocoding service.
  Coordinates are city or site centers, not official boundaries.
- Browser geolocation is optional and only runs after the user presses **Use my
  location**. The coordinates stay in the browser and are sent to the local FastAPI
  backend only to perform the requested NASA POWER query.

## Attribution and disclaimer

NASA POWER, MERRA-2, CERES, FLASHFlux, VIIRS, and NASA GIBS are products of NASA and
its partners. EarthScope is an independent challenge entry and is not endorsed by NASA.
See the in-app **Methods** modal and provenance panel for the scientific caveats attached
to each result.
