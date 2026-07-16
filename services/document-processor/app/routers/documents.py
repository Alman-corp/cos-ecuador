import logging
import uuid
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.pipeline import DocumentPipeline

logger = logging.getLogger(__name__)
router = APIRouter()
pipeline = DocumentPipeline()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    company_id: str = Form(...),
    category: Optional[str] = Form(None),
    law_type: Optional[str] = Form(None),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")

    content = await file.read()
    document_id = str(uuid.uuid4())
    metadata = {
        "category": category,
        "law_type": law_type,
        "file_name": file.filename,
        "file_type": file.content_type,
        "file_size": len(content),
    }

    try:
        result = await pipeline.process_document(
            file_content=content,
            filename=file.filename,
            company_id=company_id,
            document_id=document_id,
            metadata=metadata,
        )
        return result
    except Exception as e:
        logger.exception(f"Document processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-base64")
async def upload_document_base64(
    filename: str,
    content_base64: str,
    company_id: str,
    category: Optional[str] = None,
    law_type: Optional[str] = None,
):
    import base64
    try:
        content = base64.b64decode(content_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 content")

    document_id = str(uuid.uuid4())
    metadata = {
        "category": category,
        "law_type": law_type,
        "file_name": filename,
        "file_size": len(content),
    }

    try:
        result = await pipeline.process_document(
            file_content=content,
            filename=filename,
            company_id=company_id,
            document_id=document_id,
            metadata=metadata,
        )
        return result
    except Exception as e:
        logger.exception(f"Document processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
