from typing import Optional
from pydantic import BaseModel


class DCFInput(BaseModel):
    revenue: list[float]
    ebitda: list[float]
    capex: list[float]
    depreciation: list[float]
    nwc_change: list[float]
    revenue_growth: list[float]
    ebitda_margin: list[float]
    capex_pct_revenue: list[float]
    nwc_pct_revenue: list[float]
    risk_free_rate: float = 4.50
    beta: float = 1.2
    equity_risk_premium: float = 6.5
    country_risk_premium: float = 4.0
    size_premium: float = 2.0
    cost_of_debt: float = 9.5
    debt_weight: float = 0.3
    equity_weight: float = 0.7
    tax_rate: float = 0.25
    terminal_growth_rate: float = 2.0
    terminal_exit_multiple: Optional[float] = None
    net_debt: float = 0.0
    minority_interest: float = 0.0
    non_operating_assets: float = 0.0
    shares_outstanding: Optional[float] = None


class DCFOutput(BaseModel):
    enterprise_value: float
    equity_value: float
    wacc: float
    cost_of_equity: float
    cost_of_debt_after_tax: float
    fcf_projections: list[float]
    discounted_fcf: list[float]
    terminal_value: float
    discounted_terminal: float
    ev_to_ebitda: Optional[float]
    price_per_share: Optional[float]
    sensitivity_table: list[list[float]]
    terminal_value_pct: float


class DCFEngine:
    def calculate(self, input_data: DCFInput) -> DCFOutput:
        n_years = len(input_data.revenue_growth)

        ke = (input_data.risk_free_rate / 100
              + input_data.beta * (input_data.equity_risk_premium / 100)
              + input_data.country_risk_premium / 100
              + input_data.size_premium / 100)

        kd_at = (input_data.cost_of_debt / 100) * (1 - input_data.tax_rate)

        wacc = (input_data.equity_weight * ke
                + input_data.debt_weight * kd_at)

        last_revenue = input_data.revenue[-1]
        fcf_projections = []
        discounted_fcf = []
        ebitdas_projected = []
        current_revenue = last_revenue
        last_nwc = input_data.nwc_change[-1] if input_data.nwc_change else 0.0

        for y in range(n_years):
            rev = current_revenue * (1 + input_data.revenue_growth[y] / 100)
            ebitda = rev * input_data.ebitda_margin[y]
            ebitdas_projected.append(ebitda)
            da = rev * (input_data.depreciation[-1] / input_data.revenue[-1]) if input_data.revenue[-1] != 0 else rev * 0.03
            ebit = ebitda - da
            nopat = ebit * (1 - input_data.tax_rate)
            capex = rev * input_data.capex_pct_revenue[y]
            nwc = rev * input_data.nwc_pct_revenue[y]
            delta_nwc = nwc - last_nwc
            fcf = nopat + da - capex - delta_nwc
            fcf_projections.append(fcf)
            df = 1.0 / ((1.0 + wacc) ** (y + 1))
            discounted_fcf.append(fcf * df)
            current_revenue = rev
            last_nwc = nwc

        last_fcf = fcf_projections[-1] if fcf_projections else 0.0
        last_ebitda = ebitdas_projected[-1] if ebitdas_projected else 0.0

        terminal_growth_dec = input_data.terminal_growth_rate / 100
        if input_data.terminal_exit_multiple is not None:
            terminal_value = last_ebitda * input_data.terminal_exit_multiple
        else:
            if wacc <= terminal_growth_dec:
                raise ValueError(f"WACC ({wacc:.4%}) debe ser > terminal growth ({terminal_growth_dec:.4%})")
            terminal_value = last_fcf * (1 + terminal_growth_dec) / (wacc - terminal_growth_dec)

        discounted_terminal = terminal_value / ((1.0 + wacc) ** n_years)

        sum_pv_fcf = sum(discounted_fcf)
        enterprise_value = sum_pv_fcf + discounted_terminal
        equity_value = enterprise_value - input_data.net_debt - input_data.minority_interest + input_data.non_operating_assets

        tv_pct = discounted_terminal / enterprise_value if enterprise_value != 0 else 0.0

        ev_to_ebitda = enterprise_value / last_ebitda if last_ebitda != 0 else None

        price_per_share = None
        if input_data.shares_outstanding and input_data.shares_outstanding > 0:
            price_per_share = equity_value / input_data.shares_outstanding

        wacc_dec = wacc
        g_dec = terminal_growth_dec
        sens = []
        wacc_steps = [wacc_dec - 0.02, wacc_dec - 0.01, wacc_dec, wacc_dec + 0.01, wacc_dec + 0.02]
        growth_steps = [g_dec - 0.01, g_dec - 0.005, g_dec, g_dec + 0.005, g_dec + 0.01]
        for w in wacc_steps:
            row = []
            for g in growth_steps:
                if w <= g:
                    row.append(0.0)
                    continue
                tv = last_fcf * (1 + g) / (w - g) if input_data.terminal_exit_multiple is None else last_ebitda * input_data.terminal_exit_multiple
                pv_tv = tv / ((1.0 + w) ** n_years)
                ev = sum_pv_fcf + pv_tv
                eq = ev - input_data.net_debt
                row.append(round(eq, 2))
            sens.append(row)

        return DCFOutput(
            enterprise_value=round(enterprise_value, 2),
            equity_value=round(equity_value, 2),
            wacc=round(wacc, 4),
            cost_of_equity=round(ke, 4),
            cost_of_debt_after_tax=round(kd_at, 4),
            fcf_projections=[round(f, 2) for f in fcf_projections],
            discounted_fcf=[round(d, 2) for d in discounted_fcf],
            terminal_value=round(terminal_value, 2),
            discounted_terminal=round(discounted_terminal, 2),
            ev_to_ebitda=round(ev_to_ebitda, 2) if ev_to_ebitda is not None else None,
            price_per_share=round(price_per_share, 2) if price_per_share is not None else None,
            sensitivity_table=sens,
            terminal_value_pct=round(tv_pct, 4),
        )
