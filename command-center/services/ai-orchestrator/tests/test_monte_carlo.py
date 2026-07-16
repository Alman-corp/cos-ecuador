import pytest
from engines.dcf.monte_carlo import MonteCarloSimulator, MonteCarloInput


@pytest.mark.asyncio
class TestMonteCarlo:
    async def test_monte_carlo_convergence(self):
        simulator = MonteCarloSimulator()
        base_input = {
            "company_id": "test-mc", "tenant_id": "test-tenant",
            "historical_revenue": [1000000] * 5, "historical_ebitda": [200000] * 5,
            "historical_capex": [50000] * 5, "historical_da": [40000] * 5,
            "historical_nwc": [100000] * 5, "projection_years": 5,
            "revenue_growth_rate": 0.05, "ebitda_margin": 0.20,
            "capex_pct_revenue": 0.05, "nwc_pct_revenue": 0.10,
            "tax_rate": 0.28, "risk_free_rate": 0.045,
            "equity_risk_premium": 0.065, "beta": 1.0,
            "size_premium": 0.02, "country_risk_premium": 0.025,
            "debt_weight": 0.3, "equity_weight": 0.7,
            "cost_of_debt": 0.10, "terminal_method": "gordon",
            "terminal_growth": 0.025, "net_debt": 200000,
        }
        input = MonteCarloInput(dcf_base_input=base_input, iterations=1000, random_seed=42)
        result = await simulator.simulate(input)
        assert result.iterations_completed == 1000
        assert result.iterations_valid > 0
        assert result.mean > 0
        assert len(result.percentiles) == 5

    async def test_monte_carlo_percentiles_order(self):
        simulator = MonteCarloSimulator()
        base_input = {
            "company_id": "test", "tenant_id": "test",
            "historical_revenue": [1000000] * 5, "historical_ebitda": [200000] * 5,
            "historical_capex": [50000] * 5, "historical_da": [40000] * 5,
            "historical_nwc": [100000] * 5, "projection_years": 5,
            "revenue_growth_rate": 0.05, "ebitda_margin": 0.20,
            "capex_pct_revenue": 0.05, "nwc_pct_revenue": 0.10,
            "tax_rate": 0.28, "risk_free_rate": 0.045,
            "equity_risk_premium": 0.065, "beta": 1.0,
            "size_premium": 0.02, "country_risk_premium": 0.025,
            "debt_weight": 0.3, "equity_weight": 0.7,
            "cost_of_debt": 0.10, "terminal_method": "gordon",
            "terminal_growth": 0.025, "net_debt": 200000,
        }
        input = MonteCarloInput(dcf_base_input=base_input, iterations=5000)
        result = await simulator.simulate(input)
        p = result.percentiles
        assert p["p5"] < p["p25"] < p["p50"] < p["p75"] < p["p95"]

    async def test_monte_carlo_probability_metrics(self):
        simulator = MonteCarloSimulator()
        base_input = {
            "company_id": "test-prob", "tenant_id": "test-tenant",
            "historical_revenue": [1000000] * 5, "historical_ebitda": [200000] * 5,
            "historical_capex": [50000] * 5, "historical_da": [40000] * 5,
            "historical_nwc": [100000] * 5, "projection_years": 5,
            "revenue_growth_rate": 0.05, "ebitda_margin": 0.20,
            "capex_pct_revenue": 0.05, "nwc_pct_revenue": 0.10,
            "tax_rate": 0.28, "risk_free_rate": 0.045,
            "equity_risk_premium": 0.065, "beta": 1.0,
            "size_premium": 0.02, "country_risk_premium": 0.025,
            "debt_weight": 0.3, "equity_weight": 0.7,
            "cost_of_debt": 0.10, "terminal_method": "gordon",
            "terminal_growth": 0.025, "net_debt": 200000,
        }
        input = MonteCarloInput(dcf_base_input=base_input, iterations=2000)
        result = await simulator.simulate(input)
        assert 0 <= result.prob_equity_positive <= 1
        assert 0 <= result.prob_above_base <= 1
        assert result.var_95 < result.mean

    async def test_monte_carlo_tornado_analysis(self):
        simulator = MonteCarloSimulator()
        base_input = {
            "company_id": "test-tornado", "tenant_id": "test-tenant",
            "historical_revenue": [1000000] * 5, "historical_ebitda": [200000] * 5,
            "historical_capex": [50000] * 5, "historical_da": [40000] * 5,
            "historical_nwc": [100000] * 5, "projection_years": 5,
            "revenue_growth_rate": 0.05, "ebitda_margin": 0.20,
            "capex_pct_revenue": 0.05, "nwc_pct_revenue": 0.10,
            "tax_rate": 0.28, "risk_free_rate": 0.045,
            "equity_risk_premium": 0.065, "beta": 1.0,
            "size_premium": 0.02, "country_risk_premium": 0.025,
            "debt_weight": 0.3, "equity_weight": 0.7,
            "cost_of_debt": 0.10, "terminal_method": "gordon",
            "terminal_growth": 0.025, "net_debt": 200000,
        }
        input = MonteCarloInput(dcf_base_input=base_input, iterations=2000)
        result = await simulator.simulate(input)
        assert len(result.tornado_analysis) > 0
        # El primero debe tener mayor impacto que el último
        if len(result.tornado_analysis) >= 2:
            assert abs(result.tornado_analysis[0]["impact_pct"]) >= abs(result.tornado_analysis[-1]["impact_pct"])
