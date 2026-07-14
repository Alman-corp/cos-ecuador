from typing import Optional, Literal
from pydantic import BaseModel
from scipy.optimize import root
import numpy as np


class CAPMInput(BaseModel):
    risk_free_rate: float = 4.50
    beta: float = 1.2
    equity_risk_premium: float = 6.5
    country_risk_premium: float = 4.0
    size_premium: float = 2.0
    custom_erp: Optional[float] = None


class WACCInput(BaseModel):
    cost_of_equity: float
    cost_of_debt: float = 9.5
    equity_weight: float = 0.7
    debt_weight: float = 0.3
    tax_rate: float = 0.25


class AmortizationInput(BaseModel):
    principal: float
    annual_rate: float
    years: int
    system: Literal["french", "american", "german"] = "french"
    payments_per_year: int = 12


class AmortizationRow(BaseModel):
    period: int
    payment: float
    interest: float
    principal: float
    balance: float


class AmortizationSchedule(BaseModel):
    principal: float
    annual_rate: float
    total_payments: int
    monthly_payment: float
    total_interest: float
    total_cost: float
    schedule: list[AmortizationRow]


class CashFlowInput(BaseModel):
    cashflows: list[float]
    discount_rate: float
    initial_investment: float = 0.0


class CashFlowMetrics(BaseModel):
    npv: float
    irr: float
    payback_years: float
    discounted_payback: float
    profitability_index: float
    future_value: float


class ValuationEngine:
    def capm(self, input_data: CAPMInput) -> dict:
        erp = input_data.custom_erp if input_data.custom_erp is not None else input_data.equity_risk_premium
        ke = (input_data.risk_free_rate
              + input_data.beta * erp
              + input_data.country_risk_premium
              + input_data.size_premium)
        return {
            "cost_of_equity": round(ke, 2),
            "risk_free_rate": input_data.risk_free_rate,
            "beta": input_data.beta,
            "equity_risk_premium": erp,
            "country_risk_premium": input_data.country_risk_premium,
            "size_premium": input_data.size_premium,
        }

    def wacc(self, input_data: WACCInput) -> dict:
        kd_at = input_data.cost_of_debt * (1 - input_data.tax_rate)
        wacc_val = (input_data.equity_weight * input_data.cost_of_equity
                     + input_data.debt_weight * kd_at)
        return {
            "wacc": round(wacc_val, 2),
            "cost_of_equity": input_data.cost_of_equity,
            "cost_of_debt": input_data.cost_of_debt,
            "cost_of_debt_after_tax": round(kd_at, 2),
            "equity_weight": input_data.equity_weight,
            "debt_weight": input_data.debt_weight,
            "tax_rate": input_data.tax_rate,
        }

    def amortization(self, input_data: AmortizationInput) -> AmortizationSchedule:
        n = input_data.years * input_data.payments_per_year
        r = input_data.annual_rate / 100 / input_data.payments_per_year
        schedule = []

        if input_data.system == "french":
            pmt = input_data.principal * (r * (1 + r) ** n) / ((1 + r) ** n - 1) if r > 0 else input_data.principal / n
            balance = input_data.principal
            total_interest = 0.0
            for p in range(1, n + 1):
                interest = balance * r
                principal = pmt - interest
                balance -= principal
                total_interest += interest
                schedule.append(AmortizationRow(
                    period=p, payment=round(pmt, 2), interest=round(interest, 2),
                    principal=round(principal, 2), balance=round(max(balance, 0), 2),
                ))
            total_cost = input_data.principal + total_interest
            return AmortizationSchedule(
                principal=input_data.principal, annual_rate=input_data.annual_rate,
                total_payments=n, monthly_payment=round(pmt, 2),
                total_interest=round(total_interest, 2), total_cost=round(total_cost, 2),
                schedule=schedule,
            )

        elif input_data.system == "american":
            pmt_interest = input_data.principal * r
            total_interest = 0.0
            for p in range(1, n + 1):
                interest = pmt_interest
                principal = 0.0
                balance = input_data.principal
                if p == n:
                    principal = input_data.principal
                    balance = 0.0
                total_interest += interest
                schedule.append(AmortizationRow(
                    period=p, payment=round(interest + principal, 2),
                    interest=round(interest, 2), principal=round(principal, 2),
                    balance=round(balance, 2),
                ))
            total_cost = input_data.principal + total_interest
            return AmortizationSchedule(
                principal=input_data.principal, annual_rate=input_data.annual_rate,
                total_payments=n, monthly_payment=round(pmt_interest, 2),
                total_interest=round(total_interest, 2), total_cost=round(total_cost, 2),
                schedule=schedule,
            )

        elif input_data.system == "german":
            fixed_principal = input_data.principal / n
            balance = input_data.principal
            total_interest = 0.0
            for p in range(1, n + 1):
                interest = balance * r
                pmt = fixed_principal + interest
                balance -= fixed_principal
                total_interest += interest
                schedule.append(AmortizationRow(
                    period=p, payment=round(pmt, 2), interest=round(interest, 2),
                    principal=round(fixed_principal, 2), balance=round(max(balance, 0), 2),
                ))
            total_cost = input_data.principal + total_interest
            return AmortizationSchedule(
                principal=input_data.principal, annual_rate=input_data.annual_rate,
                total_payments=n, monthly_payment=round(schedule[0].payment, 2),
                total_interest=round(total_interest, 2), total_cost=round(total_cost, 2),
                schedule=schedule,
            )

        raise ValueError(f"Sistema de amortización no soportado: {input_data.system}")

    def cashflow_metrics(self, cashflows: list[float], rate: float, initial_investment: float = 0.0) -> CashFlowMetrics:
        r = rate / 100
        npv_val = -initial_investment + sum(cf / (1 + r) ** (i + 1) for i, cf in enumerate(cashflows))

        def npv_func(irr_guess):
            return -initial_investment + sum(cf / (1 + irr_guess) ** (i + 1) for i, cf in enumerate(cashflows))

        irr_val = 0.0
        try:
            sol = root(lambda x: npv_func(x[0]), 0.1)
            irr_val = sol.x[0] if sol.success else 0.0
        except Exception:
            irr_val = 0.0

        cumulative = 0.0
        payback = 0.0
        for i, cf in enumerate(cashflows):
            cumulative += cf
            if cumulative >= initial_investment:
                prev = cumulative - cf
                payback = i + (initial_investment - prev) / cf if cf != 0 else i + 1
                break
        else:
            payback = float(len(cashflows))

        disc_cumulative = 0.0
        disc_payback = 0.0
        for i, cf in enumerate(cashflows):
            disc_cf = cf / (1 + r) ** (i + 1)
            disc_cumulative += disc_cf
            if disc_cumulative >= initial_investment:
                prev = disc_cumulative - disc_cf
                disc_payback = i + (initial_investment - prev) / disc_cf if disc_cf != 0 else i + 1
                break
        else:
            disc_payback = float(len(cashflows))

        pi = (npv_val + initial_investment) / initial_investment if initial_investment != 0 else 0.0
        fv = sum(cf * (1 + r) ** (len(cashflows) - i) for i, cf in enumerate(cashflows))

        return CashFlowMetrics(
            npv=round(npv_val, 2),
            irr=round(irr_val, 4),
            payback_years=round(payback, 2),
            discounted_payback=round(disc_payback, 2),
            profitability_index=round(pi, 2),
            future_value=round(fv, 2),
        )
