from fastapi import APIRouter, Depends, HTTPException
from app.calculators.iva_calculator import IVACalculator, IVACalculationInput, IVAResult
from app.api.deps import get_current_tenant

router = APIRouter()


@router.post("/calcular", response_model=IVAResult)
async def calcular_iva_mensual(input_data: IVACalculationInput, tenant_id: str = Depends(get_current_tenant)):
    if input_data.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    return IVACalculator.calculate(input_data)


@router.get("/tarifas")
async def obtener_tarifas():
    from app.calculators.constants import IVATariff, IVA_RATES
    return {t.value: float(IVA_RATES[t]) * 100 for t in IVATariff}
