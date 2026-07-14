"""Motor de tracing distribuido — construcción de árboles de spans y búsqueda."""

import enum
import uuid
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel


class SpanStatus(str, enum.Enum):
    OK = "OK"
    ERROR = "ERROR"
    TIMEOUT = "TIMEOUT"


class Span(BaseModel):
    span_id: str
    trace_id: str
    parent_span_id: Optional[str] = None
    service: str
    operation: str
    start_time: str
    end_time: Optional[str] = None
    duration_ms: Optional[float] = None
    status: SpanStatus = SpanStatus.OK
    tags: dict = {}
    events: list[dict] = []


class Trace(BaseModel):
    trace_id: str
    root_service: str
    root_operation: str
    spans: list[Span]
    total_duration_ms: float
    status: SpanStatus
    started_at: str


NOW = datetime.utcnow()


def _ts(hours_ago: int = 0, minutes_ago: int = 0, seconds_ago: int = 0) -> str:
    dt = NOW - timedelta(hours=hours_ago, minutes=minutes_ago, seconds=seconds_ago)
    return dt.isoformat()


def _span(trace_id: str, span_id: str, parent: Optional[str], service: str, operation: str,
          start_offset_m: int, start_offset_s: int, duration_ms: float,
          status: SpanStatus = SpanStatus.OK, tags: dict = None, events: list[dict] = None) -> dict:
    start = _ts(0, start_offset_m, start_offset_s)
    end = _ts(0, start_offset_m, start_offset_s + int(duration_ms / 1000))
    return {
        "span_id": span_id, "trace_id": trace_id, "parent_span_id": parent,
        "service": service, "operation": operation, "start_time": start, "end_time": end,
        "duration_ms": duration_ms, "status": status.value,
        "tags": tags or {}, "events": events or [],
    }


