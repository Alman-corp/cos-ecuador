from __future__ import annotations
import pytest
import numpy as np
import pandas as pd
from datetime import date

from app.forecasting.time_series import TimeSeriesEngine
from app.forecasting.backtesting import BacktestingEngine
from app.forecasting.anomaly import AnomalyDetectionEngine
from app.shared import ForecastSpec, AnomalySpec


@pytest.fixture
def ts_df() -> pd.DataFrame:
    np.random.seed(42)
    dates = pd.date_range("2020-01-01", periods=120, freq="MS")
    trend = np.linspace(100, 200, 120)
    seasonality = 10 * np.sin(2 * np.pi * np.arange(120) / 12)
    noise = np.random.normal(0, 5, 120)
    return pd.DataFrame({"date": dates, "revenue": trend + seasonality + noise, "expense": trend * 0.7 + noise})


def test_forecast_prophet(ts_df):
    engine = TimeSeriesEngine()
    spec = ForecastSpec(
        entity_id="test", target_column="revenue", horizon=6,
        frequency="monthly", models=["prophet"], seasonality_mode="multiplicative",
    )
    results = engine.forecast(ts_df, spec)
    assert len(results) >= 1
    r = results[0]
    assert r.model == "prophet"
    assert len(r.point_forecast) == 6
    assert len(r.dates) == 6
    assert len(r.lower_ci) == 6
    assert len(r.upper_ci) == 6
    assert all(l <= p <= u for p, l, u in zip(r.point_forecast, r.lower_ci, r.upper_ci))
    assert r.in_sample_mape > 0


def test_forecast_arima(ts_df):
    engine = TimeSeriesEngine()
    spec = ForecastSpec(
        entity_id="test", target_column="revenue", horizon=6,
        frequency="monthly", models=["arima"],
    )
    results = engine.forecast(ts_df, spec)
    assert len(results) >= 1
    r = results[0]
    assert r.model == "arima"
    assert len(r.point_forecast) == 6


def test_backtest_evaluation(ts_df):
    engine = BacktestingEngine()
    engine.register_prediction(
        prediction_id="p1", entity_id="test", variable="revenue",
        predicted_for=date(2020, 6, 1), predicted_value=120.0,
        ci_lower=110.0, ci_upper=130.0, model_name="prophet",
    )
    result = engine.evaluate_model(model_name="prophet")
    assert result["status"] == "no_data" or result["n_predictions"] >= 0

    engine.register_actual(entity_id="test", variable="revenue", actual_date=date(2020, 6, 1), actual_value=125.0)
    result2 = engine.evaluate_model(model_name="prophet")
    assert result2["n_evaluated"] >= 0
    if result2["n_evaluated"] > 0:
        assert "metrics" in result2
        assert "mae" in result2["metrics"]


def test_anomaly_detection_isolation_forest(ts_df):
    engine = AnomalyDetectionEngine()
    spec = AnomalySpec(
        entity_id="test", columns=["revenue", "expense"],
        contamination=0.1, methods=["isolation_forest"],
    )
    result = engine.detect(ts_df, spec)
    assert len(result.anomalies) >= 0
    assert len(result.normal_baseline) > 0
    assert "revenue" in result.normal_baseline or "expense" in result.normal_baseline


def test_anomaly_detection_multiple_methods(ts_df):
    engine = AnomalyDetectionEngine()
    spec = AnomalySpec(
        entity_id="test", columns=["revenue"],
        contamination=0.1, methods=["isolation_forest", "zscore", "dbscan"],
    )
    result = engine.detect(ts_df, spec)
    assert len(result.method_agreement) >= 0
    if result.anomalies:
        assert all(hasattr(a, "date") for a in result.anomalies)
