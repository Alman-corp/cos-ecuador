from engines.ratios_engine import FinancialStatements, RatiosEngine
import pytest


class TestRatiosEngine:
    def setup_method(self):
        self.engine = RatiosEngine()
        self.fs = FinancialStatements(
            current_assets=500000.0,
            current_liabilities=200000.0,
            cash=50000.0,
            total_assets=1000000.0,
            total_equity=600000.0,
            total_liabilities=400000.0,
            ebit=120000.0,
            net_income=80000.0,
            revenue=800000.0,
            ebitda=150000.0,
            inventories=100000.0,
            accounts_receivable=120000.0,
            accounts_payable=80000.0,
            cost_of_goods_sold=480000.0,
            interest_expense=20000.0,
            operating_cashflow=90000.0,
        )

    def test_liquidity_ratios(self):
        r = self.engine.liquidity(self.fs)
        assert r.current_ratio == 2.5
        assert r.quick_ratio == 2.0
        assert r.cash_ratio == 0.25
        assert r.working_capital == 300000.0

    def test_profitability_ratios(self):
        r = self.engine.profitability(self.fs)
        assert r.gross_margin == 40.0
        assert r.net_margin == 10.0
        assert r.roa == 8.0
        assert r.roe == pytest.approx(13.33, 0.1)

    def test_leverage_ratios(self):
        r = self.engine.leverage(self.fs)
        assert r.debt_to_equity == pytest.approx(0.67, 0.1)
        assert r.debt_ratio == 0.4
        assert r.equity_ratio == 0.6
        assert r.interest_coverage == 6.0

    def test_efficiency_ratios(self):
        r = self.engine.efficiency(self.fs)
        assert r.asset_turnover == 0.8
        assert r.inventory_turnover == 4.8
        assert r.receivables_turnover == pytest.approx(6.67, 0.1)
        assert r.payables_turnover == 6.0

    def test_all_ratios(self):
        r = self.engine.all_ratios(self.fs)
        assert "liquidity" in r
        assert "profitability" in r
        assert "leverage" in r
        assert "efficiency" in r
