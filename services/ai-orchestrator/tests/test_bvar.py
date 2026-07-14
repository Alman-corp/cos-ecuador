import pytest
import numpy as np
import sys
sys.path.insert(0, '..')
from engines.macro.bvar import BVAREngine


class TestBVAREngine:
    def setup_method(self):
        self.engine = BVAREngine(
            variables=["gdp", "inflation", "rate"],
            lags=2,
            n_draws=200,
            n_burnin=50,
        )
        np.random.seed(42)
        n = 60
        self.data = {
            "gdp": np.cumsum(np.random.randn(n) * 0.5) + 100,
            "inflation": np.cumsum(np.random.randn(n) * 0.2) + 2,
            "rate": np.cumsum(np.random.randn(n) * 0.1) + 5,
        }

    def test_estimate_returns_bvar_output(self):
        output = self.engine.estimate(data=self.data, lags=2, prior_tightness=0.1)
        assert output.status == "success"
        assert output.n_vars == 3
        assert output.lags == 2
        assert output.n_obs > 0
        assert "aic" in output.information_criteria

    def test_forecast_returns_list(self):
        self.engine.estimate(data=self.data, lags=2)
        forecasts = self.engine.forecast(horizon=4)
        assert len(forecasts) == 3
        for fc in forecasts:
            assert len(fc.forecast) == 4
            assert len(fc.lower_68) == 4
            assert len(fc.upper_68) == 4
            assert len(fc.lower_95) == 4
            assert len(fc.upper_95) == 4

    def test_impulse_response_shape(self):
        self.engine.estimate(data=self.data, lags=2)
        irf = self.engine.impulse_response("gdp", shock_size=1.0, horizon=12)
        assert len(irf) == 3
        for var_name, resp in irf.items():
            assert resp.shock_variable == "gdp"
            assert resp.horizon == 12
            assert len(resp.response_variables) == 3

    def test_conditional_forecast(self):
        self.engine.estimate(data=self.data, lags=2)
        conditions = {"rate": [5.5, 5.75, 6.0, 6.0]}
        result = self.engine.conditional_forecast(horizon=4, conditions=conditions)
        assert len(result) == 3
        rate_fc = [f for f in result if f.variable == "rate"][0]
        assert len(rate_fc.forecast) == 4

    def test_variance_decomposition(self):
        self.engine.estimate(data=self.data, lags=2)
        vd = self.engine.variance_decomposition(horizon=8)
        assert len(vd) == 3
        for decomp in vd:
            assert decomp.horizon == 8
            assert len(decomp.decomposition) == 3

    def test_forecast_before_estimation_raises(self):
        with pytest.raises(RuntimeError):
            self.engine.forecast(horizon=4)

    def test_impulse_response_before_estimation_raises(self):
        with pytest.raises(RuntimeError):
            self.engine.impulse_response("gdp")

    def test_estimate_persists_variable_order(self):
        output = self.engine.estimate(data=self.data, lags=2)
        assert output.variable_order == ["gdp", "inflation", "rate"]
