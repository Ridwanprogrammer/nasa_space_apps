import math
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from scipy import stats
import pymannkendall as mk

from app.config import DEFAULT_FILL_VALUE, DEFAULT_ALPHA, MIN_COMPLETE_YEARS, SUPPORTED_VARIABLES
from app.models import (
    InvestigationRequest,
    MonthlyObservation,
    AnnualObservation,
    LinearRegressionResult,
    MannKendallResult,
    SensSlopeResult,
    ScientificFindings,
    ProvenanceMetadata,
    InvestigationResponse
)

class AnalysisError(Exception):
    """Raised when scientific analysis fails or dataset is insufficient."""
    pass

def parse_and_clean_observations(
    raw_payload: Dict[str, Any],
    variable: str,
    fill_value: float = DEFAULT_FILL_VALUE
) -> Tuple[List[MonthlyObservation], List[AnnualObservation], Dict[str, int]]:
    """
    Parses monthly parameters from NASA POWER payload, filters missing values,
    and calculates annual means with strict 12-month completeness checking.
    """
    param_dict = raw_payload.get("properties", {}).get("parameter", {}).get(variable, {})
    if not param_dict:
        raise AnalysisError(f"No data available for parameter '{variable}' in NASA payload.")

    monthly_records = []
    annual_buckets: Dict[int, List[float]] = {}
    
    total_months = 0
    valid_months = 0
    missing_months = 0

    # Sort keys chronologically (keys are YYYYMM, e.g., '199001', '199013')
    for key in sorted(param_dict.keys()):
        if len(key) != 6:
            continue
        
        try:
            year = int(key[:4])
            month = int(key[4:6])
        except ValueError:
            continue

        # Skip month 13 (NASA POWER's precomputed annual value; we compute our own rigorous annual mean)
        if month < 1 or month > 12:
            continue

        total_months += 1
        raw_val = param_dict[key]

        # Check for missing fill value
        if raw_val is None or raw_val <= -900.0 or raw_val == fill_value or math.isnan(raw_val):
            missing_months += 1
            continue

        valid_months += 1
        val = float(raw_val)

        monthly_records.append(
            MonthlyObservation(
                year=year,
                month=month,
                date_key=f"{year}-{month:02d}",
                value=round(val, 3)
            )
        )

        if year not in annual_buckets:
            annual_buckets[year] = []
        annual_buckets[year].append(val)

    # Aggregate annual means with strict completeness rule (requires all 12 valid months)
    annual_records = []
    for year in sorted(annual_buckets.keys()):
        months_vals = annual_buckets[year]
        count = len(months_vals)
        is_complete = (count == 12)
        
        if is_complete:
            mean_val = float(np.mean(months_vals))
            annual_records.append(
                AnnualObservation(
                    year=year,
                    value=round(mean_val, 3),
                    valid_months=count,
                    is_complete=True
                )
            )
        else:
            # If incomplete, record with whatever values exist but flag incomplete
            mean_val = float(np.mean(months_vals)) if count > 0 else 0.0
            annual_records.append(
                AnnualObservation(
                    year=year,
                    value=round(mean_val, 3),
                    valid_months=count,
                    is_complete=False
                )
            )

    stats_meta = {
        "total_months": total_months,
        "valid_months": valid_months,
        "missing_months": missing_months
    }

    return monthly_records, annual_records, stats_meta

def compute_linear_regression(years: np.ndarray, values: np.ndarray) -> LinearRegressionResult:
    """Computes OLS linear regression rate of change and R²."""
    res = stats.linregress(years, values)
    
    slope_per_year = float(res.slope)
    slope_per_decade = slope_per_year * 10.0
    intercept = float(res.intercept)
    r_squared = float(res.rvalue ** 2)
    p_val = float(res.pvalue)
    std_err = float(res.stderr) if res.stderr is not None else 0.0

    trend_line = [
        {"year": int(y), "trend": round(float(intercept + slope_per_year * y), 3)}
        for y in years
    ]

    return LinearRegressionResult(
        slope_per_year=round(slope_per_year, 5),
        slope_per_decade=round(slope_per_decade, 4),
        intercept=round(intercept, 4),
        r_squared=round(r_squared, 4),
        p_value=float(p_val),
        std_err=round(std_err, 5),
        trend_line=trend_line
    )

