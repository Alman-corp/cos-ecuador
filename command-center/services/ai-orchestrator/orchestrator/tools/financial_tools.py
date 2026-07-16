from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass, field
from typing import List
import math
import random


@dataclass
class DCFResult:
    enterprise_value: Decimal
    equity_value: Decimal
    fcf_projections: List[Decimal]
    terminal_value: Decimal
    assumptions: dict


@dataclass
class MonteCarloResult:
    iterations: int
    mean: Decimal
    percentiles: dict
    histogram_base64: str = ""


@dataclass
class FinancialRatios:
    liquidity: dict
    solvency: dict
    profitability: dict
    efficiency: dict


def run_dcf(
    historical_fcf: List[Decimal],
    growth_rate: Decimal,
    wacc: Decimal,
    terminal_growth: Decimal,
    debt: Decimal,
    cash: Decimal,
    projection_years: int = 5,
) -> DCFResult:
    if terminal_growth > Decimal("0.03"):
        terminal_growth = Decimal("0.03")

    projections = []
    last_fcf = historical_fcf[-1] if historical_fcf else Decimal("0")

    for year in range(1, projection_years + 1):
        projected_fcf = last_fcf * (Decimal("1") + growth_rate) ** year
        projections.append(projected_fcf)

    pv_fcfs = []
    for i, fcf in enumerate(projections, 1):
        pv_fcf = fcf / (Decimal("1") + wacc) ** i
        pv_fcfs.append(pv_fcf)

    terminal_value = (
        projections[-1] * (Decimal("1") + terminal_growth) /
        (wacc - terminal_growth)
    )
    pv_terminal = terminal_value / (Decimal("1") + wacc) ** projection_years

    enterprise_value = sum(pv_fcfs) + pv_terminal
    equity_value = enterprise_value - debt + cash

    return DCFResult(
        enterprise_value=enterprise_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        equity_value=equity_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        fcf_projections=[p.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP) for p in projections],
        terminal_value=terminal_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        assumptions={
            "growth_rate": float(growth_rate),
            "wacc": float(wacc),
            "terminal_growth": float(terminal_growth),
            "projection_years": projection_years,
            "debt": float(debt),
            "cash": float(cash),
        },
    )


def run_montecarlo_valuation(
    base_fcf: float,
    growth_mean: float,
    growth_std: float,
    wacc_mean: float,
    wacc_std: float,
    iterations: int = 10000,
    projection_years: int = 5,
) -> MonteCarloResult:
    random.seed(42)
    values = []

    for _ in range(iterations):
        g = random.gauss(growth_mean, growth_std)
        w = random.gauss(wacc_mean, wacc_std)
        if w <= g + 0.01:
            w = g + 0.02

        fcf = base_fcf
        pv_sum = 0.0
        for y in range(1, projection_years + 1):
            fcf *= (1 + g)
            pv_sum += fcf / ((1 + w) ** y)

        tv = fcf * (1 + 0.02) / (w - 0.02)
        pv_tv = tv / ((1 + w) ** projection_years)
        ev = pv_sum + pv_tv
        values.append(ev)

    values.sort()
    mean = sum(values) / len(values)
    percentiles = {
        "p5": values[int(len(values) * 0.05)],
        "p25": values[int(len(values) * 0.25)],
        "p50": values[int(len(values) * 0.50)],
        "p75": values[int(len(values) * 0.75)],
        "p95": values[int(len(values) * 0.95)],
    }

    return MonteCarloResult(
        iterations=iterations,
        mean=Decimal(str(mean)).quantize(Decimal("0.01")),
        percentiles={k: Decimal(str(v)).quantize(Decimal("0.01")) for k, v in percentiles.items()},
    )


def calculate_financial_ratios(data: dict) -> dict:
    ca = Decimal(str(data.get("current_assets", 0)))
    cl = Decimal(str(data.get("current_liabilities", 0)))
    ta = Decimal(str(data.get("total_assets", 0)))
    tl = Decimal(str(data.get("total_liabilities", 0)))
    eq = Decimal(str(data.get("equity", 0)))
    rev = Decimal(str(data.get("revenue", 0)))
    cogs = Decimal(str(data.get("cogs", 0)))
    opex = Decimal(str(data.get("operating_expenses", 0)))
    ni = Decimal(str(data.get("net_income", 0)))
    inventory = Decimal(str(data.get("inventory", 0)))
    receivables = Decimal(str(data.get("receivables", 0)))

    ratios = {
        "liquidity": {
            "current_ratio": float((ca / cl).quantize(Decimal("0.01"))) if cl != 0 else 0,
            "quick_ratio": float(((ca - inventory) / cl).quantize(Decimal("0.01"))) if cl != 0 else 0,
            "cash_ratio": float(((ca - inventory - receivables) / cl).quantize(Decimal("0.01"))) if cl != 0 else 0,
        },
        "solvency": {
            "debt_to_equity": float((tl / eq).quantize(Decimal("0.01"))) if eq != 0 else 0,
            "debt_ratio": float((tl / ta).quantize(Decimal("0.01"))) if ta != 0 else 0,
            "interest_coverage": float(((ni + opex + Decimal("0")) / Decimal("1")).quantize(Decimal("0.01"))) if Decimal("1") != 0 else 0,
        },
        "profitability": {
            "net_margin": float((ni / rev * 100).quantize(Decimal("0.01"))) if rev != 0 else 0,
            "gross_margin": float(((rev - cogs) / rev * 100).quantize(Decimal("0.01"))) if rev != 0 else 0,
            "roa": float((ni / ta * 100).quantize(Decimal("0.01"))) if ta != 0 else 0,
            "roe": float((ni / eq * 100).quantize(Decimal("0.01"))) if eq != 0 else 0,
        },
        "efficiency": {
            "asset_turnover": float((rev / ta).quantize(Decimal("0.01"))) if ta != 0 else 0,
        },
    }

    return ratios
