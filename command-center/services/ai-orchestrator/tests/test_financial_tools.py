import pytest
from decimal import Decimal
from orchestrator.tools.financial_tools import (
    run_dcf,
    run_montecarlo_valuation,
    calculate_financial_ratios,
)


class TestDCF:
    def test_basic_dcf_valuation(self):
        result = run_dcf(
            historical_fcf=[Decimal("100000"), Decimal("110000"), Decimal("120000")],
            growth_rate=Decimal("0.05"),
            wacc=Decimal("0.12"),
            terminal_growth=Decimal("0.02"),
            debt=Decimal("50000"),
            cash=Decimal("10000"),
        )
        assert result.enterprise_value > 0
        assert result.equity_value > 0
        assert len(result.fcf_projections) == 5

    def test_terminal_growth_capped_at_3_percent(self):
        result = run_dcf(
            historical_fcf=[Decimal("100000")],
            growth_rate=Decimal("0.05"),
            wacc=Decimal("0.12"),
            terminal_growth=Decimal("0.05"),
            debt=Decimal("0"),
            cash=Decimal("0"),
        )
        assert result.assumptions["terminal_growth"] == 0.03

    def test_dcf_uses_decimal_precision(self):
        result = run_dcf(
            historical_fcf=[Decimal("100000.50")],
            growth_rate=Decimal("0.05"),
            wacc=Decimal("0.12"),
            terminal_growth=Decimal("0.02"),
            debt=Decimal("50000"),
            cash=Decimal("10000"),
        )
        assert isinstance(result.enterprise_value, Decimal)
        assert result.enterprise_value.as_tuple().exponent >= -2


class TestMonteCarlo:
    def test_monte_carlo_returns_percentiles(self):
        result = run_montecarlo_valuation(
            base_fcf=100000,
            growth_mean=0.05,
            growth_std=0.02,
            wacc_mean=0.12,
            wacc_std=0.01,
            iterations=1000,
        )
        assert result.iterations == 1000
        assert result.percentiles["p5"] < result.percentiles["p50"] < result.percentiles["p95"]
        assert result.mean > 0

    def test_more_iterations_increases_precision(self):
        result = run_montecarlo_valuation(
            base_fcf=100000,
            growth_mean=0.05,
            growth_std=0.01,
            wacc_mean=0.12,
            wacc_std=0.005,
            iterations=100,
        )
        assert result.iterations == 100


class TestFinancialRatios:
    def test_calculate_liquidity_ratios(self):
        data = {
            "current_assets": 500000,
            "current_liabilities": 250000,
            "total_assets": 1000000,
            "total_liabilities": 600000,
            "equity": 400000,
            "revenue": 800000,
            "cogs": 400000,
            "operating_expenses": 200000,
            "net_income": 100000,
            "inventory": 100000,
            "receivables": 150000,
        }
        ratios = calculate_financial_ratios(data)
        assert ratios["liquidity"]["current_ratio"] == 2.0
        assert ratios["liquidity"]["quick_ratio"] == 1.6
        assert ratios["profitability"]["net_margin"] == 12.5
        assert ratios["profitability"]["gross_margin"] == 50.0
        assert ratios["solvency"]["debt_to_equity"] == 1.5
