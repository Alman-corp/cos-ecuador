import logging
from typing import Optional

from app.config import settings
from app.extractors.pdf_extractor import PDFExtractor
from app.chunking.semantic_chunker import SemanticChunker
from app.embeddings.service import EmbeddingService

logger = logging.getLogger(__name__)


class DocumentPipeline:
    def __init__(self):
        self.extractor = PDFExtractor()
        self.chunker = SemanticChunker(
            max_tokens=settings.chunk_max_tokens,
            overlap_tokens=settings.chunk_overlap_tokens,
        )
        self.embedder = EmbeddingService()

    async def process_document(
        self,
        file_content: bytes,
        filename: str,
        company_id: str,
        document_id: str,
        metadata: Optional[dict] = None,
    ) -> dict:
        logger.info(f"Processing document {filename} for company {company_id}")

        text, extra_meta = self.extractor.extract(file_content, filename)
        metadata = {**(metadata or {}), **extra_meta}

        chunks = self.chunker.chunk(text, metadata)

        chunk_texts = [c["content"] for c in chunks]
        embeddings = await self.embedder.embed_batch(chunk_texts)

        for chunk, embedding in zip(chunks, embeddings):
            chunk["embedding"] = embedding
            chunk["document_id"] = document_id
            chunk["company_id"] = company_id
            chunk["tokens"] = len(chunk["content"].split())

        logger.info(
            f"Document {filename}: {len(chunks)} chunks, "
            f"{len(embeddings)} embeddings generated"
        )

        return {
            "document_id": document_id,
            "filename": filename,
            "chunks": chunks,
            "metadata": metadata,
            "chunk_count": len(chunks),
        }
