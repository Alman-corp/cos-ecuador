from typing import Optional
from pydantic import BaseModel


class ProjectionInput(BaseModel):
    base_revenue: float
    growth_rates: list[float]
    cogs_pct: float = 0.6
    sgna_pct: float = 0.15
    da_pct_revenue: float = 0.03
    capex_pct_revenue: float = 0.04
    nwc_pct_revenue: float = 0.02
    tax_rate: float = 0.25
    years: int = 5


class ProjectionOutput(BaseModel):
    income_statement: list[dict]
    cashflow: list[dict]
    balance_sheet: list[dict]
    summary: dict


class ProjectionsEngine:
    def project(self, input_data: ProjectionInput) -> ProjectionOutput:
        income_statement = []
        cashflow = []
        balance_sheet = []
        total_fcf = 0.0
        total_revenue = 0.0
        total_net_income = 0.0

        rev = input_data.base_revenue
        accumulated_equity = 0.0
        accumulated_debt = 0.0
        accumulated_assets = 0.0
        accumulated_nwc = 0.0

        for y in range(input_data.years):
            growth = input_data.growth_rates[y] if y < len(input_data.growth_rates) else input_data.growth_rates[-1]
            rev *= (1 + growth / 100) if y > 0 else (1 + input_data.growth_rates[0] / 100)
            if y == 0:
                rev = input_data.base_revenue * (1 + input_data.growth_rates[0] / 100)

            cogs = rev * input_data.cogs_pct
            gross_profit = rev - cogs
            sgna = rev * input_data.sgna_pct
            ebitda = gross_profit - sgna
            da = rev * input_data.da_pct_revenue
            ebit = ebitda - da
            tax = ebit * input_data.tax_rate if ebit > 0 else 0.0
            net_income = ebit - tax

            is_row = {
                "year": y + 1,
                "revenue": round(rev, 2),
                "cogs": round(cogs, 2),
                "gross_profit": round(gross_profit, 2),
                "sgna": round(sgna, 2),
                "ebitda": round(ebitda, 2),
                "da": round(da, 2),
                "ebit": round(ebit, 2),
                "tax": round(tax, 2),
                "net_income": round(net_income, 2),
            }
            income_statement.append(is_row)

            capex = rev * input_data.capex_pct_revenue
            nwc = rev * input_data.nwc_pct_revenue
            delta_nwc = nwc - accumulated_nwc if y > 0 else nwc
            fcf = ebitda * (1 - input_data.tax_rate) + da * input_data.tax_rate - capex - delta_nwc
            accumulated_nwc = nwc
            total_fcf += fcf

            cf_row = {
                "year": y + 1,
                "ebitda": round(ebitda, 2),
                "tax_on_ebitda": round(-ebitda * input_data.tax_rate, 2),
                "nopat": round(ebitda * (1 - input_data.tax_rate), 2),
                "da_add_back": round(da * input_data.tax_rate, 2),
                "capex": round(-capex, 2),
                "delta_nwc": round(-delta_nwc, 2),
                "fcf": round(fcf, 2),
            }
            cashflow.append(cf_row)

            accumulated_equity += net_income
            accumulated_debt += 0
            accumulated_assets += net_income + da

            bs_row = {
                "year": y + 1,
                "cash": round(accumulated_assets * 0.3, 2),
                "receivables": round(rev * 0.1, 2),
                "inventory": round(cogs * 0.15, 2),
                "current_assets": round(accumulated_assets * 0.4, 2),
                "ppe_net": round(accumulated_assets * 0.6, 2),
                "total_assets": round(accumulated_assets, 2),
                "current_liabilities": round(rev * 0.08, 2),
                "long_term_debt": round(max(accumulated_debt, 0), 2),
                "total_liabilities": round(rev * 0.08 + max(accumulated_debt, 0), 2),
                "equity": round(max(accumulated_equity, 0), 2),
                "total_liabilities_equity": round(accumulated_assets, 2),
            }
            balance_sheet.append(bs_row)

            total_revenue += rev
            total_net_income += net_income

        summary = {
            "total_revenue": round(total_revenue, 2),
            "total_net_income": round(total_net_income, 2),
            "total_fcf": round(total_fcf, 2),
            "avg_net_margin": round(total_net_income / total_revenue * 100, 2) if total_revenue != 0 else 0.0,
            "final_revenue": round(rev, 2),
            "years_projected": input_data.years,
        }

        return ProjectionOutput(
            income_statement=income_statement,
            cashflow=cashflow,
            balance_sheet=balance_sheet,
            summary=summary,
        )
