import pytest
from app.chunking.semantic_chunker import SemanticChunker


def test_chunk_basic_text():
    chunker = SemanticChunker(max_tokens=100, overlap_tokens=10)
    text = "This is a test. " * 50
    chunks = chunker.chunk(text)
    assert len(chunks) > 0
    assert all("content" in c for c in chunks)
    assert all("index" in c for c in chunks)


def test_chunk_with_metadata(sample_tax_text, sample_metadata):
    chunker = SemanticChunker(max_tokens=200, overlap_tokens=20)
    chunks = chunker.chunk(sample_tax_text, sample_metadata)
    assert len(chunks) > 0
    for chunk in chunks:
        assert "metadata" in chunk
        assert chunk["metadata"]["law_type"] == "LRTI"


def test_chunk_isd_enrichment(sample_tax_text, sample_metadata):
    chunker = SemanticChunker(max_tokens=500, overlap_tokens=30)
    chunks = chunker.chunk(sample_tax_text, sample_metadata)
    isd_chunks = [c for c in chunks if c.get("has_isd")]
    assert len(isd_chunks) > 0
    for c in isd_chunks:
        assert "isd" in c
        assert "matched_keywords" in c["isd"]


def test_chunk_tokens_count():
    chunker = SemanticChunker(max_tokens=50, overlap_tokens=5)
    text = "word " * 100
    chunks = chunker.chunk(text)
    for chunk in chunks:
        assert chunk["tokens"] > 0


def test_chunk_large_section():
    chunker = SemanticChunker(max_tokens=50, overlap_tokens=5)
    large_text = "Sentence one. " * 30 + "Sentence two. " * 30
    chunks = chunker.chunk(large_text)
    assert len(chunks) >= 2
