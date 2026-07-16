import pytest
from app.extractors.pdf_extractor import PDFExtractor


def test_extract_text_from_string():
    extractor = PDFExtractor()
    content = b"Test plain text content"
    text, meta = extractor.extract(content, "test.txt")
    assert text == "Test plain text content"
    assert isinstance(meta, dict)


def test_extract_isd_keywords(sample_tax_text):
    extractor = PDFExtractor()
    content = sample_tax_text.encode("utf-8")
    text, meta = extractor.extract(content, "test.txt")
    assert meta["has_isd"] is True
    assert "ley de régimen tributario interno" in meta.get("isd_keywords", [])
    assert meta["law_type"] == "LRTI"


def test_extract_article_number(sample_tax_text):
    extractor = PDFExtractor()
    content = sample_tax_text.encode("utf-8")
    _, meta = extractor.extract(content, "test.txt")
    assert meta["article"] is not None


def test_extract_year(sample_tax_text):
    extractor = PDFExtractor()
    content = sample_tax_text.encode("utf-8")
    _, meta = extractor.extract(content, "test.txt")
    assert meta["year"] is not None


def test_extract_unknown_format():
    extractor = PDFExtractor()
    content = b"some content"
    text, meta = extractor.extract(content, "test.unknown")
    assert text == "some content"
