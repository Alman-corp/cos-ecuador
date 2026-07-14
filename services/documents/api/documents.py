from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from engines.documents_engine import DocumentsEngine, DocumentCreate

router = APIRouter(prefix="/api/v1/documents", tags=["Documents & Templates"])
engine = DocumentsEngine()


# --- Templates (must be before {doc_id} routes) ---

@router.get("/templates")
async def list_templates(category: Optional[str] = Query(None)):
    templates = engine.list_templates(category)
    return {"data": [t.model_dump() for t in templates]}


@router.post("/templates", status_code=201)
async def create_template(data: dict):
    tpl = engine.create_template(data)
    return {"data": tpl.model_dump()}


@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    tpl = engine.get_template(template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"data": tpl.model_dump()}


@router.put("/templates/{template_id}")
async def update_template(template_id: str, data: dict):
    tpl = engine.update_template(template_id, data)
    if not tpl:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"data": tpl.model_dump()}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    deleted = engine.delete_template(template_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada o es built-in")
    return {"message": "Plantilla eliminada correctamente"}


@router.post("/templates/{template_id}/render")
async def render_template(template_id: str, data: dict):
    rendered = engine.render_template(template_id, data)
    if not rendered:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada")
    return {"data": {"rendered_content": rendered}}


# --- Documents ---

@router.get("/")
async def list_documents(
    client_id: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    docs, total = engine.list_documents(
        client_id=client_id,
        doc_type=doc_type,
        status=status,
        search=search,
        page=page,
        limit=limit,
    )
    return {
        "data": [d.model_dump() for d in docs],
        "total": total,
        "page": page,
        "limit": limit,
    }


@router.post("/", status_code=201)
async def create_document(data: DocumentCreate):
    doc = engine.create_document(data)
    return {"data": doc.model_dump()}


@router.get("/{doc_id}")
async def get_document(doc_id: str):
    doc = engine.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"data": doc.model_dump()}


@router.put("/{doc_id}")
async def update_document(doc_id: str, data: dict):
    doc = engine.update_document(doc_id, data)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"data": doc.model_dump()}


@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    deleted = engine.delete_document(doc_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"message": "Documento eliminado correctamente"}


@router.post("/{doc_id}/versions", status_code=201)
async def create_version(doc_id: str, created_by: str = "system", notes: str = ""):
    version = engine.add_version(doc_id, created_by, notes)
    if not version:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"data": version.model_dump()}


@router.get("/{doc_id}/versions")
async def list_versions(doc_id: str):
    versions = engine.get_versions(doc_id)
    return {"data": [v.model_dump() for v in versions]}


@router.get("/{doc_id}/versions/{version_id}")
async def get_version(doc_id: str, version_id: str):
    version = engine.get_version(doc_id, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Versión no encontrada")
    return {"data": version.model_dump()}


@router.post("/{doc_id}/classify")
async def classify_document(doc_id: str):
    category = engine.classify_document(doc_id)
    if not category:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"data": {"classified_category": category}}


@router.post("/{doc_id}/ocr")
async def ocr_document(doc_id: str):
    text = engine.ocr_document(doc_id)
    if not text:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"data": {"ocr_text": text}}


@router.get("/{doc_id}/download")
async def download_document(doc_id: str):
    url = engine.get_download_url(doc_id)
    if not url:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"data": {"download_url": url}}


@router.get("/{doc_id}/audit")
async def audit_trail(doc_id: str):
    entries = engine.get_audit_trail(doc_id)
    return {"data": [e.model_dump() for e in entries]}
