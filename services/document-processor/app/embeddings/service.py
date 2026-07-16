import logging
from typing import List, Optional

import numpy as np
from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_embedding_model
        self.dimensions = settings.embedding_dimensions

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        try:
            response = await self.client.embeddings.create(
                model=self.model,
                input=texts,
                dimensions=self.dimensions,
            )
            embeddings = [item.embedding for item in response.data]
            logger.debug(f"Generated {len(embeddings)} embeddings [{self.model}]")
            return embeddings
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            raise

    async def embed_query(self, query: str) -> List[float]:
        embeddings = await self.embed_batch([query])
        return embeddings[0] if embeddings else []

    async def embed_batch_with_fallback(
        self, texts: List[str], batch_size: int = 20
    ) -> List[List[float]]:
        all_embeddings = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            batch_embeddings = await self.embed_batch(batch)
            all_embeddings.extend(batch_embeddings)
        return all_embeddings
