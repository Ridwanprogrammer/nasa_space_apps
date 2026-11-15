import pytest
import numpy as np
from app.analyzer import (
    compute_linear_regression,
    compute_mann_kendall,
    compute_sens_slope,
    parse_and_clean_observations,
    AnalysisError
)

def test_linear_regression_known_slope():
    years = np.array([2000, 2001, 2002, 2003, 2004, 2005], dtype=float)
    # y = 20.0 + 0.5 * (year - 2000) => slope = 0.5/yr, 5.0/decade
    values = np.array([20.0, 20.5, 21.0, 21.5, 22.0, 22.5], dtype=float)
    
    res = compute_linear_regression(years, values)
    assert pytest.approx(res.slope_per_year, 0.001) == 0.5
    assert pytest.approx(res.slope_per_decade, 0.01) == 5.0
    assert pytest.approx(res.r_squared, 0.001) == 1.0
    assert res.p_value < 0.001

def test_mann_kendall_strictly_increasing():
    # Monotonically increasing sequence should yield 'increasing' and h=True
    values = np.array([10.1, 10.4, 10.6, 11.0, 11.3, 11.8, 12.1, 12.5, 12.9, 13.2], dtype=float)
    mk_res = compute_mann_kendall(values, alpha=0.05)
    
    assert mk_res.trend_direction == "increasing"
    assert mk_res.is_significant is True
    assert mk_res.p_value < 0.01
    assert mk_res.tau > 0.8

def test_mann_kendall_no_trend():
    # Flat oscillating sequence
    values = np.array([25.0, 25.1, 24.9, 25.0, 25.1, 24.9, 25.0, 25.1, 24.9, 25.0], dtype=float)
    mk_res = compute_mann_kendall(values, alpha=0.05)
    
    assert mk_res.trend_direction == "no trend"
    assert mk_res.is_significant is False
    assert mk_res.p_value > 0.05

def test_sens_slope_outlier_robustness():
    years = np.array([2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009], dtype=float)
    # True slope is 0.2/year, but add a huge single outlier at 2004
    values = np.array([10.0, 10.2, 10.4, 10.6, 99.9, 11.0, 11.2, 11.4, 11.6, 11.8], dtype=float)
    
    sen_res = compute_sens_slope(years, values)
    # Theil-Sen estimator should be resilient to the single extreme outlier
    assert pytest.approx(sen_res.slope_per_year, abs=0.05) == 0.2
    assert pytest.approx(sen_res.slope_per_decade, abs=0.5) == 2.0
    # Lower and upper CI bounds must bracket the slope
    assert sen_res.slope_min_ci <= sen_res.slope_per_decade <= sen_res.slope_max_ci

def test_parse_and_clean_observations_fill_value_handling():
    mock_payload = {
        "properties": {
            "parameter": {
                "T2M": {
                    "200001": 25.0,
                    "200002": 26.0,
                    "200003": 27.0,
                    "200004": 28.0,
                    "200005": 27.0,
                    "200006": 26.0,
                    "200007": 25.0,
                    "200008": 25.0,
                    "200009": 26.0,
                    "200010": 27.0,
                    "200011": 26.0,
                    "200012": 25.0,
                    "200013": 25.9,  # Month 13 should be ignored
                    "200101": 25.0,
                    "200102": -999.0, # Missing fill value!
                    "200103": 27.0,
                    "200104": 28.0,
                    "200105": 27.0,
                    "200106": 26.0,
                    "200107": 25.0,
                    "200108": 25.0,
                    "200109": 26.0,
                    "200110": 27.0,
                    "200111": 26.0,
                    "200112": 25.0,
                }
            }
        }
    }

    monthly, annual, stats_meta = parse_and_clean_observations(mock_payload, "T2M")
    
    # 2000 has 12 valid months; 2001 has 11 valid months + 1 missing
    assert stats_meta["total_months"] == 24
    assert stats_meta["missing_months"] == 1
    assert stats_meta["valid_months"] == 23

    # Year 2000 should be marked complete
    year_2000 = next(a for a in annual if a.year == 2000)
    assert year_2000.is_complete is True
    assert year_2000.valid_months == 12

    # Year 2001 should be marked incomplete due to missing month
    year_2001 = next(a for a in annual if a.year == 2001)
    assert year_2001.is_complete is False
    assert year_2001.valid_months == 11
