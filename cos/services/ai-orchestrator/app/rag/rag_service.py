"""FastAPI endpoints para RAG con ISD."""
import os
import httpx
from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/rag", tags=["rag"])

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://web:3000")
INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "")


class RAGQueryRequest(BaseModel):
    query: str
    company_id: str
    client_id: Optional[str] = None
    document_id: Optional[str] = None
    doc_types: Optional[List[str]] = None
    top_k: int = 20
    rerank_top_k: int = 5


class CitationResponse(BaseModel):
    id: str
    text: str
    document_id: str
    chunk_id: str
    page: Optional[int] = None
    section: Optional[str] = None
    heading_path: Optional[List[str]] = None
    filename: str
    relevance_score: float


class RAGQueryResponse(BaseModel):
    answer: str
    citations: List[CitationResponse]
    confidence: float
    sources_used: int
    follow_up_questions: List[str]


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(req: RAGQueryRequest):
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{NEXTJS_URL}/api/internal/rag/query",
                json=req.model_dump(),
                headers={"x-internal-secret": INTERNAL_SECRET},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(502, f"RAG service failed: {str(e)}")


@router.post("/index/{document_id}")
async def index_document(document_id: str, company_id: str, client_id: str):
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{NEXTJS_URL}/api/internal/rag/index/{document_id}",
                params={"company_id": company_id, "client_id": client_id},
                headers={"x-internal-secret": INTERNAL_SECRET},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Index failed: {str(e)}")


@router.delete("/document/{document_id}")
async def remove_document(document_id: str, company_id: str):
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.delete(
                f"{NEXTJS_URL}/api/internal/rag/document/{document_id}",
                params={"company_id": company_id},
                headers={"x-internal-secret": INTERNAL_SECRET},
            )
            response.raise_for_status()
            return {"status": "removed"}
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Remove failed: {str(e)}")


@router.get("/stats")
async def collection_stats():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{os.getenv('QDRANT_URL', 'http://qdrant:6333')}/collections/cos_documents")
            response.raise_for_status()
            data = response.json()["result"]
            return {"points_count": data.get("points_count", 0), "vectors_count": data.get("vectors_count", 0), "status": data.get("status")}
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Stats failed: {str(e)}")