def compute_mann_kendall(values: np.ndarray, alpha: float = DEFAULT_ALPHA) -> MannKendallResult:
    """Computes non-parametric Mann-Kendall monotonic trend test."""
    mk_test = mk.original_test(values, alpha=alpha)
    
    # Normalize trend string
    trend_str = str(mk_test.trend).lower()
    if "inc" in trend_str:
        direction = "increasing"
    elif "dec" in trend_str:
        direction = "decreasing"
    else:
        direction = "no trend"

    return MannKendallResult(
        trend_direction=direction,
        is_significant=bool(mk_test.h),
        p_value=float(mk_test.p),
        z_score=round(float(mk_test.z), 4),
        tau=round(float(mk_test.Tau), 4),
        s_score=float(mk_test.s),
        alpha=alpha
    )

def compute_sens_slope(years: np.ndarray, values: np.ndarray) -> SensSlopeResult:
    """Computes robust Theil-Sen slope estimator with 95% confidence intervals."""
    res = stats.theilslopes(values, years, alpha=0.95)
    
    slope = float(res.slope)
    intercept = float(res.intercept)
    low_slope = float(res.low_slope)
    high_slope = float(res.high_slope)

    trend_line = [
        {"year": int(y), "trend": round(float(intercept + slope * y), 3)}
        for y in years
    ]

    return SensSlopeResult(
        slope_per_year=round(slope, 5),
        slope_per_decade=round(slope * 10.0, 4),
        intercept=round(intercept, 4),
        slope_min_ci=round(low_slope * 10.0, 4),
        slope_max_ci=round(high_slope * 10.0, 4),
        trend_line=trend_line
    )

def generate_scientific_findings(
    var_meta: Dict[str, Any],
    mk_res: MannKendallResult,
    sen_res: SensSlopeResult,
    ols_res: LinearRegressionResult,
    n_years: int,
    start_year: int,
    end_year: int
) -> ScientificFindings:
    """Produces objective, scientifically restrained plain-language findings."""
    units = var_meta["units"]
    rate_sign = "+" if sen_res.slope_per_decade > 0 else ""
    rate_str = f"{rate_sign}{sen_res.slope_per_decade:.3f} {units}/decade"

    # Significance phrasing
    if mk_res.is_significant:
        sig_str = (
            f"Statistically significant monotonic {mk_res.trend_direction} trend "
            f"(Mann–Kendall p = {mk_res.p_value:.4e} < 0.05, z = {mk_res.z_score:+.2f})."
        )
    else:
        sig_str = (
            f"No statistically significant monotonic trend detected "
            f"(Mann–Kendall p = {mk_res.p_value:.3f} >= 0.05, z = {mk_res.z_score:+.2f})."
        )

    ci_str = (
        f"Sen's robust trend estimator: {rate_str} "
        f"[95% Confidence Interval: {sen_res.slope_min_ci:+.3f} to {sen_res.slope_max_ci:+.3f} {units}/decade]. "
        f"OLS linear fit indicates {ols_res.slope_per_decade:+.3f} {units}/decade (R² = {ols_res.r_squared:.3f})."
    )

    summary = (
        f"Over the {n_years}-year period ({start_year}–{end_year}), annual mean {var_meta['name']} "
        f"exhibits an overall {mk_res.trend_direction} pattern at an estimated rate of {rate_str}. "
        f"{sig_str}"
    )

    return ScientificFindings(
        direction=mk_res.trend_direction.capitalize(),
        magnitude_rate=rate_str,
        significance_statement=sig_str,
        plain_language_summary=summary,
        confidence_interval_statement=ci_str
    )

