from fastapi import APIRouter, Depends
from app.services.cruces_service import CrucesService, CrucesInput, CrucesResult
from app.api.deps import get_current_tenant

router = APIRouter()
cruces_service = CrucesService()


@router.post("/ejecutar", response_model=CrucesResult)
async def ejecutar_cruces(input_data: CrucesInput, tenant_id: str = Depends(get_current_tenant)):
    return await cruces_service.execute(input_data)
