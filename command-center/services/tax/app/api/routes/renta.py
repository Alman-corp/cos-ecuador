from fastapi import APIRouter, Depends, HTTPException
from app.calculators.renta_calculator import RentaCalculator, RentaInput, RentaResult
from app.api.deps import get_current_tenant

router = APIRouter()


@router.post("/calcular", response_model=RentaResult)
async def calcular_renta_anual(input_data: RentaInput, tenant_id: str = Depends(get_current_tenant)):
    if input_data.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    return RentaCalculator.calculate(input_data)


@router.get("/tabla-progresiva")
async def obtener_tabla_progresiva():
    from app.calculators.constants import TABLA_PROGRESIVA_PN_2024
    return [{"limite": float(l), "tasa": float(t) * 100, "deduccion": float(d)} for l, t, d in TABLA_PROGRESIVA_PN_2024]
