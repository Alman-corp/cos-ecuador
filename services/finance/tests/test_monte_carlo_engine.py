from engines.monte_carlo_engine import MonteCarloEngine, MonteCarloInput
import pytest


class TestMonteCarloEngine:
    def setup_method(self):
        self.engine = MonteCarloEngine()

    def test_monte_carlo_basic(self):
        inp = MonteCarloInput(
            revenue_base=1000000.0,
            revenue_growth_mean=0.05,
            revenue_growth_std=0.02,
            ebitda_margin_mean=0.30,
            ebitda_margin_std=0.03,
            wacc_mean=0.11,
            wacc_std=0.01,
            terminal_growth_mean=0.02,
            terminal_growth_std=0.005,
            projection_years=5,
            iterations=1000,
        )
        result = self.engine.simulate(inp)
        assert result.mean_ev > 0
        assert result.median_ev > 0
        assert result.std_ev > 0
        assert result.p5 <= result.p25 <= result.median_ev <= result.p75 <= result.p95

    def test_monte_carlo_histogram(self):
        inp = MonteCarloInput(
            revenue_base=500000.0,
            iterations=1000,
        )
        result = self.engine.simulate(inp)
        assert len(result.histogram_bins) == 51
        assert len(result.histogram_counts) == 50
        assert sum(result.histogram_counts) > 0

    def test_monte_carlo_probability_positive(self):
        inp = MonteCarloInput(
            revenue_base=100000.0,
            iterations=1000,
        )
        result = self.engine.simulate(inp)
        assert 0 <= result.probability_positive <= 1.0