def run_scientific_investigation(
    request: InvestigationRequest,
    raw_payload: Dict[str, Any],
    is_cached: bool,
    endpoint_url: str
) -> InvestigationResponse:
    """
    Orchestrates the entire scientific analysis pipeline from raw NASA observations
    to verified statistical metrics and scientific disclaimers.
    """
    var_meta = SUPPORTED_VARIABLES.get(request.variable, SUPPORTED_VARIABLES["T2M"])
    
    # 1. Parse and clean observations
    monthly_data, annual_data, stats_meta = parse_and_clean_observations(
        raw_payload, request.variable
    )

    # 2. Extract complete annual series for statistical testing
    complete_annual = [a for a in annual_data if a.is_complete]
    if len(complete_annual) < MIN_COMPLETE_YEARS:
        raise AnalysisError(
            f"Insufficient complete annual observations ({len(complete_annual)} years). "
            f"At least {MIN_COMPLETE_YEARS} complete years of observations are required to compute statistical trends."
        )

    years = np.array([a.year for a in complete_annual], dtype=float)
    values = np.array([a.value for a in complete_annual], dtype=float)

    # 3. Compute statistical tests
    ols_res = compute_linear_regression(years, values)
    mk_res = compute_mann_kendall(values, alpha=0.05)
    sen_res = compute_sens_slope(years, values)

    # 4. Generate scientific findings
    findings = generate_scientific_findings(
        var_meta, mk_res, sen_res, ols_res, len(complete_annual),
        int(years[0]), int(years[-1])
    )

    # 5. Build Provenance Metadata
    header = raw_payload.get("header", {})
    elevation = raw_payload.get("geometry", {}).get("coordinates", [None, None, None])
    elevation_val = elevation[2] if len(elevation) > 2 else None

    provenance = ProvenanceMetadata(
        source_mission=str(header.get("sources", ["NASA MERRA-2"])[0]),
        dataset_name=str(header.get("title", "NASA POWER Native Resolution")),
        variable_id=request.variable,
        variable_name=var_meta["name"],
        units=var_meta["units"],
        spatial_resolution=var_meta["spatial_resolution"],
        lat_resolution=var_meta["lat_resolution"],
        lon_resolution=var_meta["lon_resolution"],
        spatial_meaning=var_meta["spatial_meaning"],
        source_url=var_meta["source_url"],
        lineage_note=var_meta["lineage_note"],
        latitude=request.latitude,
        longitude=request.longitude,
        elevation_m=elevation_val,
        start_year=request.start_year,
        end_year=request.end_year,
        total_months_evaluated=stats_meta["total_months"],
        valid_months_count=stats_meta["valid_months"],
        missing_months_count=stats_meta["missing_months"],
        annual_observations_count=len(complete_annual),
        completeness_rule="100% complete (requires all 12 valid calendar months per annual mean)",
        api_endpoint=endpoint_url,
        retrieval_timestamp=raw_payload.get("_earthscope_metadata", {}).get("retrieved_at", "N/A"),
        is_cached=is_cached
    )

    limitations = [
        f"Source lineage: {var_meta['lineage_note']} NASA POWER is the distribution service; see {var_meta['source_url']}.",
        (
            f"Spatial representation: the retrieved value represents the average conditions of a single "
            f"{var_meta['lat_resolution']}° latitude × {var_meta['lon_resolution']}° longitude grid cell, "
            f"not an entire administrative province or country."
        ),
        (
            "Annual completeness: an annual mean is used only when all 12 calendar months are valid. "
            "Partial years (for example, the current year) are excluded from the trend statistics."
        ),
        "Temporal simplification: annual aggregation removes seasonal variability to isolate multi-decadal trends; it does not reflect seasonal shift timing or extreme daily heatwaves.",
        "Absence of causation: statistical trend tests (Mann-Kendall, Sen's slope) measure direction and rate of monotonic change; they do not establish causal climate mechanisms on their own."
    ]

    return InvestigationResponse(
        success=True,
        request=request,
        provenance=provenance,
        monthly_data=monthly_data,
        annual_data=annual_data,
        linear_regression=ols_res,
        mann_kendall=mk_res,
        sens_slope=sen_res,
        findings=findings,
        limitations=limitations
    )
