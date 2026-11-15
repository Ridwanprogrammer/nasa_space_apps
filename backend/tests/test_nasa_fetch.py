import asyncio
import pytest
from app.nasa_client import fetch_nasa_power_monthly_data, NASADataFetchError

def test_nasa_power_invalid_variable():
    with pytest.raises(NASADataFetchError, match="Unsupported variable"):
        asyncio.run(
            fetch_nasa_power_monthly_data(
                variable="NONEXISTENT_VAR",
                latitude=9.0,
                longitude=7.0,
                start_year=2000,
                end_year=2005
            )
        )

def test_nasa_power_inverted_years():
    with pytest.raises(NASADataFetchError, match="cannot be greater than end year"):
        asyncio.run(
            fetch_nasa_power_monthly_data(
                variable="T2M",
                latitude=9.0,
                longitude=7.0,
                start_year=2010,
                end_year=2000
            )
        )

def test_nasa_power_real_query():
    # Query small 3-year window for Abuja, Nigeria to test real API connectivity and caching
    payload, is_cached_1, url_1 = asyncio.run(
        fetch_nasa_power_monthly_data(
            variable="T2M",
            latitude=9.0579,
            longitude=7.4951,
            start_year=2015,
            end_year=2017
        )
    )
    assert "properties" in payload
    assert "T2M" in payload["properties"]["parameter"]
    assert len(payload["properties"]["parameter"]["T2M"]) >= 36

    # Immediate second query should hit local disk cache
    cached_payload, is_cached_2, url_2 = asyncio.run(
        fetch_nasa_power_monthly_data(
            variable="T2M",
            latitude=9.0579,
            longitude=7.4951,
            start_year=2015,
            end_year=2017
        )
    )
    assert is_cached_2 is True
    assert "local_cache://" in url_2
