import logging
from typing import List, Optional, Dict, Any
from math import exp

import numpy as np
from rank_bm25 import BM25Okapi

from app.config import settings
from app.embeddings.service import EmbeddingService

logger = logging.getLogger(__name__)


class HybridRetriever:
    def __init__(self, embedder: EmbeddingService):
        self.embedder = embedder
        self.top_k = settings.top_k_hybrid
        self.rerank_k = settings.top_k_rerank
        self.vector_weight = settings.vector_weight
        self.bm25_weight = settings.bm25_weight
        self.rrf_k = settings.rrf_k

    async def search(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        law_type: Optional[str] = None,
        company_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not chunks:
            return []

        filtered = self._filter_chunks(chunks, law_type, company_id)
        if not filtered:
            return []

        query_embedding = await self.embedder.embed_query(query)

        vector_results = self._vector_search(query_embedding, filtered)
        bm25_results = self._bm25_search(query, filtered)

        combined = self._rrf_merge(vector_results, bm25_results)

        reranked = self._rerank(query, combined)
        return reranked[: self.rerank_k]

    def _filter_chunks(
        self,
        chunks: List[Dict[str, Any]],
        law_type: Optional[str] = None,
        company_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        filtered = chunks
        if law_type:
            filtered = [
                c for c in filtered
                if c.get("law_type", "").upper() == law_type.upper()
            ]
        if company_id:
            filtered = [
                c for c in filtered
                if c.get("company_id") == company_id
            ]
        return filtered

    def _vector_search(
        self, query_embedding: List[float], chunks: List[Dict[str, Any]]
    ) -> List[tuple]:
        scored = []
        for chunk in chunks:
            chunk_emb = chunk.get("embedding")
            if chunk_emb is None:
                continue
            score = self._cosine_similarity(query_embedding, chunk_emb)
            scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[: self.top_k]

    def _bm25_search(
        self, query: str, chunks: List[Dict[str, Any]]
    ) -> List[tuple]:
        tokenized_corpus = [
            chunk["content"].lower().split() for chunk in chunks
        ]
        bm25 = BM25Okapi(tokenized_corpus, k1=settings.bm25_k1, b=settings.bm25_b)
        tokenized_query = query.lower().split()
        scores = bm25.get_scores(tokenized_query)

        scored = [
            (float(scores[i]), chunks[i])
            for i in range(len(chunks))
        ]
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[: self.top_k]

    def _rrf_merge(
        self, vector_results: List[tuple], bm25_results: List[tuple]
    ) -> List[Dict[str, Any]]:
        seen = {}
        for rank, (score, chunk) in enumerate(vector_results):
            chunk_id = id(chunk)
            rrf_score = self.vector_weight / (self.rrf_k + rank + 1)
            if chunk_id in seen:
                seen[chunk_id]["score"] += rrf_score
            else:
                seen[chunk_id] = {
                    "chunk": chunk,
                    "score": rrf_score,
                    "vector_score": score,
                }

        for rank, (score, chunk) in enumerate(bm25_results):
            chunk_id = id(chunk)
            rrf_score = self.bm25_weight / (self.rrf_k + rank + 1)
            if chunk_id in seen:
                seen[chunk_id]["score"] += rrf_score
            else:
                seen[chunk_id] = {
                    "chunk": chunk,
                    "score": rrf_score,
                    "bm25_score": score,
                }

        results = sorted(
            seen.values(), key=lambda x: x["score"], reverse=True
        )
        return results

    def _rerank(
        self, query: str, results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        query_terms = set(query_lower.split())

        for r in results:
            content_lower = r["chunk"]["content"].lower()
            term_overlap = sum(
                1 for t in query_terms if t in content_lower
            )
            has_isd = r["chunk"].get("has_isd", False)
            isd_boost = 0.15 if has_isd else 0
            overlap_boost = 0.05 * term_overlap
            r["score"] += isd_boost + overlap_boost

        results.sort(key=lambda x: x["score"], reverse=True)
        return results

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        a_arr = np.array(a, dtype=np.float32)
        b_arr = np.array(b, dtype=np.float32)
        norm_a = np.linalg.norm(a_arr)
        norm_b = np.linalg.norm(b_arr)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a_arr, b_arr) / (norm_a * norm_b))
