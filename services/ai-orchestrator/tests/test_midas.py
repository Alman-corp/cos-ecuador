import pytest
import pandas as pd
import numpy as np
import sys
sys.path.insert(0, '..')
from engines.macro.midas import MIDASEngine, MIDASResult


class TestMIDASEngine:
    def setup_method(self):
        self.engine = MIDASEngine(max_lags=4)
        np.random.seed(42)
        n_quarters = 24
        n_months = 72
        quarters = pd.date_range('2020-01-01', '2025-10-01', freq='Q')

        self.gdp = np.array(
            25 + np.arange(n_quarters) * 0.15 + np.random.randn(n_quarters) * 0.2
        )
        self.oil = np.array(
            70 + np.arange(n_months) * 0.08 + np.random.randn(n_months) * 3
        )
        self.tax = np.array(
            1200 + np.arange(n_months) * 8 + np.random.randn(n_months) * 60
        )

    def test_umidas_returns_valid_result(self):
        result = self.engine.estimate_umidas(
            y=self.gdp,
            X_dict={"oil": self.oil, "tax": self.tax},
        )
        assert isinstance(result, MIDASResult)
        assert result.r_squared > 0.3
        assert result.rmse < 5.0
        assert result.mape < 20.0
        assert result.nowcast > 0

    def test_nowcast_returns_midas_result(self):
        self.engine.estimate_umidas(
            y=self.gdp,
            X_dict={"oil": self.oil, "tax": self.tax},
        )
        result = self.engine.nowcast()
        assert isinstance(result, MIDASResult)
        assert result.nowcast > 0

    def test_nowcast_confidence_interval(self):
        self.engine.estimate_umidas(
            y=self.gdp,
            X_dict={"oil": self.oil, "tax": self.tax},
        )
        result = self.engine.nowcast()
        assert result.lower_ci < result.nowcast < result.upper_ci
        assert result.upper_ci - result.lower_ci > 0

    def test_feature_importance_returns_dict(self):
        imp = self.engine.get_feature_importance(
            y=self.gdp,
            X_dict={"oil": self.oil, "tax": self.tax},
        )
        assert isinstance(imp, dict)
        assert len(imp) > 0
        for k, v in imp.items():
            assert 0.0 <= v <= 1.0

    def test_coefficients_in_result(self):
        result = self.engine.estimate_umidas(
            y=self.gdp,
            X_dict={"oil": self.oil, "tax": self.tax},
        )
        assert len(result.coefficients) > 0

    def test_backtest_expanding_window(self):
        result = self.engine._backtest_expanding_window(
            y=self.gdp,
            X_dict={"oil": self.oil, "tax": self.tax},
            initial_window=8,
            step=2,
        )
        assert isinstance(result, MIDASResult)
        assert len(result.predictions) > 0
        assert len(result.actuals) > 0

    def test_predictions_and_actuals_aligned(self):
        result = self.engine.estimate_umidas(
            y=self.gdp,
            X_dict={"oil": self.oil, "tax": self.tax},
        )
        assert len(result.predictions) > 0
        assert len(result.actuals) > 0
        assert len(result.predictions) == len(result.actuals)
