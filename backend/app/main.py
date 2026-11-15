import logging
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import (
    SUPPORTED_VARIABLES,
    MIN_YEAR,
    MAX_YEAR,
    LATEST_COMPLETE_YEAR,
    MIN_PERIOD_YEARS,
    MIN_COMPLETE_YEARS,
    DEFAULT_ALPHA,
)
from app.models import (
    InvestigationRequest,
    InvestigationResponse
)
from app.nasa_client import (
    fetch_nasa_power_monthly_data,
    NASADataFetchError
)
from app.analyzer import (
    run_scientific_investigation,
    AnalysisError
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("earthscope.main")

app = FastAPI(
    title="EarthScope API",
    description="NASA Space Apps 2026 - Earth System Trend Detective Analysis Engine",
    version="1.0.0"
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRESETS = [
    {
        "id": "abuja-nigeria",
        "name": "Abuja, Nigeria (Challenge Benchmark)",
        "latitude": 9.0579,
        "longitude": 7.4951,
        "default_start": 1990,
        "default_end": 2023,
        "context": "Tropical wet-and-dry climate in West Africa. Starting investigation case."
    },
    {
        "id": "lagos-nigeria",
        "name": "Lagos Coastal, Nigeria",
        "latitude": 6.5244,
        "longitude": 3.3792,
        "default_start": 1990,
        "default_end": 2023,
        "context": "Coastal Gulf of Guinea megacity experiencing maritime boundary layer warming."
    },
    {
        "id": "sahel-niamey",
        "name": "Sahel Semi-Arid (Niamey, Niger)",
        "latitude": 13.5116,
        "longitude": 2.1254,
        "default_start": 1985,
        "default_end": 2023,
        "context": "Semi-arid Sahelian belt sensitive to precipitation swings and desertification."
    },
    {
        "id": "svalbard-arctic",
        "name": "Longyearbyen, Svalbard (Arctic)",
        "latitude": 78.2232,
        "longitude": 15.6267,
        "default_start": 1985,
        "default_end": 2023,
        "context": "High-latitude Arctic amplification testbed experiencing rapid polar warming."
    },
    {
        "id": "manaus-amazon",
        "name": "Manaus, Amazon Rainforest",
        "latitude": -3.1190,
        "longitude": -60.0217,
        "default_start": 1985,
        "default_end": 2023,
        "context": "Equatorial rainforest interior exhibiting temperature and precipitation trends."
    }
]

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "EarthScope Scientific Analysis Engine",
        "supported_variables": list(SUPPORTED_VARIABLES.keys()),
        "data_availability": {
            "min_year": MIN_YEAR,
            "max_year": MAX_YEAR,
            "latest_complete_year": LATEST_COMPLETE_YEAR,
        },
        "challenge": "NASA Space Apps 2026: Be An Earth System Trend Detective!"
    }

@app.get("/api/variables")
async def list_variables():
    return {
        "variables": list(SUPPORTED_VARIABLES.values()),
        "catalog": {
            "min_year": MIN_YEAR,
            "max_year": MAX_YEAR,
            "latest_complete_year": LATEST_COMPLETE_YEAR,
            "min_period_years": MIN_PERIOD_YEARS,
            "min_complete_years": MIN_COMPLETE_YEARS,
            "alpha": DEFAULT_ALPHA,
        }
    }

@app.get("/api/presets")
async def list_presets():
    return {
        "presets": PRESETS
    }

@app.post("/api/investigate", response_model=InvestigationResponse)
async def investigate(req: InvestigationRequest):
    logger.info(f"Received investigation request: {req}")

    # Validate variable
    if req.variable not in SUPPORTED_VARIABLES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported variable '{req.variable}'. Supported: {list(SUPPORTED_VARIABLES.keys())}"
        )

    var_meta = SUPPORTED_VARIABLES[req.variable]

    # Validate coordinate bounds
    if not (-90.0 <= req.latitude <= 90.0):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90 degrees.")
    if not (-180.0 <= req.longitude <= 180.0):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180 degrees.")
    if req.start_year > req.end_year:
        raise HTTPException(
            status_code=400,
            detail=f"Start year ({req.start_year}) cannot be greater than end year ({req.end_year})."
        )
    if req.start_year < var_meta["min_year"] or req.end_year > var_meta["max_year"]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{req.variable} data are available from {var_meta['min_year']} to {var_meta['max_year']} "
                f"(received {req.start_year}-{req.end_year})."
            )
        )
    if (req.end_year - req.start_year) < (MIN_PERIOD_YEARS - 1):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Analysis period must span at least {MIN_PERIOD_YEARS} years "
                f"(got {req.end_year - req.start_year + 1} years)."
            )
        )

    try:
        # 1. Acquire real NASA data (with disk caching)
        raw_payload, is_cached, endpoint_url = await fetch_nasa_power_monthly_data(
            variable=req.variable,
            latitude=req.latitude,
            longitude=req.longitude,
            start_year=req.start_year,
            end_year=req.end_year
        )

        # 2. Run scientific analysis pipeline
        result = run_scientific_investigation(
            request=req,
            raw_payload=raw_payload,
            is_cached=is_cached,
            endpoint_url=endpoint_url
        )

        return result

    except NASADataFetchError as e:
        logger.error(f"NASA data acquisition error: {e}")
        raise HTTPException(status_code=502, detail=str(e))
    except AnalysisError as e:
        logger.error(f"Scientific analysis error: {e}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected internal error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal analysis failure: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
