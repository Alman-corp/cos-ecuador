from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from io import BytesIO
from app.generators.ats_generator import ATSGenerator, ATSInput, ATSOutput
from app.api.deps import get_current_tenant

router = APIRouter()


@router.post("/ats/generar", response_model=ATSOutput)
async def generar_ats(input_data: ATSInput, tenant_id: str = Depends(get_current_tenant)):
    if input_data.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    return ATSGenerator.generate(input_data)


@router.post("/ats/descargar-xml")
async def descargar_ats_xml(input_data: ATSInput, tenant_id: str = Depends(get_current_tenant)):
    if input_data.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    result = ATSGenerator.generate(input_data)
    return StreamingResponse(
        BytesIO(result.xml_bytes),
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename=ATS_{input_data.ruc_obligado}_{input_data.periodo_fiscal}.xml"},
    )


@router.post("/ats/descargar-csv")
async def descargar_ats_csv(input_data: ATSInput, tenant_id: str = Depends(get_current_tenant)):
    if input_data.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Tenant mismatch")
    result = ATSGenerator.generate(input_data)
    return StreamingResponse(
        BytesIO(result.csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ATS_{input_data.ruc_obligado}_{input_data.periodo_fiscal}.csv"},
    )
