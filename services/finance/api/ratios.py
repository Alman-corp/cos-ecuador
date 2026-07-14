from fastapi import APIRouter, HTTPException
from engines.ratios_engine import RatiosEngine, FinancialStatements
from engines.ratios_engine import LiquidityRatios, ProfitabilityRatios, LeverageRatios, EfficiencyRatios

router = APIRouter(prefix="/api/v1/finance", tags=["Financial Ratios"])
engine = RatiosEngine()


@router.post(
    "/ratios/liquidity",
    response_model=LiquidityRatios,
    summary="Liquidity Ratios",
    description="Razones de liquidez: corriente, prueba ácida, efectivo, capital de trabajo.",
)
async def liquidity_ratios(fs: FinancialStatements):
    try:
        return engine.liquidity(fs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/ratios/profitability",
    response_model=ProfitabilityRatios,
    summary="Profitability Ratios",
    description="Razones de rentabilidad: margen bruto, operativo, neto, EBITDA, ROA, ROE, ROCE.",
)
async def profitability_ratios(fs: FinancialStatements):
    try:
        return engine.profitability(fs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/ratios/leverage",
    response_model=LeverageRatios,
    summary="Leverage Ratios",
    description="Razones de endeudamiento: D/E, debt ratio, equity ratio, cobertura de intereses, D/EBITDA.",
)
async def leverage_ratios(fs: FinancialStatements):
    try:
        return engine.leverage(fs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/ratios/efficiency",
    response_model=EfficiencyRatios,
    summary="Efficiency Ratios",
    description="Razones de eficiencia: rotación de activos, inventarios, cuentas por cobrar/pagar, CCC.",
)
async def efficiency_ratios(fs: FinancialStatements):
    try:
        return engine.efficiency(fs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/ratios/full",
    response_model=dict,
    summary="All Ratios",
    description="Calcula todos los indicadores financieros (liquidez, rentabilidad, endeudamiento, eficiencia) en una sola llamada.",
)
async def all_ratios(fs: FinancialStatements):
    try:
        return engine.all_ratios(fs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