SAMPLE_TRACES: list[list[dict]] = [
    # Trace 1: tax-engine IVA calculation (1 span, 45ms)
    [_span("trace-001", "span-001-1", None, "tax-engine", "POST /api/v1/tax/iva/calculate",
           5, 12, 45.0, SpanStatus.OK,
           {"http.status_code": 200, "period": "06-2026"})],
    # Trace 2: command-center -> tax-engine Form 104 (2 spans, 120ms)
    [_span("trace-002", "span-002-1", None, "command-center", "POST /api/v1/tax/iva/form104",
           10, 0, 120.0, SpanStatus.OK,
           {"http.status_code": 200, "user_id": "maria.lopez@consultoria.ec"}),
     _span("trace-002", "span-002-2", "span-002-1", "tax-engine", "POST /api/v1/tax/iva/form104",
           10, 0, 105.0, SpanStatus.OK,
           {"http.status_code": 200})],
    # Trace 3: command-center -> clients -> documents contract generation (3 spans, 340ms)
    [_span("trace-003", "span-003-1", None, "command-center", "POST /api/v1/documents/generate/contract",
           15, 45, 340.0, SpanStatus.OK,
           {"http.status_code": 201, "contract_id": "Contrato-2026-00142"}),
     _span("trace-003", "span-003-2", "span-003-1", "clients", "GET /api/v1/clients/1042",
           15, 45, 45.0, SpanStatus.OK,
           {"http.status_code": 200}),
     _span("trace-003", "span-003-3", "span-003-1", "documents", "POST /api/v1/documents/generate",
           15, 46, 280.0, SpanStatus.OK,
           {"http.status_code": 201, "template": "Contrato-Servicio-Profesional"})],
    # Trace 4: public-api -> tax-engine -> SRI SOAP (3 spans, 2500ms - external timeout)
    [_span("trace-004", "span-004-1", None, "public-api", "POST /api/v1/tax/anexos/sri/submit",
           7, 30, 2500.0, SpanStatus.ERROR,
           {"http.status_code": 502, "error": "SRI timeout"}),
     _span("trace-004", "span-004-2", "span-004-1", "tax-engine", "POST /api/v1/tax/anexos/sri/submit",
           7, 30, 2480.0, SpanStatus.TIMEOUT,
           {"sri.endpoint": "https://sri.gob.ec/soap/recepcion", "timeout_ms": 5000}),
     _span("trace-004", "span-004-3", "span-004-2", "tax-engine", "SOAP call: SRI.recepcion",
           7, 30, 2450.0, SpanStatus.TIMEOUT,
           {"soap.action": "recepcionComprobante", "retry_count": 2})],
    # Trace 5: ai-orchestrator -> macro-service nowcast (2 spans, 180ms)
    [_span("trace-005", "span-005-1", None, "ai-orchestrator", "POST /api/v1/ai/nowcast",
           25, 33, 180.0, SpanStatus.OK,
           {"period": "2026-Q2", "model": "gdp-forecast-v3"}),
     _span("trace-005", "span-005-2", "span-005-1", "macro-service", "POST /api/v1/macro/scenarios/run",
           25, 33, 165.0, SpanStatus.OK,
           {"scenario": "base_case", "iterations": 380})],
    # Trace 6: command-center -> finance -> clients DCF valuation (3 spans, 450ms)
    [_span("trace-006", "span-006-1", None, "command-center", "POST /api/v1/finance/valuation/dcf",
           30, 0, 450.0, SpanStatus.OK,
           {"client_id": "1042", "valuation_type": "dcf"}),
     _span("trace-006", "span-006-2", "span-006-1", "finance", "POST /api/v1/finance/valuation/dcf",
           30, 0, 410.0, SpanStatus.OK,
           {"projection_years": 5, "discount_rate": 0.12}),
     _span("trace-006", "span-006-3", "span-006-2", "clients", "GET /api/v1/clients/1042/financials",
           30, 0, 85.0, SpanStatus.OK,
           {"http.status_code": 200})],
    # Trace 7: command-center -> documents OCR (2 spans, 890ms)
    [_span("trace-007", "span-007-1", None, "command-center", "POST /api/v1/documents/ocr",
           35, 0, 890.0, SpanStatus.OK,
           {"document_id": "doc-005", "pages": 12}),
     _span("trace-007", "span-007-2", "span-007-1", "documents", "POST /api/v1/documents/ocr/process",
           35, 0, 875.0, SpanStatus.OK,
           {"confidence": 0.94, "language": "es"})],
    # Trace 8: public-api -> clients -> create client -> audit log (3 spans, 95ms)
    [_span("trace-008", "span-008-1", None, "public-api", "POST /api/v1/clients",
           40, 0, 95.0, SpanStatus.OK,
           {"http.status_code": 201, "client_name": "TechSolutions EC"}),
     _span("trace-008", "span-008-2", "span-008-1", "clients", "POST /api/v1/clients",
           40, 0, 70.0, SpanStatus.OK,
           {"ruc": "1799999999001"}),
     _span("trace-008", "span-008-3", "span-008-1", "security", "POST /api/v1/security/audit",
           40, 0, 18.0, SpanStatus.OK,
           {"audit_action": "CREATE", "resource": "client"})],
    # Trace 9: command-center -> all services health check (12 spans, 200ms)
    [_span("trace-009", "span-009-1", None, "command-center", "GET /api/v1/dashboard/health",
           45, 0, 200.0, SpanStatus.OK,
           {"user_id": "maria.lopez@consultoria.ec"}),
     _span("trace-009", "span-009-2", "span-009-1", "tax-engine", "GET /health",
           45, 0, 15.0, SpanStatus.OK),
     _span("trace-009", "span-009-3", "span-009-1", "macro-service", "GET /health",
           45, 0, 22.0, SpanStatus.OK),
     _span("trace-009", "span-009-4", "span-009-1", "finance", "GET /health",
           45, 0, 18.0, SpanStatus.OK),
     _span("trace-009", "span-009-5", "span-009-1", "clients", "GET /health",
           45, 0, 12.0, SpanStatus.OK),
     _span("trace-009", "span-009-6", "span-009-1", "documents", "GET /health",
           45, 0, 25.0, SpanStatus.OK),
     _span("trace-009", "span-009-7", "span-009-1", "security", "GET /health",
           45, 0, 8.0, SpanStatus.OK),
     _span("trace-009", "span-009-8", "span-009-1", "public-api", "GET /health",
           45, 0, 30.0, SpanStatus.OK),
     _span("trace-009", "span-009-9", "span-009-1", "ai-orchestrator", "GET /health",
           45, 0, 35.0, SpanStatus.OK),
     _span("trace-009", "span-009-10", "span-009-1", "command-center", "GET /health",
           45, 0, 10.0, SpanStatus.OK),
     _span("trace-009", "span-009-11", "span-009-1", "bi", "GET /health",
           45, 0, 12.0, SpanStatus.OK),
     _span("trace-009", "span-009-12", "span-009-1", "analytics-advanced", "GET /health",
           45, 0, 14.0, SpanStatus.OK)],
    # Trace 10: analytics-advanced -> finance -> clients portfolio analysis (3 spans, 680ms)
    [_span("trace-010", "span-010-1", None, "analytics-advanced", "POST /api/v1/analytics/portfolio",
           50, 0, 680.0, SpanStatus.OK,
           {"portfolio_id": "port-2026-01", "client_id": "1042"}),
     _span("trace-010", "span-010-2", "span-010-1", "finance", "GET /api/v1/finance/portfolio/1042",
           50, 0, 350.0, SpanStatus.OK,
           {"securities_count": 12}),
     _span("trace-010", "span-010-3", "span-010-2", "clients", "GET /api/v1/clients/1042/profile",
           50, 0, 45.0, SpanStatus.OK,
           {"risk_profile": "moderate"})],
    # Trace 11: ai-orchestrator -> documents legal analysis (2 spans, 310ms)
    [_span("trace-011", "span-011-1", None, "ai-orchestrator", "POST /api/v1/ai/legal/analyze",
           55, 0, 310.0, SpanStatus.OK,
           {"document_type": "contract", "model": "legal-bert-v2"}),
     _span("trace-011", "span-011-2", "span-011-1", "documents", "GET /api/v1/documents/104-2026",
           55, 0, 42.0, SpanStatus.OK,
           {"http.status_code": 200})],
    # Trace 12: public-api webhook delivery (1 span, 150ms)
    [_span("trace-012", "span-012-1", None, "public-api", "POST /api/v1/webhooks/deliver",
           60, 0, 150.0, SpanStatus.OK,
           {"webhook_id": "wh-001", "target": "https://hooks.example.com/callback", "retry": 0})],
    # Trace 13: tax-engine batch ATS generation (1 span, 4500ms)
    [_span("trace-013", "span-013-1", None, "tax-engine", "POST /api/v1/tax/anexos/ats/generate-batch",
           65, 0, 4500.0, SpanStatus.ERROR,
           {"http.status_code": 500, "batch_size": 150, "period": "06-2026",
            "error": "XML schema validation error at line 42"}),
     ],
    # Trace 14: command-center -> bi -> analytics-advanced BI report (3 spans, 890ms)
    [_span("trace-014", "span-014-1", None, "command-center", "POST /api/v1/bi/reports/generate",
           70, 0, 890.0, SpanStatus.OK,
           {"report_type": "quarterly", "period": "2026-Q2"}),
     _span("trace-014", "span-014-2", "span-014-1", "bi", "POST /api/v1/bi/reports/build",
           70, 0, 750.0, SpanStatus.OK,
           {"template": "quarterly-financial-v2"}),
     _span("trace-014", "span-014-3", "span-014-2", "analytics-advanced", "POST /api/v1/analytics/aggregate",
           70, 0, 400.0, SpanStatus.OK,
           {"metrics": ["revenue", "expenses", "profit_margin", "tax_liability"]})],
    # Trace 15: security authentication check (1 span, 25ms) — cross-service
    [_span("trace-015", "span-015-1", None, "security", "POST /api/v1/security/auth/validate",
           75, 0, 25.0, SpanStatus.OK,
           {"http.status_code": 200, "auth_method": "jwt", "user_id": "ana.torres@consultoria.ec"}),
     _span("trace-015", "span-015-2", "span-015-1", "command-center", "GET /api/v1/users/profile",
           75, 0, 12.0, SpanStatus.OK,
           {"http.status_code": 200}),
     _span("trace-015", "span-015-3", "span-015-1", "clients", "GET /api/v1/clients?user=ana.torres",
           75, 0, 8.0, SpanStatus.OK,
           {"http.status_code": 200})],
]


