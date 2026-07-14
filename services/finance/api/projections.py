from fastapi import APIRouter, HTTPException
from engines.projections_engine import ProjectionsEngine, ProjectionInput, ProjectionOutput

router = APIRouter(prefix="/api/v1/finance", tags=["Projections"])
engine = ProjectionsEngine()


@router.post(
    "/project/income-statement",
    summary="Project Income Statement",
    description="Proyecta el estado de resultados (P&L) año por año dados ingresos base y tasas de crecimiento.",
)
async def project_income_statement(input_data: ProjectionInput):
    try:
        result = engine.project(input_data)
        return {"income_statement": result.income_statement, "summary": result.summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/project/cashflow",
    summary="Project Cash Flow",
    description="Proyecta el flujo de caja libre (FCF) con capex, D&A y variación de NWC.",
)
async def project_cashflow(input_data: ProjectionInput):
    try:
        result = engine.project(input_data)
        return {"cashflow": result.cashflow, "summary": result.summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/project/financial-statements",
    response_model=ProjectionOutput,
    summary="Full 3-Statement Projection",
    description="Proyecta los 3 estados financieros (P&L, FCF, Balance General) año por año.",
)
async def project_full_statements(input_data: ProjectionInput):
    try:
        return engine.project(input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
