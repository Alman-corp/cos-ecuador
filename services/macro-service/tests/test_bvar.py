import pytest
import numpy as np
from engines.macro_data import MacroDataService
from api.bvar import BVAREngine, BVAROutput, ForecastOutput


@pytest.fixture
def engine():
    return BVAREngine(
        variables=["gdp", "oil_price", "cpi"],
        lags=2,
        prior_tightness=0.2,
        n_draws=50,
        n_burnin=10,
    )


@pytest.fixture
def fitted_engine(engine):
    engine.estimate()
    return engine


class TestBVAREngine:
    def test_bvar_engine_initialization(self, engine):
        assert engine.variables == ["gdp", "oil_price", "cpi"]
        assert engine.lags == 2
        assert engine._is_fitted is False

    def test_estimate_returns_output(self, fitted_engine):
        assert isinstance(fitted_engine, BVAREngine)

    def test_estimate_has_coefficients(self, fitted_engine):
        output = fitted_engine.estimate()
        assert isinstance(output, BVAROutput)
        assert len(output.coefficients) == 3
        for v in fitted_engine.variables:
            assert v in output.coefficients

    def test_estimate_has_information_criteria(self, fitted_engine):
        output = fitted_engine.estimate()
        assert "aic" in output.information_criteria
        assert "bic" in output.information_criteria
        assert output.information_criteria["aic"] < output.information_criteria["bic"]

    def test_forecast_returns_list(self, fitted_engine):
        fitted_engine.estimate()
        forecasts = fitted_engine.forecast(horizon=4)
        assert isinstance(forecasts, list)
        assert len(forecasts) == 3

    def test_forecast_horizon_matches(self, fitted_engine):
        fitted_engine.estimate()
        forecasts = fitted_engine.forecast(horizon=6)
        for f in forecasts:
            assert f.horizon == 6
            assert len(f.forecast) == 6

    def test_forecast_has_confidence_bands(self, fitted_engine):
        fitted_engine.estimate()
        forecasts = fitted_engine.forecast(horizon=4)
        for f in forecasts:
            assert len(f.lower_68) == 4
            assert len(f.upper_68) == 4
            assert len(f.lower_95) == 4
            assert len(f.upper_95) == 4
            for i in range(4):
                assert f.lower_68[i] <= f.forecast[i]
                assert f.forecast[i] <= f.upper_68[i]
                assert f.lower_95[i] <= f.forecast[i]
                assert f.forecast[i] <= f.upper_95[i]

    def test_conditional_forecast(self, fitted_engine):
        fitted_engine.estimate()
        conditions = {"gdp": [21000.0, 21200.0, 21400.0, 21600.0]}
        forecasts = fitted_engine.conditional_forecast(
            horizon=4, conditions=conditions, n_draws=20
        )
        assert len(forecasts) == 3
        for f in forecasts:
            assert len(f.forecast) == 4

    def test_impulse_response(self, fitted_engine):
        fitted_engine.estimate()
        irf = fitted_engine.impulse_response(
            shock_var="oil_price", shock_size=1.0, horizon=6
        )
        assert len(irf) == 3
        for var_name, response in irf.items():
            assert response.shock_variable == "oil_price"
            assert response.horizon == 6
            assert var_name in response.response_variables

    def test_variance_decomposition(self, fitted_engine):
        fitted_engine.estimate()
        vd = fitted_engine.variance_decomposition(horizon=6)
        assert len(vd) == 3
        for decomp in vd:
            assert decomp.horizon == 6
            assert len(decomp.decomposition) == 3

    def test_error_not_fitted(self, engine):
        with pytest.raises(RuntimeError, match="not estimated"):
            engine.forecast(horizon=4)

    def test_error_not_fitted_impulse(self, engine):
        with pytest.raises(RuntimeError, match="not estimated"):
            engine.impulse_response("gdp")

    def test_invalid_variable_name(self, fitted_engine):
        fitted_engine.estimate()
        with pytest.raises(ValueError, match="not in model"):
            fitted_engine.impulse_response("nonexistent")

    def test_n_vars_in_output(self, fitted_engine):
        output = fitted_engine.estimate()
        assert output.n_vars == 3

    def test_forecast_dates_gdp(self, fitted_engine):
        fitted_engine.estimate()
        forecasts = fitted_engine.forecast(horizon=4)
        gdp_forecast = [f for f in forecasts if f.variable == "gdp"][0]
        assert len(gdp_forecast.dates) == 4
