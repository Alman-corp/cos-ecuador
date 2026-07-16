import re
import tiktoken
from typing import List, Optional

encoder = tiktoken.get_encoding("cl100k_base")


class SemanticChunker:
    def __init__(
        self,
        max_tokens: int = 512,
        overlap_tokens: int = 64,
    ):
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens
        self.separators = [
            "\n## ",
            "\n### ",
            "\n---\n",
            "\n\n",
            "\n",
            ". ",
            ", ",
            " ",
        ]

    def chunk(self, text: str, metadata: Optional[dict] = None) -> List[dict]:
        chunks = []
        sections = self._split_by_headings(text)

        buffer = ""
        buffer_tokens = 0
        overlap_buffer = ""

        for section in sections:
            section_tokens = len(encoder.encode(section))

            if buffer_tokens + section_tokens <= self.max_tokens:
                buffer += section
                buffer_tokens += section_tokens
            else:
                if buffer:
                    chunks.append(self._make_chunk(buffer, len(chunks), metadata))
                    overlap_buffer = self._get_overlap(buffer)

                if section_tokens > self.max_tokens:
                    sub_chunks = self._split_large_section(section, metadata)
                    chunks.extend(sub_chunks)
                    buffer = ""
                    buffer_tokens = 0
                else:
                    buffer = overlap_buffer + section
                    buffer_tokens = len(encoder.encode(buffer))

        if buffer:
            chunks.append(self._make_chunk(buffer, len(chunks), metadata))

        return self._enrich_with_isd(chunks, metadata)

    def _split_by_headings(self, text: str) -> List[str]:
        parts = re.split(r"(?=\n## \d)", text)
        parts = [p.strip() for p in parts if p.strip()]
        return parts if parts else [text]

    def _split_large_section(
        self, section: str, metadata: Optional[dict] = None
    ) -> List[dict]:
        chunks = []
        sentences = re.split(r"(?<=[.!?])\s+", section)
        buffer = ""
        buffer_tokens = 0
        overlap_buffer = ""

        for sentence in sentences:
            sent_tokens = len(encoder.encode(sentence))
            if buffer_tokens + sent_tokens <= self.max_tokens:
                buffer += " " + sentence if buffer else sentence
                buffer_tokens += sent_tokens
            else:
                if buffer:
                    chunks.append(self._make_chunk(buffer, len(chunks), metadata))
                    overlap_buffer = self._get_overlap(buffer)
                buffer = overlap_buffer + sentence
                buffer_tokens = len(encoder.encode(buffer))

        if buffer:
            chunks.append(self._make_chunk(buffer, len(chunks), metadata))

        return chunks

    def _make_chunk(
        self, content: str, index: int, metadata: Optional[dict] = None
    ) -> dict:
        return {
            "content": content.strip(),
            "index": index,
            "metadata": metadata or {},
            "tokens": len(encoder.encode(content)),
        }

    def _get_overlap(self, text: str) -> str:
        words = text.split()
        overlap_words = words[-self.overlap_tokens:] if len(words) > self.overlap_tokens else words
        return " ".join(overlap_words) + "\n"

    def _enrich_with_isd(
        self, chunks: List[dict], metadata: Optional[dict] = None
    ) -> List[dict]:
        if not metadata:
            return chunks

        law_type = metadata.get("law_type")
        article = metadata.get("article")
        isd_keywords = metadata.get("isd_keywords", [])

        for chunk in chunks:
            chunk_lower = chunk["content"].lower()
            matched_keywords = [kw for kw in isd_keywords if kw in chunk_lower]
            chunk_article = None

            art_match = re.search(
                r"(?:art[íi]culo|art\.?)\s+(\d+[a-z]?(?:-\d+)?)",
                chunk["content"], re.IGNORECASE,
            )
            if art_match:
                chunk_article = art_match.group(1)

            chunk["has_isd"] = len(matched_keywords) >= 1
            chunk["isd"] = {
                "matched_keywords": matched_keywords,
                "keyword_count": len(matched_keywords),
                "law_type": law_type,
                "article": chunk_article or article,
            }
            chunk["law_type"] = law_type
            chunk["article"] = chunk_article or article

        return chunks
