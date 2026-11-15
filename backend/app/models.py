from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class InvestigationRequest(BaseModel):
    variable: str = Field(default="T2M", description="NASA Variable ID (e.g., T2M, PRECTOTCORR)")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees (-90 to +90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees (-180 to +180)")
    start_year: int = Field(default=1990, ge=1981, le=2026, description="Start year")
    end_year: int = Field(default=2023, ge=1981, le=2026, description="End year")

class MonthlyObservation(BaseModel):
    year: int
    month: int
    date_key: str  # YYYY-MM
    value: float   # observed value

class AnnualObservation(BaseModel):
    year: int
    value: float
    valid_months: int
    is_complete: bool

class LinearRegressionResult(BaseModel):
    slope_per_year: float
    slope_per_decade: float
    intercept: float
    r_squared: float
    p_value: float
    std_err: float
    trend_line: List[Dict[str, Any]]

class MannKendallResult(BaseModel):
    trend_direction: str  # "increasing", "decreasing", "no trend"
    is_significant: bool
    p_value: float
    z_score: float
    tau: float
    s_score: float
    alpha: float = 0.05

class SensSlopeResult(BaseModel):
    slope_per_year: float
    slope_per_decade: float
    intercept: float
    slope_min_ci: float  # 95% CI lower bound
    slope_max_ci: float  # 95% CI upper bound
    trend_line: List[Dict[str, Any]]

class ScientificFindings(BaseModel):
    direction: str
    magnitude_rate: str
    significance_statement: str
    plain_language_summary: str
    confidence_interval_statement: str

class ProvenanceMetadata(BaseModel):
    source_mission: str
    dataset_name: str
    variable_id: str
    variable_name: str
    units: str
    spatial_resolution: str
    lat_resolution: float
    lon_resolution: float
    spatial_meaning: str
    source_url: str
    lineage_note: str
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    start_year: int
    end_year: int
    total_months_evaluated: int
    valid_months_count: int
    missing_months_count: int
    annual_observations_count: int
    completeness_rule: str
    api_endpoint: str
    retrieval_timestamp: str
    is_cached: bool

class InvestigationResponse(BaseModel):
    success: bool
    request: InvestigationRequest
    provenance: ProvenanceMetadata
    monthly_data: List[MonthlyObservation]
    annual_data: List[AnnualObservation]
    linear_regression: LinearRegressionResult
    mann_kendall: MannKendallResult
    sens_slope: SensSlopeResult
    findings: ScientificFindings
    limitations: List[str]
