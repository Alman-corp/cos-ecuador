from pydantic import BaseModel
from typing import Optional


class FinancialStatements(BaseModel):
    current_assets: float
    current_liabilities: float
    cash: float
    total_assets: float
    total_equity: float
    total_liabilities: float
    ebit: float
    net_income: float
    revenue: float
    ebitda: float
    inventories: float
    accounts_receivable: float
    accounts_payable: float
    cost_of_goods_sold: float
    interest_expense: float
    operating_cashflow: float


class LiquidityRatios(BaseModel):
    current_ratio: float
    quick_ratio: float
    cash_ratio: float
    working_capital: float


class ProfitabilityRatios(BaseModel):
    gross_margin: float
    operating_margin: float
    net_margin: float
    ebitda_margin: float
    roa: float
    roe: float
    roce: float


class LeverageRatios(BaseModel):
    debt_to_equity: float
    debt_ratio: float
    equity_ratio: float
    interest_coverage: float
    debt_to_ebitda: float


class EfficiencyRatios(BaseModel):
    asset_turnover: float
    inventory_turnover: float
    receivables_turnover: float
    payables_turnover: float
    days_sales_outstanding: float
    days_inventory_outstanding: float
    days_payables_outstanding: float
    cash_conversion_cycle: float


class RatiosEngine:
    def liquidity(self, fs: FinancialStatements) -> LiquidityRatios:
        cr = fs.current_assets / fs.current_liabilities if fs.current_liabilities != 0 else 0.0
        qr = (fs.current_assets - fs.inventories) / fs.current_liabilities if fs.current_liabilities != 0 else 0.0
        cash_r = fs.cash / fs.current_liabilities if fs.current_liabilities != 0 else 0.0
        wc = fs.current_assets - fs.current_liabilities
        return LiquidityRatios(
            current_ratio=round(cr, 2),
            quick_ratio=round(qr, 2),
            cash_ratio=round(cash_r, 2),
            working_capital=round(wc, 2),
        )

    def profitability(self, fs: FinancialStatements) -> ProfitabilityRatios:
        gm = ((fs.revenue - fs.cost_of_goods_sold) / fs.revenue * 100) if fs.revenue != 0 else 0.0
        om = (fs.ebit / fs.revenue * 100) if fs.revenue != 0 else 0.0
        nm = (fs.net_income / fs.revenue * 100) if fs.revenue != 0 else 0.0
        em = (fs.ebitda / fs.revenue * 100) if fs.revenue != 0 else 0.0
        roa = (fs.net_income / fs.total_assets * 100) if fs.total_assets != 0 else 0.0
        roe = (fs.net_income / fs.total_equity * 100) if fs.total_equity != 0 else 0.0
        ce = fs.total_assets - fs.total_liabilities
        roce = (fs.ebit / ce * 100) if ce != 0 else 0.0
        return ProfitabilityRatios(
            gross_margin=round(gm, 2),
            operating_margin=round(om, 2),
            net_margin=round(nm, 2),
            ebitda_margin=round(em, 2),
            roa=round(roa, 2),
            roe=round(roe, 2),
            roce=round(roce, 2),
        )

    def leverage(self, fs: FinancialStatements) -> LeverageRatios:
        de = fs.total_liabilities / fs.total_equity if fs.total_equity != 0 else 0.0
        dr = fs.total_liabilities / fs.total_assets if fs.total_assets != 0 else 0.0
        er = fs.total_equity / fs.total_assets if fs.total_assets != 0 else 0.0
        ic = fs.ebit / fs.interest_expense if fs.interest_expense != 0 else 0.0
        d_ebitda = fs.total_liabilities / fs.ebitda if fs.ebitda != 0 else 0.0
        return LeverageRatios(
            debt_to_equity=round(de, 2),
            debt_ratio=round(dr, 2),
            equity_ratio=round(er, 2),
            interest_coverage=round(ic, 2),
            debt_to_ebitda=round(d_ebitda, 2),
        )

    def efficiency(self, fs: FinancialStatements) -> EfficiencyRatios:
        at = fs.revenue / fs.total_assets if fs.total_assets != 0 else 0.0
        it = fs.cost_of_goods_sold / fs.inventories if fs.inventories != 0 else 0.0
        rt = fs.revenue / fs.accounts_receivable if fs.accounts_receivable != 0 else 0.0
        pt = fs.cost_of_goods_sold / fs.accounts_payable if fs.accounts_payable != 0 else 0.0
        dso = 365 / rt if rt != 0 else 0.0
        dio = 365 / it if it != 0 else 0.0
        dpo = 365 / pt if pt != 0 else 0.0
        ccc = dso + dio - dpo
        return EfficiencyRatios(
            asset_turnover=round(at, 2),
            inventory_turnover=round(it, 2),
            receivables_turnover=round(rt, 2),
            payables_turnover=round(pt, 2),
            days_sales_outstanding=round(dso, 2),
            days_inventory_outstanding=round(dio, 2),
            days_payables_outstanding=round(dpo, 2),
            cash_conversion_cycle=round(ccc, 2),
        )

    def all_ratios(self, fs: FinancialStatements) -> dict:
        return {
            "liquidity": self.liquidity(fs).model_dump(),
            "profitability": self.profitability(fs).model_dump(),
            "leverage": self.leverage(fs).model_dump(),
            "efficiency": self.efficiency(fs).model_dump(),
        }
