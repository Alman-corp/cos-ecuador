from engines.dcf_engine import DCFEngine, DCFInput
import pytest


def _make_default_input(**overrides):
    data = dict(
        revenue=[1000.0, 1100.0, 1200.0],
        ebitda=[250.0, 280.0, 310.0],
        capex=[80.0, 85.0, 90.0],
        depreciation=[30.0, 32.0, 35.0],
        nwc_change=[10.0, 12.0, 14.0],
        revenue_growth=[5.0, 5.0, 5.0, 5.0, 5.0],
        ebitda_margin=[0.25, 0.25, 0.25, 0.25, 0.25],
        capex_pct_revenue=[0.08, 0.08, 0.08, 0.08, 0.08],
        nwc_pct_revenue=[0.02, 0.02, 0.02, 0.02, 0.02],
    )
    data.update(overrides)
    return DCFInput(**data)


class TestDCFEngine:
    def setup_method(self):
        self.engine = DCFEngine()

    def test_dcf_basic_valuation(self):
        inp = _make_default_input()
        result = self.engine.calculate(inp)
        assert result.enterprise_value > 0
        assert result.equity_value > 0
        assert result.wacc > 0
        assert len(result.fcf_projections) == 5
        assert len(result.discounted_fcf) == 5

    def test_dcf_with_terminal_multiple(self):
        inp = _make_default_input(terminal_exit_multiple=8.0)
        result = self.engine.calculate(inp)
        assert result.enterprise_value > 0
        assert result.terminal_value > 0

    def test_dcf_ecuador_tax_rate(self):
        inp = _make_default_input(tax_rate=0.25)
        result = self.engine.calculate(inp)
        assert abs(result.cost_of_debt_after_tax - 0.0713) < 0.001

    def test_dcf_sensitivity_table_shape(self):
        inp = _make_default_input()
        result = self.engine.calculate(inp)
        assert len(result.sensitivity_table) == 5
        assert all(len(row) == 5 for row in result.sensitivity_table)

    def test_dcf_negative_growth(self):
        inp = _make_default_input(
            revenue_growth=[-2.0, -1.0, 0.0, 1.0, 2.0],
            ebitda_margin=[0.20, 0.20, 0.20, 0.20, 0.20],
        )
        result = self.engine.calculate(inp)
        assert result.enterprise_value > 0

    def test_dcf_price_per_share(self):
        inp = _make_default_input(shares_outstanding=1000.0)
        result = self.engine.calculate(inp)
        assert result.price_per_share is not None
        assert result.price_per_share > 0
        assert abs(result.price_per_share * 1000.0 - result.equity_value) < 1.0

    def test_dcf_consistency_ebitda_to_fcf(self):
        inp = _make_default_input()
        result = self.engine.calculate(inp)
        last_fcf = result.fcf_projections[-1]
        assert result.terminal_value > last_fcf
        assert result.terminal_value_pct > 0
