from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from dataclasses import dataclass
from datetime import datetime


class DCFInput(BaseModel):
    company_id: str
    tenant_id: str
    historical_revenue: List[Decimal] = Field(..., min_items=3, max_items=10)
    historical_ebitda: List[Decimal] = Field(..., min_items=3, max_items=10)
    historical_capex: List[Decimal] = Field(..., min_items=3, max_items=10)
    historical_da: List[Decimal] = Field(..., min_items=3, max_items=10)
    historical_nwc: List[Decimal] = Field(..., min_items=3, max_items=10)
    projection_years: int = Field(5, ge=3, le=10)
    revenue_growth_rate: Decimal = Field(..., ge=-0.5, le=1.0)
    ebitda_margin: Decimal = Field(..., ge=0, le=1)
    capex_pct_revenue: Decimal = Field(..., ge=0, le=0.5)
    nwc_pct_revenue: Decimal = Field(..., ge=-0.5, le=0.5)
    tax_rate: Decimal = Field(Decimal('0.28'), ge=0, le=0.5)
    risk_free_rate: Decimal = Field(Decimal('0.045'), ge=0, le=0.1)
    equity_risk_premium: Decimal = Field(Decimal('0.065'), ge=0.04, le=0.09)
    beta: Decimal = Field(..., ge=0.3, le=2.5)
    size_premium: Decimal = Field(Decimal('0.02'), ge=0, le=0.05)
    country_risk_premium: Decimal = Field(Decimal('0.025'), ge=0, le=0.05)
    debt_weight: Decimal = Field(..., ge=0, le=1)
    equity_weight: Decimal = Field(..., ge=0, le=1)
    cost_of_debt: Decimal = Field(..., ge=0.05, le=0.25)
    terminal_method: str = Field("gordon", pattern="^(gordon|exit_multiple)$")
    terminal_growth: Optional[Decimal] = Field(None, ge=0, le=0.03)
    exit_multiple_ebitda: Optional[Decimal] = Field(None, ge=3, le=15)
    net_debt: Decimal = Field(...)
    minority_interest: Decimal = Field(Decimal('0'))
    non_operating_assets: Decimal = Field(Decimal('0'))
    currency: str = Field("USD", pattern="^USD$")


class DCFOutput(BaseModel):
    enterprise_value: Decimal
    equity_value: Decimal
    equity_value_per_share: Optional[Decimal]
    wacc: Decimal
    cost_of_equity: Decimal
    cost_of_debt_after_tax: Decimal
    fcf_projections: List[Decimal]
    discounted_fcf: List[Decimal]
    terminal_value: Decimal
    discounted_terminal_value: Decimal
    terminal_value_pct: Decimal
    sensitivity_table: Dict
    assumptions: Dict
    validation_warnings: List[str]
    calculated_at: datetime


