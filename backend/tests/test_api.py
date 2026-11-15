from fastapi.testclient import TestClient

from app.config import SUPPORTED_VARIABLES
from app.main import app

client = TestClient(app)


def test_variable_catalog_has_per_variable_grid_resolution():
    assert SUPPORTED_VARIABLES["T2M"]["lat_resolution"] == 0.5
    assert SUPPORTED_VARIABLES["T2M"]["lon_resolution"] == 0.625
    assert SUPPORTED_VARIABLES["ALLSKY_SFC_SW_DWN"]["lat_resolution"] == 1.0
    assert SUPPORTED_VARIABLES["ALLSKY_SFC_SW_DWN"]["lon_resolution"] == 1.0
    for meta in SUPPORTED_VARIABLES.values():
        assert meta["source_url"].startswith("https://power.larc.nasa.gov/")
        assert meta["lineage_note"]


def test_variables_endpoint_exposes_catalog_bounds():
    response = client.get("/api/variables")
    assert response.status_code == 200
    body = response.json()
    catalog = body["catalog"]
    assert catalog["max_year"] == 2026
    assert catalog["latest_complete_year"] == 2025
    assert catalog["min_period_years"] == 5
    assert len(body["variables"]) == len(SUPPORTED_VARIABLES)


def test_investigate_rejects_years_before_variable_availability():
    # Solar irradiance starts in 1984 even though the global catalog starts in 1981.
    response = client.post(
        "/api/investigate",
        json={
            "variable": "ALLSKY_SFC_SW_DWN",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "start_year": 1981,
            "end_year": 1990,
        },
    )
    assert response.status_code == 400
    assert "1984" in response.json()["detail"]


def test_investigate_rejects_short_period():
    response = client.post(
        "/api/investigate",
        json={
            "variable": "T2M",
            "latitude": 9.0579,
            "longitude": 7.4951,
            "start_year": 2020,
            "end_year": 2023,
        },
    )
    assert response.status_code == 400
    assert "at least 5 years" in response.json()["detail"]
