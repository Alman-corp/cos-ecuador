"""
Financial Analysis Tools — Quant Engine for Consulting OS.
Replaces junior analyst work: ratio calculation, Monte Carlo simulation, DCF valuation.

Each function is a LangChain Tool (decorated) that can be called by the Financial Agent.
"""

import numpy as np
from scipy import stats
from typing import Optional
from langchain_core.tools import tool


@tool
def calculate_liquidity_ratios(
    current_assets: float,
    current_liabilities: float,
    inventory: float,
    cash_and_equivalents: float,
    accounts_receivable: float,
) -> dict:
    """Calculate liquidity ratios: current ratio, quick ratio (acid test), and cash ratio.
    
    Args:
        current_assets: Total current assets in USD
        current_liabilities: Total current liabilities in USD
        inventory: Inventory value in USD
        cash_and_equivalents: Cash + cash equivalents in USD
        accounts_receivable: Accounts receivable in USD
    """
    if current_liabilities == 0:
        return {"error": "Current liabilities cannot be zero"}

    current_ratio = round(current_assets / current_liabilities, 2)
    quick_ratio = round((current_assets - inventory) / current_liabilities, 2)
    cash_ratio = round((cash_and_equivalents + accounts_receivable) / current_liabilities, 2)

    alerts = []
    alert_level = "LOW"

    if quick_ratio < 1.0:
        alerts.append(
            f"CRITICAL: Quick ratio is {quick_ratio}. The company cannot cover "
            f"short-term obligations without selling inventory. Immediate liquidity risk."
        )
        alert_level = "CRITICAL"
    elif quick_ratio < 1.5:
        alerts.append(
            f"WARNING: Quick ratio is {quick_ratio}. Below the healthy threshold of 1.5. "
            f"Monitor accounts receivable closely."
        )
        alert_level = "HIGH"

    return {
        "current_ratio": current_ratio,
        "quick_ratio": quick_ratio,
        "cash_ratio": cash_ratio,
        "alerts": alerts,
        "alert_level": alert_level,
    }


@tool
def calculate_profitability_ratios(
    revenue: float,
    cogs: float,
    opex: float,
    total_assets: float,
    equity: float,
    net_income: float,
) -> dict:
    """Calculate profitability and efficiency ratios.
    
    Args:
        revenue: Total revenue in USD
        cogs: Cost of goods sold in USD
        opex: Operating expenses in USD
        total_assets: Total assets in USD
        equity: Total equity in USD
        net_income: Net income in USD
    """
    if revenue == 0:
        return {"error": "Revenue cannot be zero"}

    gross_margin = round((revenue - cogs) / revenue * 100, 2)
    ebitda_margin = round((revenue - cogs - opex) / revenue * 100, 2)
    net_margin = round(net_income / revenue * 100, 2)
    roa = round(net_income / total_assets * 100, 2) if total_assets else 0
    roe = round(net_income / equity * 100, 2) if equity else 0

    return {
        "gross_margin_pct": gross_margin,
        "ebitda_margin_pct": ebitda_margin,
        "net_margin_pct": net_margin,
        "return_on_assets_pct": roa,
        "return_on_equity_pct": roe,
    }


@tool
def calculate_leverage_ratios(
    total_liabilities: float,
    equity: float,
    ebitda: float,
    interest_expense: float,
    short_term_debt: float,
    long_term_debt: float,
) -> dict:
    """Calculate leverage and coverage ratios.
    
    Args:
        total_liabilities: Total liabilities in USD
        equity: Total equity in USD
        ebitda: EBITDA in USD
        interest_expense: Annual interest expense in USD
        short_term_debt: Short-term debt in USD
        long_term_debt: Long-term debt in USD
    """
    total_debt = short_term_debt + long_term_debt

    debt_to_equity = round(total_liabilities / equity, 2) if equity else float("inf")
    debt_to_ebitda = round(total_debt / ebitda, 2) if ebitda else float("inf")
    interest_coverage = round(ebitda / interest_expense, 2) if interest_expense else float("inf")

    alerts = []
    alert_level = "LOW"

    if debt_to_equity > 2.0:
        alerts.append(
            f"WARNING: Debt-to-Equity ratio is {debt_to_equity}. "
            f"Above the 2.0 threshold. High financial leverage."
        )
        alert_level = "HIGH"

    if interest_coverage < 2.0:
        alerts.append(
            f"CRITICAL: Interest coverage ratio is {interest_coverage}. "
            f"EBITDA cannot safely cover interest payments. Risk of default."
        )
        alert_level = "CRITICAL"

    return {
        "debt_to_equity": debt_to_equity,
        "debt_to_ebitda": debt_to_ebitda,
        "interest_coverage": interest_coverage,
        "total_debt": total_debt,
        "alerts": alerts,
        "alert_level": alert_level,
    }


