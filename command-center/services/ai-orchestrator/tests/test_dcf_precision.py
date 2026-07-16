import pytest
from decimal import Decimal
from engines.dcf.engine import DCFEngine, DCFInput


class TestDCFPrecision:
    def setup_method(self):
        self.engine = DCFEngine()

    def test_dcf_case_stable_growth(self):
        data = DCFInput(
            company_id="test-1",
            tenant_id="test-tenant",
            historical_revenue=[Decimal('1000000')] * 5,
            historical_ebitda=[Decimal('200000')] * 5,
            historical_capex=[Decimal('50000')] * 5,
            historical_da=[Decimal('40000')] * 5,
            historical_nwc=[Decimal('100000')] * 5,
            projection_years=5,
            revenue_growth_rate=Decimal('0.05'),
            ebitda_margin=Decimal('0.20'),
            capex_pct_revenue=Decimal('0.05'),
            nwc_pct_revenue=Decimal('0.10'),
            tax_rate=Decimal('0.28'),
            risk_free_rate=Decimal('0.045'),
            equity_risk_premium=Decimal('0.065'),
            beta=Decimal('1.1'),
            size_premium=Decimal('0.02'),
            country_risk_premium=Decimal('0.025'),
            debt_weight=Decimal('0.3'),
            equity_weight=Decimal('0.7'),
            cost_of_debt=Decimal('0.10'),
            terminal_method="gordon",
            terminal_growth=Decimal('0.025'),
            net_debt=Decimal('200000'),
        )
        result = self.engine.calculate(data)
        assert result.wacc > 0
        assert result.enterprise_value > 0
        assert result.equity_value > 0
        assert len(result.fcf_projections) == 5

    def test_dcf_terminal_value_constraint(self):
        with pytest.raises(ValueError, match="WACC .* debe ser > terminal growth"):
            data = DCFInput(
                company_id="test-2", tenant_id="test-tenant",
                historical_revenue=[Decimal('1000000')] * 5,
                historical_ebitda=[Decimal('200000')] * 5,
                historical_capex=[Decimal('50000')] * 5,
                historical_da=[Decimal('40000')] * 5,
                historical_nwc=[Decimal('100000')] * 5,
                projection_years=5, revenue_growth_rate=Decimal('0.05'),
                ebitda_margin=Decimal('0.20'), capex_pct_revenue=Decimal('0.05'),
                nwc_pct_revenue=Decimal('0.10'), tax_rate=Decimal('0.28'),
                risk_free_rate=Decimal('0.045'), equity_risk_premium=Decimal('0.065'),
                beta=Decimal('0.8'), size_premium=Decimal('0.01'),
                country_risk_premium=Decimal('0.02'), debt_weight=Decimal('0.5'),
                equity_weight=Decimal('0.5'), cost_of_debt=Decimal('0.08'),
                terminal_method="gordon", terminal_growth=Decimal('0.08'),
                net_debt=Decimal('0'),
            )
            self.engine.calculate(data)

    def test_dcf_ecuador_tax_rate(self):
        data = DCFInput(
            company_id="test-ec", tenant_id="test-tenant",
            historical_revenue=[Decimal('500000')] * 5,
            historical_ebitda=[Decimal('100000')] * 5,
            historical_capex=[Decimal('25000')] * 5,
            historical_da=[Decimal('20000')] * 5,
            historical_nwc=[Decimal('50000')] * 5,
            projection_years=5, revenue_growth_rate=Decimal('0.05'),
            ebitda_margin=Decimal('0.20'), capex_pct_revenue=Decimal('0.05'),
            nwc_pct_revenue=Decimal('0.10'), tax_rate=Decimal('0.28'),
            risk_free_rate=Decimal('0.045'), equity_risk_premium=Decimal('0.065'),
            beta=Decimal('1.0'), size_premium=Decimal('0.02'),
            country_risk_premium=Decimal('0.025'), debt_weight=Decimal('0.3'),
            equity_weight=Decimal('0.7'), cost_of_debt=Decimal('0.10'),
            terminal_method="gordon", terminal_growth=Decimal('0.025'),
            net_debt=Decimal('0'),
        )
        result = self.engine.calculate(data)
        expected_kd_at = Decimal('0.072')
        assert abs(result.cost_of_debt_after_tax - expected_kd_at) < Decimal('0.0001')

    def test_dcf_exit_multiple_method(self):
        data = DCFInput(
            company_id="test-exit", tenant_id="test-tenant",
            historical_revenue=[Decimal('1000000')] * 5,
            historical_ebitda=[Decimal('200000')] * 5,
            historical_capex=[Decimal('50000')] * 5,
            historical_da=[Decimal('40000')] * 5,
            historical_nwc=[Decimal('100000')] * 5,
            projection_years=5, revenue_growth_rate=Decimal('0.05'),
            ebitda_margin=Decimal('0.20'), capex_pct_revenue=Decimal('0.05'),
            nwc_pct_revenue=Decimal('0.10'), tax_rate=Decimal('0.28'),
            risk_free_rate=Decimal('0.045'), equity_risk_premium=Decimal('0.065'),
            beta=Decimal('1.0'), size_premium=Decimal('0.02'),
            country_risk_premium=Decimal('0.025'), debt_weight=Decimal('0.3'),
            equity_weight=Decimal('0.7'), cost_of_debt=Decimal('0.10'),
            terminal_method="exit_multiple", exit_multiple_ebitda=Decimal('7.5'),
            net_debt=Decimal('200000'),
        )
        result = self.engine.calculate(data)
        assert result.terminal_value > 0
        assert result.enterprise_value > 0

    def test_dcf_validation_warnings(self):
        data = DCFInput(
            company_id="test-warn", tenant_id="test-tenant",
            historical_revenue=[Decimal('1000000')] * 5,
            historical_ebitda=[Decimal('200000')] * 5,
            historical_capex=[Decimal('50000')] * 5,
            historical_da=[Decimal('40000')] * 5,
            historical_nwc=[Decimal('100000')] * 5,
            projection_years=5, revenue_growth_rate=Decimal('0.05'),
            ebitda_margin=Decimal('0.20'), capex_pct_revenue=Decimal('0.05'),
            nwc_pct_revenue=Decimal('0.10'), tax_rate=Decimal('0.28'),
            risk_free_rate=Decimal('0.045'), equity_risk_premium=Decimal('0.065'),
            beta=Decimal('1.0'), size_premium=Decimal('0.02'),
            country_risk_premium=Decimal('0.025'), debt_weight=Decimal('0.3'),
            equity_weight=Decimal('0.7'), cost_of_debt=Decimal('0.10'),
            terminal_method="gordon", terminal_growth=Decimal('0.025'),
            net_debt=Decimal('0'),
        )
        result = self.engine.calculate(data)
        assert isinstance(result.validation_warnings, list)

    def test_dcf_output_types(self):
        data = DCFInput(
            company_id="test-types", tenant_id="test-tenant",
            historical_revenue=[Decimal('1000000')] * 5,
            historical_ebitda=[Decimal('200000')] * 5,
            historical_capex=[Decimal('50000')] * 5,
            historical_da=[Decimal('40000')] * 5,
            historical_nwc=[Decimal('100000')] * 5,
            projection_years=5, revenue_growth_rate=Decimal('0.05'),
            ebitda_margin=Decimal('0.20'), capex_pct_revenue=Decimal('0.05'),
            nwc_pct_revenue=Decimal('0.10'), tax_rate=Decimal('0.28'),
            risk_free_rate=Decimal('0.045'), equity_risk_premium=Decimal('0.065'),
            beta=Decimal('1.0'), size_premium=Decimal('0.02'),
            country_risk_premium=Decimal('0.025'), debt_weight=Decimal('0.3'),
            equity_weight=Decimal('0.7'), cost_of_debt=Decimal('0.10'),
            terminal_method="gordon", terminal_growth=Decimal('0.025'),
            net_debt=Decimal('0'),
        )
        result = self.engine.calculate(data)
        assert isinstance(result.enterprise_value, Decimal)
        assert isinstance(result.equity_value, Decimal)
        assert isinstance(result.wacc, Decimal)
        assert isinstance(result.sensitivity_table, dict)
        assert isinstance(result.validation_warnings, list)
