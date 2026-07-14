import pytest
import numpy as np
from engines.macro_data import MacroDataService
from api.midas import MIDASEngine, MIDASResult, MIDASConfig


@pytest.fixture
def engine():
    return MIDASEngine(target="gdp", predictors=["oil_price", "cpi"], max_lags=2)


@pytest.fixture
def data():
    svc = MacroDataService()
    gdp = svc.get_indicator("gdp")
    y = np.array(list(gdp.values()))
    q_labels = list(gdp.keys())

    X_dict = {}
    for p in ["oil_price", "cpi"]:
        m = svc.get_indicator(p)
        X_dict[p] = np.array(list(m.values()))

    return y, X_dict, q_labels


class TestMIDASEngine:
    def test_midas_engine_initialization(self, engine):
        assert engine.target == "gdp"
        assert engine.predictors == ["oil_price", "cpi"]
        assert engine.max_lags == 2
        assert engine._is_fitted is False

    def test_estimate_umidas_returns_valid_result(self, engine, data):
        y, X_dict, q_labels = data
        result = engine.estimate_umidas(y, X_dict, q_labels)
        assert isinstance(result, MIDASResult)
        assert result._is_fitted is False

    def test_estimate_umidas_returns_valid_result(self, engine, data):
        y, X_dict, q_labels = data
        result = engine.estimate_umidas(y, X_dict, q_labels)
        assert isinstance(result, MIDASResult)
        assert isinstance(result.nowcast, float)
        assert engine._is_fitted is True

    def test_nowcast_returns_float(self, engine, data):
        y, X_dict, q_labels = data
        engine.estimate_umidas(y, X_dict, q_labels)
        result = engine.nowcast()
        assert isinstance(result.nowcast, float)

    def test_nowcast_has_confidence_intervals(self, engine, data):
        y, X_dict, q_labels = data
        result = engine.estimate_umidas(y, X_dict, q_labels)
        assert result.lower_ci <= result.nowcast <= result.upper_ci

    def test_backtest_expanding_window(self, engine, data):
        y, X_dict, q_labels = data
        result = engine._backtest_expanding_window(y, X_dict, initial_window=6, step=2)
        assert isinstance(result, MIDASResult)
        assert len(result.predictions) > 0
        assert len(result.actuals) > 0

    def test_feature_importance(self, engine, data):
        y, X_dict, q_labels = data
        importance = engine.get_feature_importance(y, X_dict)
        assert len(importance) > 0
        for p in engine.predictors:
            assert p in importance
        total = sum(importance.values())
        assert abs(total - 1.0) < 1e-6

    def test_different_predictor_combinations(self):
        svc = MacroDataService()
        gdp = svc.get_indicator("gdp")
        y = np.array(list(gdp.values()))
        q_labels = list(gdp.keys())

        single_pred = {"oil_price": np.array(list(svc.get_indicator("oil_price").values()))}
        eng = MIDASEngine(target="gdp", predictors=["oil_price"], max_lags=2)
        result = eng.estimate_umidas(y, single_pred, q_labels)
        assert isinstance(result.nowcast, float)

    def test_edge_case_single_indicator(self):
        svc = MacroDataService()
        gdp = svc.get_indicator("gdp")
        y = np.array(list(gdp.values()))
        q_labels = list(gdp.keys())
        X_dict = {"oil_price": np.array(list(svc.get_indicator("oil_price").values()))}
        eng = MIDASEngine(target="gdp", predictors=["oil_price"], max_lags=1)
        result = eng.estimate_umidas(y, X_dict, q_labels)
        assert isinstance(result, MIDASResult)

    def test_mape_computation(self, engine, data):
        y, X_dict, q_labels = data
        result = engine.estimate_umidas(y, X_dict, q_labels)
        assert isinstance(result.mape, float)
        assert result.mape >= 0

    def test_r_squared_range(self, engine, data):
        y, X_dict, q_labels = data
        result = engine.estimate_umidas(y, X_dict, q_labels)
        assert 0.0 <= result.r_squared <= 1.0

    def test_coefficients_present(self, engine, data):
        y, X_dict, q_labels = data
        result = engine.estimate_umidas(y, X_dict, q_labels)
        assert len(result.coefficients) > 0
        for key in result.coefficients:
            assert isinstance(result.coefficients[key], float)
