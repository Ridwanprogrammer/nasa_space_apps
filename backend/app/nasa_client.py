import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple
import httpx

from app.config import (
    RAW_DATA_DIR,
    NASA_POWER_BASE_URL,
    DEFAULT_FILL_VALUE,
    SUPPORTED_VARIABLES
)

logger = logging.getLogger("earthscope.nasa_client")

class NASADataFetchError(Exception):
    """Raised when data retrieval from NASA POWER fails."""
    pass

def get_cache_file_path(variable: str, lat: float, lon: float, start_year: int, end_year: int) -> Path:
    # Round coordinates to 4 decimal places for stable cache keying
    sanitized_lat = f"{lat:.4f}"
    sanitized_lon = f"{lon:.4f}"
    filename = f"{variable}_{sanitized_lat}_{sanitized_lon}_{start_year}_{end_year}.json"
    return RAW_DATA_DIR / filename

async def fetch_nasa_power_monthly_data(
    variable: str,
    latitude: float,
    longitude: float,
    start_year: int,
    end_year: int,
    force_refresh: bool = False
) -> Tuple[Dict[str, Any], bool, str]:
    """
    Fetches monthly time series from NASA POWER API with local disk caching.
    
    Returns:
        (raw_payload_dict, is_cached_flag, endpoint_url)
    """
    if variable not in SUPPORTED_VARIABLES:
        raise NASADataFetchError(f"Unsupported variable '{variable}'. Supported: {list(SUPPORTED_VARIABLES.keys())}")

    if start_year > end_year:
        raise NASADataFetchError(f"Start year ({start_year}) cannot be greater than end year ({end_year}).")

    cache_path = get_cache_file_path(variable, latitude, longitude, start_year, end_year)
    
    # 1. Check local cache
    if not force_refresh and cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
            logger.info(f"Loaded NASA observation data from local cache: {cache_path.name}")
            return cached_data, True, f"local_cache://{cache_path.name}"
        except Exception as e:
            logger.warning(f"Failed to read cache file {cache_path}: {e}. Refetching from NASA API.")

    # 2. Query official NASA POWER Monthly API
    params = {
        "parameters": variable,
        "community": "AG",
        "longitude": f"{longitude:.4f}",
        "latitude": f"{latitude:.4f}",
        "format": "JSON",
        "start": str(start_year),
        "end": str(end_year)
    }

    url = NASA_POWER_BASE_URL
    logger.info(f"Querying NASA POWER API: {url} with params {params}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                params=params,
                headers={"User-Agent": "EarthScope-NASA-SpaceApps/1.0 (Scientific Research Client)"}
            )
            
            if response.status_code != 200:
                error_msg = f"NASA POWER API returned HTTP {response.status_code}: {response.text[:200]}"
                logger.error(error_msg)
                raise NASADataFetchError(error_msg)

            data = response.json()

    except httpx.RequestError as exc:
        raise NASADataFetchError(f"Network error connecting to NASA POWER service: {str(exc)}")
    except json.JSONDecodeError as exc:
        raise NASADataFetchError(f"Invalid JSON returned by NASA POWER API: {str(exc)}")

    # 3. Validate response structure
    try:
        properties = data["properties"]
        parameter_data = properties["parameter"][variable]
        if not parameter_data:
            raise NASADataFetchError(f"No observation data points returned for variable '{variable}'.")
    except KeyError as exc:
        raise NASADataFetchError(f"Unexpected response structure from NASA POWER API: Missing key {exc}")

    # Attach retrieval metadata
    data["_earthscope_metadata"] = {
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "query_url": str(response.url),
        "variable": variable,
        "coordinates": {"latitude": latitude, "longitude": longitude},
        "period": {"start_year": start_year, "end_year": end_year}
    }

    # 4. Save to local disk cache
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved real NASA data to cache: {cache_path.name}")
    except Exception as e:
        logger.error(f"Failed to save data to disk cache: {e}")

    return data, False, str(response.url)