class TracingEngine:
    """Motor de tracing distribuido — almacena spans y reconstruye traces completos."""

    def __init__(self):
        self._spans: dict[str, Span] = {}
        self._populate_samples()

    def _populate_samples(self):
        for trace_spans in SAMPLE_TRACES:
            for span_data in trace_spans:
                span = Span(
                    span_id=span_data["span_id"],
                    trace_id=span_data["trace_id"],
                    parent_span_id=span_data.get("parent_span_id"),
                    service=span_data["service"],
                    operation=span_data["operation"],
                    start_time=span_data["start_time"],
                    end_time=span_data["end_time"],
                    duration_ms=span_data.get("duration_ms"),
                    status=SpanStatus(span_data["status"]),
                    tags=span_data.get("tags", {}),
                    events=span_data.get("events", []),
                )
                self._spans[span.span_id] = span

    def ingest_span(self, span: Span) -> Span:
        if not span.span_id:
            span.span_id = str(uuid.uuid4())
        if not span.trace_id:
            span.trace_id = str(uuid.uuid4())
        self._spans[span.span_id] = span
        return span

    def get_trace(self, trace_id: str) -> Optional[Trace]:
        spans = [s for s in self._spans.values() if s.trace_id == trace_id]
        if not spans:
            return None

        spans.sort(key=lambda s: s.start_time)
        root = spans[0]
        for s in spans:
            if s.parent_span_id is None:
                root = s
                break

        started_at = root.start_time
        total_duration = max((s.duration_ms or 0) for s in spans)
        overall_status = SpanStatus.OK
        for s in spans:
            if s.status == SpanStatus.ERROR:
                overall_status = SpanStatus.ERROR
                break
            if s.status == SpanStatus.TIMEOUT and overall_status != SpanStatus.ERROR:
                overall_status = SpanStatus.TIMEOUT

        return Trace(
            trace_id=trace_id,
            root_service=root.service,
            root_operation=root.operation,
            spans=spans,
            total_duration_ms=total_duration,
            status=overall_status,
            started_at=started_at,
        )

    def list_traces(
        self,
        service: Optional[str] = None,
        status: Optional[str] = None,
        min_duration: Optional[float] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Trace], int]:
        trace_ids = list(dict.fromkeys(s.trace_id for s in self._spans.values()))
        traces: list[Trace] = []
        for tid in trace_ids:
            t = self.get_trace(tid)
            if t:
                traces.append(t)

        if service:
            traces = [t for t in traces if t.root_service == service]
        if status:
            traces = [t for t in traces if t.status.value == status.upper()]
        if min_duration is not None:
            traces = [t for t in traces if t.total_duration_ms >= min_duration]
        if start:
            traces = [t for t in traces if t.started_at >= start]
        if end:
            traces = [t for t in traces if t.started_at <= end]

        traces.sort(key=lambda t: t.started_at, reverse=True)
        total = len(traces)
        offset = (page - 1) * limit
        return traces[offset: offset + limit], total

    def search_traces(self, tag_key: str, tag_value: str) -> list[Trace]:
        matching_trace_ids = set()
        for span in self._spans.values():
            if tag_key in span.tags and str(span.tags.get(tag_key, "")).lower() == tag_value.lower():
                matching_trace_ids.add(span.trace_id)

        traces = []
        for tid in matching_trace_ids:
            t = self.get_trace(tid)
            if t:
                traces.append(t)
        traces.sort(key=lambda t: t.started_at, reverse=True)
        return traces
