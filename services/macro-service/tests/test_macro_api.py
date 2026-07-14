import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthAndRoot:
    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "macro-service"
        assert data["version"] == "1.0.0"
        assert data["engines"] == ["data", "midas", "bvar"]

    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "docs" in data
        assert "version" in data
        assert "endpoints" in data


class TestDataEndpoints:
    def test_get_indicators(self, client):
        resp = client.get("/api/v1/macro/data/indicators")
        assert resp.status_code == 200
        data = resp.json()
        assert "indicators" in data
        assert len(data["indicators"]) == 6

    def test_get_indicator_by_code(self, client):
        resp = client.get("/api/v1/macro/data/indicators/gdp")
        assert resp.status_code == 200
        data = resp.json()
        assert data["metadata"]["code"] == "gdp"
        assert len(data["data"]) > 0
        assert data["count"] > 0

    def test_get_indicator_with_filter(self, client):
        resp = client.get("/api/v1/macro/data/indicators/gdp?start=2024Q1&end=2024Q4")
        assert resp.status_code == 200
        data = resp.json()
        assert data["metadata"]["code"] == "gdp"
        assert len(data["data"]) == 4

    def test_get_latest(self, client):
        resp = client.get("/api/v1/macro/data/latest")
        assert resp.status_code == 200
        data = resp.json()
        assert "latest" in data
        assert len(data["latest"]) == 6

    def test_get_indicator_not_found(self, client):
        resp = client.get("/api/v1/macro/data/indicators/invalid")
        assert resp.status_code == 404


class TestMIDASEndpoints:
    def test_midas_nowcast_gdp(self, client):
        resp = client.get("/api/v1/macro/midas/nowcast/gdp")
        assert resp.status_code == 200
        data = resp.json()
        assert data["model"] == "U-MIDAS"
        assert data["target"] == "gdp"
        assert "nowcast_usd_millions" in data
        assert "confidence_interval" in data
        assert "rmse" in data

    def test_midas_estimate(self, client):
        payload = {
            "target": "gdp",
            "predictors": ["oil_price", "cpi"],
            "max_lags": 2,
        }
        resp = client.post("/api/v1/macro/midas/estimate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert "result" in data
        assert "feature_importance" in data
        assert data["config"]["max_lags"] == 2

    def test_midas_estimate_all_predictors(self, client):
        payload = {
            "target": "gdp",
            "predictors": ["oil_price", "tax_revenue", "remittances", "interest_rate", "cpi"],
            "max_lags": 4,
        }
        resp = client.post("/api/v1/macro/midas/estimate", json=payload)
        assert resp.status_code == 200

    def test_midas_backtest(self, client):
        resp = client.post("/api/v1/macro/midas/backtest?initial_window=6&step=2")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert "result" in data


class TestBVAREndpoints:
    def test_bvar_estimate(self, client):
        payload = {
            "variables": ["gdp", "oil_price", "cpi"],
            "lags": 2,
            "prior_tightness": 0.3,
            "n_draws": 100,
            "n_burnin": 20,
        }
        resp = client.post("/api/v1/macro/bvar/estimate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert len(data["coefficients"]) == 3

    def test_bvar_estimate_with_small_draws(self, client):
        payload = {
            "variables": ["gdp", "oil_price"],
            "lags": 1,
            "prior_tightness": 0.5,
            "n_draws": 100,
            "n_burnin": 20,
        }
        resp = client.post("/api/v1/macro/bvar/estimate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["n_vars"] == 2

    def test_bvar_forecast(self, client):
        payload = {
            "variables": ["gdp", "oil_price", "cpi"],
            "lags": 2,
            "prior_tightness": 0.2,
            "n_draws": 100,
            "n_burnin": 20,
        }
        client.post("/api/v1/macro/bvar/estimate", json=payload)
        resp = client.get("/api/v1/macro/bvar/forecast?horizon=4")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert len(data["forecasts"]) == 3

    def test_bvar_impulse_response(self, client):
        payload = {
            "variables": ["gdp", "oil_price", "cpi"],
            "lags": 2,
            "prior_tightness": 0.2,
            "n_draws": 100,
            "n_burnin": 20,
        }
        client.post("/api/v1/macro/bvar/estimate", json=payload)
        resp = client.get("/api/v1/macro/bvar/impulse-response/oil_price?horizon=6")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["shock_variable"] == "oil_price"

    def test_bvar_variance_decomposition(self, client):
        payload = {
            "variables": ["gdp", "oil_price", "cpi"],
            "lags": 2,
            "prior_tightness": 0.2,
            "n_draws": 100,
            "n_burnin": 20,
        }
        client.post("/api/v1/macro/bvar/estimate", json=payload)
        resp = client.get("/api/v1/macro/bvar/variance-decomposition?horizon=6")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
