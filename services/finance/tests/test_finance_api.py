from fastapi.testclient import TestClient
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app

client = TestClient(app)


class TestFinanceAPI:
    def test_health_endpoint(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "finance-service"

    def test_root_endpoint(self):
        resp = client.get("/")
        assert resp.status_code == 200

    def test_dcf_endpoint(self):
        payload = {
            "revenue": [1000, 1100, 1200],
            "ebitda": [250, 280, 310],
            "capex": [80, 85, 90],
            "depreciation": [30, 32, 35],
            "nwc_change": [10, 12, 14],
            "revenue_growth": [5, 5, 5, 5, 5],
            "ebitda_margin": [0.25, 0.25, 0.25, 0.25, 0.25],
            "capex_pct_revenue": [0.08, 0.08, 0.08, 0.08, 0.08],
            "nwc_pct_revenue": [0.02, 0.02, 0.02, 0.02, 0.02],
        }
        resp = client.post("/api/v1/finance/dcf", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["enterprise_value"] > 0
        assert data["equity_value"] > 0

    def test_monte_carlo_endpoint(self):
        payload = {
            "revenue_base": 1000000.0,
            "iterations": 500,
        }
        resp = client.post("/api/v1/finance/dcf/monte-carlo", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["mean_ev"] > 0

    def test_dcf_sensitivity_endpoint(self):
        payload = {
            "revenue": [1000, 1100, 1200],
            "ebitda": [250, 280, 310],
            "capex": [80, 85, 90],
            "depreciation": [30, 32, 35],
            "nwc_change": [10, 12, 14],
            "revenue_growth": [5, 5, 5, 5, 5],
            "ebitda_margin": [0.25, 0.25, 0.25, 0.25, 0.25],
            "capex_pct_revenue": [0.08, 0.08, 0.08, 0.08, 0.08],
            "nwc_pct_revenue": [0.02, 0.02, 0.02, 0.02, 0.02],
        }
        resp = client.post("/api/v1/finance/dcf/sensitivity", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "equity_values" in data

    def test_capm_endpoint(self):
        payload = {
            "risk_free_rate": 4.5,
            "beta": 1.2,
            "equity_risk_premium": 6.5,
            "country_risk_premium": 4.0,
            "size_premium": 2.0,
        }
        resp = client.post("/api/v1/finance/capm", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["cost_of_equity"] > 0

    def test_wacc_endpoint(self):
        payload = {
            "cost_of_equity": 18.3,
            "cost_of_debt": 9.5,
            "equity_weight": 0.7,
            "debt_weight": 0.3,
            "tax_rate": 0.25,
        }
        resp = client.post("/api/v1/finance/wacc", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["wacc"] > 0

    def test_amortization_french_endpoint(self):
        payload = {
            "principal": 100000.0,
            "annual_rate": 12.0,
            "years": 1,
            "system": "french",
            "payments_per_year": 12,
        }
        resp = client.post("/api/v1/finance/amortization", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["schedule"]) == 12

    def test_compounding_endpoint(self):
        payload = {
            "cashflows": [30000, 40000, 50000],
            "discount_rate": 10.0,
            "initial_investment": 80000.0,
        }
        resp = client.post("/api/v1/finance/compounding", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["npv"] > 0

    def test_ratios_liquidity_endpoint(self):
        payload = {
            "current_assets": 500000,
            "current_liabilities": 200000,
            "cash": 50000,
            "total_assets": 1000000,
            "total_equity": 600000,
            "total_liabilities": 400000,
            "ebit": 120000,
            "net_income": 80000,
            "revenue": 800000,
            "ebitda": 150000,
            "inventories": 100000,
            "accounts_receivable": 120000,
            "accounts_payable": 80000,
            "cost_of_goods_sold": 480000,
            "interest_expense": 20000,
            "operating_cashflow": 90000,
        }
        resp = client.post("/api/v1/finance/ratios/liquidity", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["current_ratio"] == 2.5

    def test_ratios_full_endpoint(self):
        payload = {
            "current_assets": 500000,
            "current_liabilities": 200000,
            "cash": 50000,
            "total_assets": 1000000,
            "total_equity": 600000,
            "total_liabilities": 400000,
            "ebit": 120000,
            "net_income": 80000,
            "revenue": 800000,
            "ebitda": 150000,
            "inventories": 100000,
            "accounts_receivable": 120000,
            "accounts_payable": 80000,
            "cost_of_goods_sold": 480000,
            "interest_expense": 20000,
            "operating_cashflow": 90000,
        }
        resp = client.post("/api/v1/finance/ratios/full", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "liquidity" in data
        assert "profitability" in data
        assert "leverage" in data
        assert "efficiency" in data

    def test_projections_endpoint(self):
        payload = {
            "base_revenue": 1000000.0,
            "growth_rates": [10.0, 8.0, 6.0, 5.0, 4.0],
            "years": 5,
        }
        resp = client.post("/api/v1/finance/project/financial-statements", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["income_statement"]) == 5
        assert len(data["cashflow"]) == 5
        assert len(data["balance_sheet"]) == 5

    def test_market_endpoints(self):
        resp = client.get("/api/v1/finance/market/risk-free-rate")
        assert resp.status_code == 200
        resp = client.get("/api/v1/finance/market/equity-risk-premium")
        assert resp.status_code == 200
        resp = client.get("/api/v1/finance/market/country-risk")
        assert resp.status_code == 200
