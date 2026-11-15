import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Ensure directories exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

# NASA POWER Monthly Point Endpoint
NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
NASA_POWER_VIEWER_URL = "https://power.larc.nasa.gov/data-access-viewer/"

# Scientific defaults
DEFAULT_FILL_VALUE = -999.0
DEFAULT_ALPHA = 0.05  # Significance threshold

# Data availability. NASA POWER monthly data currently extend through 2026;
# the most recent complete calendar year is 2025. Incomplete years are held
# out of the annual statistics by the 12-month completeness rule.
MIN_YEAR = 1981
MAX_YEAR = 2026
LATEST_COMPLETE_YEAR = 2025
MIN_PERIOD_YEARS = 5
MIN_COMPLETE_YEARS = 5

# Variable catalog with scientific lineage and metadata.
# lat_resolution / lon_resolution are the native NASA POWER grid dimensions in
# decimal degrees and drive the spatial footprint drawn by the interface.
SUPPORTED_VARIABLES = {
    "T2M": {
        "id": "T2M",
        "name": "Near-Surface Air Temperature",
        "standard_name": "temperature_at_2_meters",
        "units": "°C",
        "source": "NASA MERRA-2 Reanalysis (via NASA POWER)",
        "source_url": NASA_POWER_VIEWER_URL,
        "lineage_note": (
            "MERRA-2 is a reanalysis: an atmospheric assimilation model constrained by "
            "satellite, aircraft, and surface observations. It is not a direct in-situ "
            "thermometer recording at every coordinate."
        ),
        "spatial_resolution": "0.5° latitude × 0.625° longitude",
        "lat_resolution": 0.5,
        "lon_resolution": 0.625,
        "spatial_meaning": "Single reanalysis grid cell centered near query point (not an area-wide administrative average)",
        "temporal_resolution": "Monthly observations aggregated to annual means",
        "min_year": 1981,
        "max_year": MAX_YEAR,
        "description": "Temperature of air at 2 meters above the surface, simulated by the GMAO MERRA-2 assimilation system constrained by satellite, aircraft, and surface meteorological observations."
    },
    "PRECTOTCORR": {
        "id": "PRECTOTCORR",
        "name": "Precipitation (Bias-Corrected)",
        "standard_name": "precipitation_corrected",
        "units": "mm/day",
        "source": "NASA MERRA-2 Reanalysis (via NASA POWER)",
        "source_url": NASA_POWER_VIEWER_URL,
        "lineage_note": (
            "Bias-corrected precipitation is a modeled MERRA-2 reanalysis product, not a "
            "direct rain-gauge measurement at the query point. Convective precipitation in "
            "particular carries larger uncertainty at the grid scale."
        ),
        "spatial_resolution": "0.5° latitude × 0.625° longitude",
        "lat_resolution": 0.5,
        "lon_resolution": 0.625,
        "spatial_meaning": "Single reanalysis grid cell precipitation rate",
        "temporal_resolution": "Monthly mean daily precipitation",
        "min_year": 1981,
        "max_year": MAX_YEAR,
        "description": "Corrected total surface precipitation flux from MERRA-2 reanalysis."
    },
    "ALLSKY_SFC_SW_DWN": {
        "id": "ALLSKY_SFC_SW_DWN",
        "name": "All Sky Surface Downward Solar Irradiance",
        "standard_name": "surface_solar_irradiance",
        "units": "kW-hr/m²/day",
        "source": "NASA FLASHFlux / CERES / MERRA-2 (via NASA POWER)",
        "source_url": NASA_POWER_VIEWER_URL,
        "lineage_note": (
            "Surface solar irradiance blends NASA FLASHFlux, CERES, and MERRA-2 products. "
            "It is modeled or satellite-derived, not a direct ground-based pyranometer "
            "reading at the query point."
        ),
        "spatial_resolution": "1.0° latitude × 1.0° longitude",
        "lat_resolution": 1.0,
        "lon_resolution": 1.0,
        "spatial_meaning": "Surface solar insolation flux on horizontal surface",
        "temporal_resolution": "Monthly mean daily insolation",
        "min_year": 1984,
        "max_year": MAX_YEAR,
        "description": "Total downward shortwave solar flux reaching the Earth's surface under all-sky conditions."
    }
}
