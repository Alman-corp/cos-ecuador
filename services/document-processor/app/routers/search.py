import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException

from app.embeddings.service import EmbeddingService
from app.retrieval.hybrid_retriever import HybridRetriever

logger = logging.getLogger(__name__)
router = APIRouter()

embedder = EmbeddingService()
retriever = HybridRetriever(embedder)


@router.post("/hybrid")
async def hybrid_search(
    query: str,
    chunks: List[dict],
    law_type: Optional[str] = None,
    company_id: Optional[str] = None,
):
    try:
        results = await retriever.search(
            query=query,
            chunks=chunks,
            law_type=law_type,
            company_id=company_id,
        )
        return {
            "query": query,
            "results": results,
            "total": len(results),
        }
    except Exception as e:
        logger.exception(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
