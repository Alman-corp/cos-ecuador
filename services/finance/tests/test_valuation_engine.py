from engines.valuation_engine import (
    ValuationEngine, CAPMInput, WACCInput, AmortizationInput, CashFlowInput
)
import pytest


class TestValuationEngine:
    def setup_method(self):
        self.engine = ValuationEngine()

    def test_capm(self):
        inp = CAPMInput(
            risk_free_rate=4.5,
            beta=1.2,
            equity_risk_premium=6.5,
            country_risk_premium=4.0,
            size_premium=2.0,
        )
        result = self.engine.capm(inp)
        expected = 4.5 + 1.2 * 6.5 + 4.0 + 2.0
        assert result["cost_of_equity"] == round(expected, 2)

    def test_wacc(self):
        inp = WACCInput(
            cost_of_equity=18.3,
            cost_of_debt=9.5,
            equity_weight=0.7,
            debt_weight=0.3,
            tax_rate=0.25,
        )
        result = self.engine.wacc(inp)
        kd_at = 9.5 * (1 - 0.25)
        expected = 0.7 * 18.3 + 0.3 * kd_at
        assert result["wacc"] == round(expected, 2)

    def test_french_amortization(self):
        inp = AmortizationInput(
            principal=100000.0,
            annual_rate=12.0,
            years=1,
            system="french",
            payments_per_year=12,
        )
        result = self.engine.amortization(inp)
        assert len(result.schedule) == 12
        assert result.total_interest > 0
        assert abs(result.schedule[-1].balance) < 1.0

    def test_american_amortization(self):
        inp = AmortizationInput(
            principal=100000.0,
            annual_rate=12.0,
            years=1,
            system="american",
            payments_per_year=12,
        )
        result = self.engine.amortization(inp)
        assert len(result.schedule) == 12
        assert result.schedule[-1].principal == pytest.approx(100000.0, 1)
        assert abs(result.schedule[-1].balance) < 1.0

    def test_german_amortization(self):
        inp = AmortizationInput(
            principal=100000.0,
            annual_rate=12.0,
            years=1,
            system="german",
            payments_per_year=12,
        )
        result = self.engine.amortization(inp)
        assert len(result.schedule) == 12
        fixed_principal = 100000.0 / 12
        assert result.schedule[0].principal == pytest.approx(fixed_principal, 0.1)
        assert result.schedule[-1].principal == pytest.approx(fixed_principal, 0.1)

    def test_npv_positive(self):
        result = self.engine.cashflow_metrics(
            cashflows=[30000, 40000, 50000],
            rate=10.0,
            initial_investment=80000.0,
        )
        assert result.npv > 0
        assert result.profitability_index > 1.0

    def test_irr(self):
        result = self.engine.cashflow_metrics(
            cashflows=[30000, 40000, 50000],
            rate=10.0,
            initial_investment=80000.0,
        )
        assert result.irr != 0.0
