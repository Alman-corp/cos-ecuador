from fastapi import APIRouter, HTTPException
from engines.valuation_engine import (
    ValuationEngine, CAPMInput, WACCInput,
    AmortizationInput, AmortizationSchedule,
    CashFlowInput, CashFlowMetrics,
)


router = APIRouter(prefix="/api/v1/finance", tags=["Valuation"])
engine = ValuationEngine()


@router.post(
    "/capm",
    summary="CAPM — Cost of Equity",
    description="Calcula el costo del equity vía CAPM con prima de riesgo país Ecuador.",
)
async def calculate_capm(input_data: CAPMInput):
    try:
        return engine.capm(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/wacc",
    summary="WACC — Weighted Average Cost of Capital",
    description="Calcula el WACC ponderando CAPM y costo de deuda después de impuestos.",
)
async def calculate_wacc(input_data: WACCInput):
    try:
        return engine.wacc(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/amortization",
    response_model=AmortizationSchedule,
    summary="Loan Amortization Schedule",
    description="Genera tabla de amortización: sistema Francés (cuota fija), Americano (solo intereses + bala), Alemán (cuota decreciente).",
)
async def calculate_amortization(input_data: AmortizationInput):
    try:
        return engine.amortization(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/compounding",
    response_model=CashFlowMetrics,
    summary="NPV, IRR, Payback, Future Value",
    description="Calcula VPN, TIR, payback simple/descontado, índice de rentabilidad y valor futuro.",
)
async def calculate_compounding(input_data: CashFlowInput):
    try:
        return engine.cashflow_metrics(input_data.cashflows, input_data.discount_rate, input_data.initial_investment)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
