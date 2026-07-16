import re
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

ISD_KEYWORDS = [
    "resolución", "acuerdo", "circular", "ley orgánica", "decreto",
    "reglamento", "norma", "disposición", "artículo", "capítulo",
    "título", "libro", "código", "lrti", "rlrti", "sri",
    "servicio de rentas internas", "régimen tributario",
    "ley de régimen tributario interno",
]

LAW_TYPE_PATTERNS = {
    "LRTI": [r"ley\s+de\s+r[eé]gimen\s+tributario\s+interno", r"l\.?r\.?t\.?i\.?"],
    "RLRTI": [r"reglamento\s+(?:a\s+la\s+)?l\.?r\.?t\.?i\.?", r"r\.?l\.?r\.?t\.?i\.?"],
    "CÓDIGO TRIBUTARIO": [r"c[oó]digo\s+tributario", r"c\.?t\.?"],
    "RESOLUCIÓN": [r"resoluci[oó]n\s+(?:n[aú]?mero\s+)?\w+-\d+"],
}


class PDFExtractor:
    def extract(self, file_content: bytes, filename: str) -> Tuple[str, dict]:
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

        if ext == "pdf":
            return self._extract_pdf(file_content, filename)
        elif ext in ("txt", "md"):
            return self._extract_text(file_content, filename)
        else:
            return self._extract_text(file_content, filename)

    def _extract_pdf(self, file_content: bytes, filename: str) -> Tuple[str, dict]:
        try:
            import fitz
        except ImportError:
            logger.warning("PyMuPDF not available, falling back to text extract")
            return self._extract_text(file_content, filename)

        doc = fitz.open(stream=file_content, filetype="pdf")
        text_parts = []
        metadata = {}
        full_text = ""

        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            text_parts.append(page_text)
            full_text += page_text + "\n"

        doc_meta = doc.metadata
        metadata = {
            "title": doc_meta.get("title", ""),
            "author": doc_meta.get("author", ""),
            "subject": doc_meta.get("subject", ""),
            "page_count": len(doc),
        }

        doc.close()
        full_text = full_text.strip()

        isd_metadata = self._extract_isd_metadata(full_text)
        metadata.update(isd_metadata)

        return full_text, metadata

    def _extract_text(self, file_content: bytes, filename: str) -> Tuple[str, dict]:
        text = file_content.decode("utf-8", errors="replace")
        isd_metadata = self._extract_isd_metadata(text)
        return text, isd_metadata

    def _extract_isd_metadata(self, text: str) -> dict:
        text_lower = text.lower()
        found_keywords = [kw for kw in ISD_KEYWORDS if kw in text_lower]
        has_isd = len(found_keywords) >= 2

        law_type = None
        law_number = None
        article = None
        year = None

        for ltype, patterns in LAW_TYPE_PATTERNS.items():
            for pattern in patterns:
                match = re.search(pattern, text_lower, re.IGNORECASE)
                if match:
                    law_type = ltype
                    break
            if law_type:
                break

        article_match = re.search(
            r"(?:art[íi]culo|art\.?)\s+(\d+[a-z]?(?:-\d+)?)",
            text, re.IGNORECASE,
        )
        if article_match:
            article = article_match.group(1)

        year_match = re.search(r"\b(19\d{2}|20\d{2})\b", text)
        if year_match:
            year = int(year_match.group(1))

        return {
            "has_isd": has_isd,
            "isd_keywords": found_keywords,
            "law_type": law_type,
            "law_number": law_number,
            "article": article,
            "year": year,
            "isd_confidence": min(len(found_keywords) / 5.0, 1.0),
        }