@tool
def run_montecarlo_cashflow(
    initial_cash: float,
    monthly_revenue_mean: float,
    monthly_revenue_std: float,
    monthly_opex_mean: float,
    monthly_opex_std: float,
    months: int = 6,
    simulations: int = 10000,
) -> dict:
    """Run Monte Carlo simulation to forecast cash runway.
    
    Performs N simulations of monthly cash flow using stochastic revenue and opex.
    Returns probability distribution of cash position and survival metrics.
    
    Args:
        initial_cash: Starting cash balance in USD
        monthly_revenue_mean: Average monthly revenue in USD
        monthly_revenue_std: Standard deviation of monthly revenue
        monthly_opex_mean: Average monthly opex in USD
        monthly_opex_std: Standard deviation of monthly opex
        months: Number of months to project (default: 6)
        simulations: Number of Monte Carlo iterations (default: 10000)
    """
    rng = np.random.default_rng(42)

    revenue_samples = rng.normal(monthly_revenue_mean, monthly_revenue_std, (simulations, months))
    opex_samples = rng.normal(monthly_opex_mean, monthly_opex_std, (simulations, months))

    # Ensure non-negative values
    revenue_samples = np.maximum(revenue_samples, 0)
    opex_samples = np.maximum(opex_samples, 0)

    net_cash_flow = revenue_samples - opex_samples
    cumulative_cash = initial_cash + np.cumsum(net_cash_flow, axis=1)

    # Calculate runway (months until cash <= 0)
    runway_months = np.full(simulations, months)
    for i in range(simulations):
        for m in range(months):
            if cumulative_cash[i, m] <= 0:
                runway_months[i] = m
                break

    cash_at_end = cumulative_cash[:, -1]

    median_runway = float(np.median(runway_months))
    prob_survive_6mo = float(np.mean(runway_months >= 6))
    prob_default_3mo = float(np.mean(runway_months < 3))

    p10 = float(np.percentile(cash_at_end, 10))
    p50 = float(np.percentile(cash_at_end, 50))
    p90 = float(np.percentile(cash_at_end, 90))

    alert_level = "LOW"
    if prob_default_3mo > 0.3:
        alert_level = "CRITICAL"
    elif prob_survive_6mo < 0.5:
        alert_level = "HIGH"
    elif prob_survive_6mo < 0.75:
        alert_level = "MODERATE"

    return {
        "median_runway_months": round(median_runway, 1),
        "probability_survive_6_months": round(prob_survive_6mo, 3),
        "probability_default_3_months": round(prob_default_3mo, 3),
        "cash_at_6m_p10": round(p10, 2),
        "cash_at_6m_p50": round(p50, 2),
        "cash_at_6m_p90": round(p90, 2),
        "alert_level": alert_level,
    }


@tool
def calculate_dcf_valuation(
    free_cash_flows: list[float],
    terminal_growth_rate: float = 0.03,
    wacc: float = 0.12,
    net_debt: float = 0.0,
    cash_and_equivalents: float = 0.0,
) -> dict:
    """Calculate Discounted Cash Flow (DCF) valuation.
    
    Args:
        free_cash_flows: List of projected FCFs for each year (5 years typical)
        terminal_growth_rate: Perpetual growth rate (default: 3%)
        wacc: Weighted Average Cost of Capital (default: 12%)
        net_debt: Total debt minus cash (default: 0)
        cash_and_equivalents: Cash and equivalents to add back (default: 0)
    """
    if not free_cash_flows or wacc <= 0:
        return {"error": "Invalid inputs: FCF list cannot be empty and WACC must be positive"}

    discount_factors = [(1 + wacc) ** (i + 1) for i in range(len(free_cash_flows))]
    pv_cash_flows = sum(fcf / df for fcf, df in zip(free_cash_flows, discount_factors))

    terminal_fcf = free_cash_flows[-1] * (1 + terminal_growth_rate)
    terminal_value = terminal_fcf / (wacc - terminal_growth_rate) if wacc > terminal_growth_rate else 0
    pv_terminal_value = terminal_value / discount_factors[-1]

    enterprise_value = pv_cash_flows + pv_terminal_value
    equity_value = enterprise_value - net_debt + cash_and_equivalents

    return {
        "enterprise_value": round(enterprise_value, 2),
        "equity_value": round(max(equity_value, 0), 2),
        "pv_of_cash_flows": round(pv_cash_flows, 2),
        "pv_of_terminal_value": round(pv_terminal_value, 2),
        "terminal_value": round(terminal_value, 2),
        "implied_ev_ebitda": None,  # Requires EBITDA input
    }


@tool
def calculate_working_capital(
    accounts_receivable: float,
    accounts_payable: float,
    inventory: float,
    revenue: float,
    cogs: float,
) -> dict:
    """Calculate working capital metrics and cash conversion cycle.
    
    Args:
        accounts_receivable: AR balance in USD
        accounts_payable: AP balance in USD
        inventory: Inventory balance in USD
        revenue: Annual revenue in USD
        cogs: Annual COGS in USD
    """
    if revenue == 0 or cogs == 0:
        return {"error": "Revenue and COGS cannot be zero"}

    net_working_capital = accounts_receivable + inventory - accounts_payable
    days_sales_outstanding = (accounts_receivable / revenue) * 365
    days_inventory_outstanding = (inventory / cogs) * 365
    days_payables_outstanding = (accounts_payable / cogs) * 365
    cash_conversion_cycle = days_sales_outstanding + days_inventory_outstanding - days_payables_outstanding

    alerts = []
    if cash_conversion_cycle > 90:
        alerts.append(
            f"WARNING: Cash conversion cycle is {cash_conversion_cycle:.0f} days. "
            f"Company is financing operations for ~3 months. Review AR collection."
        )

    return {
        "net_working_capital": round(net_working_capital, 2),
        "days_sales_outstanding": round(days_sales_outstanding, 1),
        "days_inventory_outstanding": round(days_inventory_outstanding, 1),
        "days_payables_outstanding": round(days_payables_outstanding, 1),
        "cash_conversion_cycle_days": round(cash_conversion_cycle, 1),
        "alerts": alerts,
    }
