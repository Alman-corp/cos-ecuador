from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os

app = FastAPI(title="Advanced RAG API")

class QueryRequest(BaseModel):
    query: str
    companyId: str
    clientId: Optional[str] = None
    docTypes: Optional[List[str]] = None
    languages: Optional[List[str]] = None

class CitationModel(BaseModel):
    text: str
    document_id: str
    page: Optional[int] = None
    paragraph: Optional[int] = None
    cell: Optional[str] = None
    section: Optional[str] = None
    source: str
    confidence: float

class QueryResponse(BaseModel):
    answer: str
    citations: List[CitationModel]
    confidence: float
    latency_ms: int
    follow_up_questions: List[str]

class StatsResponse(BaseModel):
    chunks: int
    entities: int
    relations: int
    cacheStats: dict
    graphStats: dict
    isdStats: dict

NEXTJS_URL = os.environ.get("NEXTJS_URL", "http://host.docker.internal:3000")

@app.post("/api/advanced-rag/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{NEXTJS_URL}/api/rag/advanced/query",
            json=request.model_dump(),
            timeout=60.0,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()

@app.get("/api/advanced-rag/stats", response_model=StatsResponse)
async def get_stats():
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{NEXTJS_URL}/api/rag/advanced/stats", timeout=10.0)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()

@app.get("/api/advanced-rag/health")
async def health():
    return {"status": "ok", "service": "advanced-rag", "nextjs_url": NEXTJS_URL}
