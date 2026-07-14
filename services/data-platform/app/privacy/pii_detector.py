"""74: PII Detection + Redaction con Microsoft Presidio + LATAM custom recognizers."""
from __future__ import annotations
import re
import hashlib
from typing import Optional
import logging

try:
    from presidio_analyzer import AnalyzerEngine, RecognizerRegistry, Pattern, PatternRecognizer
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig
    PRESIDIO_AVAILABLE = True
except ImportError:
    PRESIDIO_AVAILABLE = False

from app.shared.schemas import PIIEntity, PIIDetectionResult, RedactionPolicy

logger = logging.getLogger(__name__)


class PIIDetector:
    def __init__(self, languages: list[str] = None):
        self.languages = languages or ["es", "en"]
        if not PRESIDIO_AVAILABLE:
            logger.warning("Presidio not installed, using fallback regex detector")
            self.analyzer = None
            self.anonymizer = None
            return
        registry = RecognizerRegistry()
        registry.load_predefined_recognizers()
        registry.add_recognizer(self._ruc_ecuador_recognizer())
        registry.add_recognizer(self._nit_colombia_recognizer())
        registry.add_recognizer(self._rfc_mexico_recognizer())
        registry.add_recognizer(self._cedula_ecuador_recognizer())
        registry.add_recognizer(self._latam_phone_recognizer())
        self.analyzer = AnalyzerEngine(registry=registry, supported_languages=self.languages)
        self.anonymizer = AnonymizerEngine()

    def _ruc_ecuador_recognizer(self) -> PatternRecognizer:
        return PatternRecognizer(supported_entity="EC_RUC", supported_language="es", patterns=[Pattern(name="ruc_ec", regex=r"\b(\d{10}001|\d{13})\b", score=0.7)], context=["ruc", "nit", "identificación fiscal"])

    def _nit_colombia_recognizer(self) -> PatternRecognizer:
        return PatternRecognizer(supported_entity="CO_NIT", supported_language="es", patterns=[Pattern(name="nit_co", regex=r"\b\d{9,11}\b", score=0.5)], context=["nit", "identificación tributaria"])

    def _rfc_mexico_recognizer(self) -> PatternRecognizer:
        return PatternRecognizer(supported_entity="MX_RFC", supported_language="es", patterns=[Pattern(name="rfc_mx", regex=r"\b[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}\b", score=0.85)], context=["rfc", "registro federal"])

    def _cedula_ecuador_recognizer(self) -> PatternRecognizer:
        return PatternRecognizer(supported_entity="EC_CEDULA", supported_language="es", patterns=[Pattern(name="cedula_ec", regex=r"\b\d{10}\b", score=0.6)], context=["cédula", "cedula", "identidad"])

    def _latam_phone_recognizer(self) -> PatternRecognizer:
        return PatternRecognizer(supported_entity="PHONE_NUMBER", supported_language="es", patterns=[Pattern(name="latam_phone", regex=r"(?:\+?(?:593|57|52|51|56|54|55))?\s*\(?\d{2,3}\)?\s*\d{3,4}[\s-]?\d{4}\b", score=0.6)], context=["tel", "teléfono", "celular", "móvil"])

    def detect(self, text: str, language: str = "es", score_threshold: float = 0.5) -> PIIDetectionResult:
        if self.analyzer is None:
            return self._fallback_detect(text)
        results = self.analyzer.analyze(text=text, language=language, score_threshold=score_threshold)
        entities = []
        by_type = {}
        high_conf = 0
        for r in results:
            entities.append(PIIEntity(entity_type=r.entity_type, start=r.start, end=r.end, text=text[r.start:r.end], score=r.score, country=self._infer_country(r.entity_type)))
            by_type[r.entity_type] = by_type.get(r.entity_type, 0) + 1
            if r.score >= 0.8:
                high_conf += 1
        return PIIDetectionResult(entities=entities, total_count=len(entities), high_confidence_count=high_conf, by_type=by_type)

    def redact(self, text: str, policy: RedactionPolicy, language: str = "es") -> str:
        if self.analyzer is None:
            return self._fallback_redact(text, policy)
        results = self.analyzer.analyze(text=text, language=language, entities=policy.entity_types, score_threshold=0.5)
        operators = {}
        for et in policy.entity_types:
            if policy.strategy == "mask":
                operators[et] = OperatorConfig("mask", {"chars_to_mask": 100, "masking_char": policy.mask_char, "from_end": False})
            elif policy.strategy == "hash":
                operators[et] = OperatorConfig("custom", {"lambda": lambda x: hashlib.sha256(x.encode()).hexdigest()[:12]})
            elif policy.strategy == "replace":
                operators[et] = OperatorConfig("replace", {"new_value": f"<{et}>"})
            elif policy.strategy == "redact":
                operators[et] = OperatorConfig("replace", {"new_value": policy.replacement})
            elif policy.strategy == "pseudonymize":
                operators[et] = OperatorConfig("custom", {"lambda": lambda x, et=et: f"{et}_{hashlib.md5(x.encode()).hexdigest()[:8]}"})
        return self.anonymizer.anonymize(text=text, analyzer_results=results, operators=operators).text

    def scan_dataframe(self, df, text_columns: Optional[list[str]] = None, language: str = "es") -> dict:
        import pandas as pd
        if text_columns is None:
            text_columns = [c for c in df.columns if df[c].dtype == "object"]
        report = {"columns_scanned": text_columns, "total_rows": len(df), "columns_with_pii": [], "total_pii_found": 0, "details": {}}
        for col in text_columns:
            col_pii_count = 0
            sample_entities = []
            sample_size = min(100, len(df))
            sample = df[col].dropna().sample(n=sample_size, random_state=42) if len(df) > 0 else pd.Series()
            for value in sample:
                if not isinstance(value, str) or len(value) < 5:
                    continue
                result = self.detect(value, language=language)
                col_pii_count += result.total_count
                sample_entities.extend(result.entities[:5])
            if col_pii_count > 0:
                report["columns_with_pii"].append(col)
                report["total_pii_found"] += col_pii_count
                report["details"][col] = {"estimated_count": int(col_pii_count * len(df) / max(sample_size, 1)), "sample_entities": [e.model_dump() for e in sample_entities[:10]]}
        return report

    def _fallback_detect(self, text: str) -> PIIDetectionResult:
        entities = []
        patterns = {"EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "PHONE": r"\b\+?\d{1,3}[\s-]?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{4}\b", "CREDIT_CARD": r"\b(?:\d[ -]*?){13,16}\b", "EC_RUC": r"\b\d{13}\b", "MX_RFC": r"\b[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}\b"}
        for entity_type, pattern in patterns.items():
            for match in re.finditer(pattern, text):
                entities.append(PIIEntity(entity_type=entity_type, start=match.start(), end=match.end(), text=match.group(), score=0.7))
        by_type = {}
        for e in entities:
            by_type[e.entity_type] = by_type.get(e.entity_type, 0) + 1
        return PIIDetectionResult(entities=entities, total_count=len(entities), high_confidence_count=len(entities), by_type=by_type)

    def _fallback_redact(self, text: str, policy: RedactionPolicy) -> str:
        result = self._fallback_detect(text)
        for entity in sorted(result.entities, key=lambda e: e.start, reverse=True):
            if entity.entity_type in policy.entity_types:
                replacement = policy.mask_char * len(entity.text)
                text = text[:entity.start] + replacement + text[entity.end:]
        return text

    def _infer_country(self, entity_type: str) -> Optional[str]:
        if entity_type.startswith("EC_"): return "EC"
        if entity_type.startswith("CO_"): return "CO"
        if entity_type.startswith("MX_"): return "MX"
        return None