class DCFEngine:
    def __init__(self):
        self.D = Decimal

    def calculate(self, input: DCFInput) -> DCFOutput:
        warnings = []

        if input.debt_weight + input.equity_weight != Decimal('1'):
            warnings.append(f"Pesos de capital no suman 100%: deuda={input.debt_weight}, equity={input.equity_weight}")

        if input.terminal_method == "gordon" and input.terminal_growth is None:
            raise ValueError("terminal_growth requerido para método Gordon")

        if input.terminal_method == "exit_multiple" and input.exit_multiple_ebitda is None:
            raise ValueError("exit_multiple_ebitda requerido para método múltiplo")

        cost_of_equity = input.risk_free_rate + input.beta * input.equity_risk_premium + input.size_premium + input.country_risk_premium

        cost_of_debt_at = input.cost_of_debt * (self.D('1') - input.tax_rate)

        wacc = input.equity_weight * cost_of_equity + input.debt_weight * cost_of_debt_at

        if input.terminal_method == "gordon" and wacc <= input.terminal_growth:
            raise ValueError(f"WACC ({wacc:.4f}) debe ser > terminal growth ({input.terminal_growth:.4f})")

        last_revenue = input.historical_revenue[-1]
        last_nwc = input.historical_nwc[-1]

        fcf_projections = []
        discounted_fcf = []
        revenues_projected = []
        ebitdas_projected = []

        current_revenue = last_revenue
        current_nwc = last_nwc

        for year in range(1, input.projection_years + 1):
            projected_revenue = current_revenue * (self.D('1') + input.revenue_growth_rate)
            revenues_projected.append(projected_revenue)
            projected_ebitda = projected_revenue * input.ebitda_margin
            ebitdas_projected.append(projected_ebitda)

            da_ratio = input.historical_da[-1] / input.historical_revenue[-1] if input.historical_revenue[-1] != 0 else Decimal('0.03')
            projected_da = projected_revenue * da_ratio
            ebit = projected_ebitda - projected_da
            nopat = ebit * (self.D('1') - input.tax_rate)
            projected_capex = projected_revenue * input.capex_pct_revenue
            projected_nwc = projected_revenue * input.nwc_pct_revenue
            delta_nwc = projected_nwc - current_nwc

            fcf = nopat + projected_da - projected_capex - delta_nwc
            fcf_projections.append(fcf)

            discount_factor = (self.D('1') + wacc) ** year
            discounted = fcf / discount_factor
            discounted_fcf.append(discounted)

            current_revenue = projected_revenue
            current_nwc = projected_nwc

        last_fcf = fcf_projections[-1]
        last_ebitda = ebitdas_projected[-1]

        if input.terminal_method == "gordon":
            terminal_value = last_fcf * (self.D('1') + input.terminal_growth) / (wacc - input.terminal_growth)
        else:
            terminal_value = last_ebitda * input.exit_multiple_ebitda

        n = input.projection_years
        discount_factor_tv = (self.D('1') + wacc) ** n
        discounted_tv = terminal_value / discount_factor_tv

        sum_pv_fcf = sum(discounted_fcf)
        enterprise_value = sum_pv_fcf + discounted_tv

        equity_value = enterprise_value - input.net_debt - input.minority_interest + input.non_operating_assets

        tv_pct = discounted_tv / enterprise_value if enterprise_value > 0 else Decimal('0')
        if tv_pct > Decimal('0.7'):
            warnings.append(f"Terminal Value representa {tv_pct:.1%} del EV. Alta dependencia del TV.")

        sensitivity = self._build_sensitivity_table(
            base_wacc=wacc,
            base_growth=input.terminal_growth if input.terminal_method == "gordon" else Decimal('0'),
            last_fcf=last_fcf,
            last_ebitda=last_ebitda,
            terminal_method=input.terminal_method,
            exit_multiple=input.exit_multiple_ebitda,
            n=n,
            sum_pv_fcf=sum_pv_fcf,
            net_debt=input.net_debt,
        )

        return DCFOutput(
            enterprise_value=self._round(enterprise_value),
            equity_value=self._round(equity_value),
            equity_value_per_share=None,
            wacc=self._round(wacc, 4),
            cost_of_equity=self._round(cost_of_equity, 4),
            cost_of_debt_after_tax=self._round(cost_of_debt_at, 4),
            fcf_projections=[self._round(f) for f in fcf_projections],
            discounted_fcf=[self._round(d) for d in discounted_fcf],
            terminal_value=self._round(terminal_value),
            discounted_terminal_value=self._round(discounted_tv),
            terminal_value_pct=self._round(tv_pct, 4),
            sensitivity_table=sensitivity,
            assumptions={
                "projection_years": input.projection_years,
                "revenue_growth": float(input.revenue_growth_rate),
                "ebitda_margin": float(input.ebitda_margin),
                "tax_rate": float(input.tax_rate),
                "terminal_method": input.terminal_method,
                "risk_free_rate": float(input.risk_free_rate),
                "beta": float(input.beta),
                "erp": float(input.equity_risk_premium),
                "country_risk": float(input.country_risk_premium),
            },
            validation_warnings=warnings,
            calculated_at=datetime.utcnow(),
        )

    def _build_sensitivity_table(self, base_wacc, base_growth, last_fcf, last_ebitda, terminal_method, exit_multiple, n, sum_pv_fcf, net_debt):
        table = {"wacc_vs_terminal": []}
        if terminal_method == "gordon":
            wacc_range = [base_wacc + self.D(str(x)) for x in [-0.02, -0.01, 0, 0.01, 0.02]]
            growth_range = [base_growth + self.D(str(x)) for x in [-0.01, 0, 0.005, 0.01]]
            for w in wacc_range:
                row = {"wacc": float(w), "equity_values": []}
                for g in growth_range:
                    if w <= g:
                        row["equity_values"].append(None)
                        continue
                    tv = last_fcf * (self.D('1') + g) / (w - g)
                    pv_tv = tv / ((self.D('1') + w) ** n)
                    ev = sum_pv_fcf + pv_tv
                    equity = ev - net_debt
                    row["equity_values"].append(float(self._round(equity)))
                table["wacc_vs_terminal"].append(row)
        else:
            wacc_range = [base_wacc + self.D(str(x)) for x in [-0.02, -0.01, 0, 0.01, 0.02]]
            multiple_range = [exit_multiple + self.D(str(x)) for x in [-2, -1, 0, 1, 2]]
            for w in wacc_range:
                row = {"wacc": float(w), "equity_values": []}
                for m in multiple_range:
                    tv = last_ebitda * m
                    pv_tv = tv / ((self.D('1') + w) ** n)
                    ev = sum_pv_fcf + pv_tv
                    equity = ev - net_debt
                    row["equity_values"].append(float(self._round(equity)))
                table["wacc_vs_terminal"].append(row)
        return table

    def _round(self, value: Decimal, places: int = 2) -> Decimal:
        return value.quantize(self.D(10) ** -places, rounding=ROUND_HALF_UP)
