"""Motor de logs estructurados — almacenamiento en memoria, filtrado y estadísticas."""

import enum
import uuid
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel


class LogLevel(str, enum.Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class LogEntry(BaseModel):
    id: str
    timestamp: str
    service: str
    level: LogLevel
    message: str
    logger: str = ""
    module: str = ""
    function: str = ""
    line: int = 0
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    user_id: Optional[str] = None
    correlation_id: Optional[str] = None
    extra: dict = {}


class LogStats(BaseModel):
    total: int
    by_level: dict[str, int]
    by_service: dict[str, int]
    last_24h: int
    errors_last_hour: int
    top_errors: list[dict]


NOW = datetime.utcnow()


def _ts(hours_ago: int = 0, minutes_ago: int = 0, seconds_ago: int = 0) -> str:
    dt = NOW - timedelta(hours=hours_ago, minutes=minutes_ago, seconds=seconds_ago)
    return dt.isoformat()


SAMPLE_LOGS: list[dict] = [
    # --- INFO (25 entries) ---
    {"service": "tax-engine",    "level": "INFO",    "message": "Request received: POST /api/v1/tax/iva/calculate",                     "logger": "tax_engine.api",      "module": "api.iva",       "function": "calculate_iva",         "line": 24,  "timestamp": _ts(0, 5, 12)},
    {"service": "tax-engine",    "level": "INFO",    "message": "IVA calculation completed in 45ms",                                     "logger": "tax_engine.api",      "module": "api.iva",       "function": "calculate_iva",         "line": 28,  "timestamp": _ts(0, 5, 10)},
    {"service": "command-center","level": "INFO",    "message": "Dashboard refreshed successfully",                                       "logger": "cmd_center.ui",       "module": "ui.dashboard",  "function": "refresh",              "line": 102, "timestamp": _ts(0, 10, 0)},
    {"service": "clients",       "level": "INFO",    "message": "Client record retrieved: Corporación Eléctrica del Ecuador",              "logger": "clients.api",         "module": "api.clients",   "function": "get_client",            "line": 55,  "timestamp": _ts(0, 12, 30)},
    {"service": "documents",     "level": "INFO",    "message": "Document generated: Contrato-2026-00142",                                 "logger": "documents.generator", "module": "generator",     "function": "generate_contract",     "line": 88,  "timestamp": _ts(0, 15, 45)},
    {"service": "finance",       "level": "INFO",    "message": "Invoice 001-001-000000042 generated for TechSolutions EC",                "logger": "finance.invoicing",   "module": "invoices",      "function": "generate_invoice",      "line": 120, "timestamp": _ts(0, 18, 22)},
    {"service": "security",      "level": "INFO",    "message": "Authentication successful for user ana.torres@consultoria.ec",            "logger": "security.auth",       "module": "auth",          "function": "authenticate",          "line": 42,  "timestamp": _ts(0, 20, 5)},
    {"service": "public-api",    "level": "INFO",    "message": "Webhook delivered successfully to https://hooks.example.com/callback",    "logger": "public_api.webhooks", "module": "webhooks",      "function": "deliver",              "line": 67,  "timestamp": _ts(0, 22, 18)},
    {"service": "ai-orchestrator","level": "INFO",   "message": "Nowcast analysis completed for period 2026-Q2",                           "logger": "ai.orchestrator",     "module": "nowcast",       "function": "run_analysis",          "line": 155, "timestamp": _ts(0, 25, 33)},
    {"service": "macro-service", "level": "INFO",    "message": "Economic indicators updated: GDP growth 3.2%, inflation 2.1%",           "logger": "macro.api",           "module": "indicators",    "function": "update_indicators",     "line": 78,  "timestamp": _ts(0, 28, 0)},
    {"service": "tax-engine",    "level": "INFO",    "message": "Form 104 generated for period 06-2026",                                  "logger": "tax_engine.api",      "module": "api.iva",       "function": "generate_form104",      "line": 36,  "timestamp": _ts(0, 30, 15)},
    {"service": "command-center","level": "INFO",    "message": "User session created for Carlos Mendoza",                                 "logger": "cmd_center.session",  "module": "session",       "function": "create_session",        "line": 45,  "timestamp": _ts(0, 32, 40)},
    {"service": "clients",       "level": "INFO",    "message": "New client registered: TechSolutions EC",                                 "logger": "clients.api",         "module": "api.clients",   "function": "create_client",         "line": 33,  "timestamp": _ts(0, 35, 55)},
    {"service": "documents",     "level": "INFO",    "message": "Contract 104-2026 signed electronically",                                "logger": "documents.signing",   "module": "signing",       "function": "sign_contract",         "line": 210, "timestamp": _ts(0, 38, 10)},
    {"service": "finance",       "level": "INFO",    "message": "Payment received: $5,000 from Corp. Eléctrica",                           "logger": "finance.ledger",      "module": "payments",      "function": "record_payment",        "line": 92,  "timestamp": _ts(0, 40, 28)},
    {"service": "security",      "level": "INFO",    "message": "API key validated: integracion-001",                                      "logger": "security.api_keys",   "module": "apikeys",       "function": "validate_key",          "line": 31,  "timestamp": _ts(0, 42, 0)},
    {"service": "public-api",    "level": "INFO",    "message": "GET /api/v1/clients returned 15 records (45ms)",                          "logger": "public_api.gateway",  "module": "gateway",       "function": "proxy_request",         "line": 104, "timestamp": _ts(0, 45, 8)},
    {"service": "ai-orchestrator","level": "INFO",   "message": "AI model prediction completed for tax classification",                    "logger": "ai.orchestrator",     "module": "ml_tax",        "function": "predict",               "line": 175, "timestamp": _ts(0, 48, 20)},
    {"service": "macro-service", "level": "INFO",    "message": "Scenario simulation: base_case completed (380 iterations)",               "logger": "macro.simulation",    "module": "scenarios",     "function": "run_simulation",        "line": 201, "timestamp": _ts(0, 50, 5)},
    {"service": "tax-engine",    "level": "INFO",    "message": "ATS file generated for period 06-2026",                                   "logger": "tax_engine.ats",      "module": "api.anexos",    "function": "generate_ats",          "line": 74,  "timestamp": _ts(1, 2, 0)},
    {"service": "command-center","level": "INFO",    "message": "Notification sent to user: maria.lopez@consultoria.ec",                   "logger": "cmd_center.notify",   "module": "notifications", "function": "send_notification",     "line": 130, "timestamp": _ts(1, 5, 30)},
    {"service": "clients",       "level": "INFO",    "message": "Client data exported to Excel",                                          "logger": "clients.export",      "module": "export",        "function": "export_clients",        "line": 52,  "timestamp": _ts(1, 10, 0)},
    {"service": "documents",     "level": "INFO",    "message": "OCR processing completed for documento-005.pdf (12 pages)",               "logger": "documents.ocr",       "module": "ocr",           "function": "process_document",      "line": 145, "timestamp": _ts(1, 15, 45)},
    {"service": "finance",       "level": "INFO",    "message": "Balance sheet generated for Q2 2026",                                     "logger": "finance.reports",     "module": "reports",       "function": "generate_balance_sheet", "line": 65,  "timestamp": _ts(1, 20, 10)},
    {"service": "security",      "level": "INFO",    "message": "Audit log entry created for PERMISSION_CHANGE",                           "logger": "security.audit",      "module": "audit_log",     "function": "record_action",         "line": 89,  "timestamp": _ts(1, 25, 0)},
    # --- WARNING (10 entries) ---
    {"service": "tax-engine",    "level": "WARNING", "message": "High latency detected: ATS generation took 4500ms (threshold: 2000ms)",   "logger": "tax_engine.ats",      "module": "api.anexos",    "function": "generate_ats",          "line": 81,  "timestamp": _ts(0, 8, 0),   "extra": {"duration_ms": 4500, "threshold_ms": 2000}},
    {"service": "tax-engine",    "level": "WARNING", "message": "Rate limit approaching for API key integracion-001 (85/100 requests)",    "logger": "tax_engine.middleware","module": "middleware",    "function": "rate_limit",            "line": 45,  "timestamp": _ts(0, 14, 30), "extra": {"api_key": "integracion-001", "usage": 85, "limit": 100}},
    {"service": "command-center","level": "WARNING", "message": "Deprecated endpoint called: /api/v1/tax/calculate (use /api/v1/tax/iva/calculate)", "logger": "cmd_center.gateway","module": "gateway",  "function": "route_request",         "line": 55,  "timestamp": _ts(0, 22, 0),  "extra": {"deprecated": "/api/v1/tax/calculate", "replacement": "/api/v1/tax/iva/calculate"}},
    {"service": "clients",       "level": "WARNING", "message": "Database query slow: client search took 1200ms",                          "logger": "clients.db",          "module": "repository",    "function": "search_clients",        "line": 110, "timestamp": _ts(0, 33, 15), "extra": {"duration_ms": 1200, "threshold_ms": 500}},
    {"service": "finance",       "level": "WARNING", "message": "Invoice generation warning: PO number missing for client 1042",            "logger": "finance.invoicing",   "module": "invoices",      "function": "validate",              "line": 38,  "timestamp": _ts(0, 41, 22), "extra": {"client_id": "1042", "field": "po_number"}},
    {"service": "documents",     "level": "WARNING", "message": "OCR quality low for documento-012.pdf (confidence: 72%)",                 "logger": "documents.ocr",       "module": "ocr",           "function": "analyze_quality",       "line": 160, "timestamp": _ts(0, 52, 5),  "extra": {"document": "documento-012.pdf", "confidence": 0.72}},
    {"service": "public-api",    "level": "WARNING", "message": "Request rate increased 300% above baseline",                              "logger": "public_api.monitor",  "module": "monitoring",    "function": "check_traffic",         "line": 29,  "timestamp": _ts(1, 1, 0),   "extra": {"increase_pct": 300, "current_rpm": 450}},
    {"service": "ai-orchestrator","level": "WARNING","message": "Model accuracy below threshold for anomaly detection (0.82 < 0.90)",       "logger": "ai.monitor",          "module": "ml_tax",        "function": "evaluate_model",        "line": 190, "timestamp": _ts(1, 8, 30),  "extra": {"accuracy": 0.82, "threshold": 0.90}},
    {"service": "macro-service", "level": "WARNING", "message": "Data freshness warning: SRI indices last updated 48 hours ago",           "logger": "macro.data",          "module": "ingestion",     "function": "check_freshness",       "line": 44,  "timestamp": _ts(1, 16, 0),  "extra": {"hours_since_update": 48, "source": "SRI"}},
    {"service": "security",      "level": "WARNING", "message": "Failed login attempt for user pedro.gomez@consultoria.ec (attempt 3/5)",   "logger": "security.auth",       "module": "auth",          "function": "authenticate",          "line": 48,  "timestamp": _ts(1, 22, 45), "extra": {"user": "pedro.gomez@consultoria.ec", "attempt": 3, "max_attempts": 5}},
    # --- ERROR (10 entries) ---
    {"service": "tax-engine",    "level": "ERROR",   "message": "Database timeout: query exceeded 30s threshold on factura table",         "logger": "tax_engine.db",       "module": "repository",    "function": "query",                "line": 200, "timestamp": _ts(0, 3, 0),   "trace_id": "trace-err-001", "extra": {"table": "factura", "timeout_s": 30}},
    {"service": "tax-engine",    "level": "ERROR",   "message": "SRI service unreachable: SOAP endpoint timeout after 5000ms",             "logger": "tax_engine.sri",      "module": "sri.soap_client","function": "send",                 "line": 88,  "timestamp": _ts(0, 7, 30),  "trace_id": "trace-004", "extra": {"endpoint": "https://sri.gob.ec/soap/recepcion", "timeout_ms": 5000}},
    {"service": "tax-engine",    "level": "ERROR",   "message": "Validation failed: RUC 1799999999 does not match checksum",               "logger": "tax_engine.validation","module": "validators",    "function": "validate_ruc",         "line": 15,  "timestamp": _ts(0, 19, 0),  "extra": {"ruc": "1799999999"}},
    {"service": "command-center","level": "ERROR",   "message": "ATS generation failed: XML schema validation error at line 42",            "logger": "cmd_center.ats",      "module": "anexos",        "function": "generate_ats",         "line": 92,  "timestamp": _ts(0, 27, 15),  "trace_id": "trace-013", "extra": {"schema": "ATS_v2.7.xsd", "line": 42}},
    {"service": "clients",       "level": "ERROR",   "message": "Client creation failed: duplicate RUC 1799999999001 already exists",       "logger": "clients.api",         "module": "api.clients",   "function": "create_client",        "line": 38,  "timestamp": _ts(0, 36, 40),  "extra": {"ruc": "1799999999001"}},
    {"service": "finance",       "level": "ERROR",   "message": "Payment gateway error: HTTP 503 from Banco Central API",                  "logger": "finance.gateway",     "module": "payments",      "function": "process_payment",      "line": 150, "timestamp": _ts(0, 44, 55),  "trace_id": "trace-fin-001", "extra": {"gateway": "Banco Central", "status_code": 503}},
    {"service": "documents",     "level": "ERROR",   "message": "Document template not found: Contrato-Servicio-Profesional-v2.docx",       "logger": "documents.generator", "module": "generator",     "function": "load_template",        "line": 55,  "timestamp": _ts(0, 55, 10),  "extra": {"template": "Contrato-Servicio-Profesional-v2.docx"}},
    {"service": "security",      "level": "ERROR",   "message": "Authorization denied: user juan.perez@consultoria.ec lacks permission",    "logger": "security.authz",      "module": "authorization", "function": "check_permission",     "line": 73,  "timestamp": _ts(1, 3, 30),  "extra": {"user": "juan.perez@consultoria.ec", "required_role": "admin"}},
    {"service": "public-api",    "level": "ERROR",   "message": "Malformed request body: expected JSON, received text/plain",              "logger": "public_api.gateway",  "module": "gateway",       "function": "parse_body",           "line": 47,  "timestamp": _ts(1, 12, 0),  "extra": {"content_type": "text/plain"}},
    {"service": "ai-orchestrator","level": "ERROR",  "message": "ML model inference failed: out of memory on GPU 0",                       "logger": "ai.ml_engine",        "module": "ml_tax",        "function": "run_inference",        "line": 220, "timestamp": _ts(1, 18, 45), "extra": {"gpu": 0, "error": "OOM"}},
    # --- CRITICAL (3 entries) ---
    {"service": "finance",       "level": "CRITICAL","message": "Payment processing failed: transaction ROLLBACK for $250,000 transfer. Manual intervention required.", "logger": "finance.ledger","module": "payments", "function": "process_transfer", "line": 180, "timestamp": _ts(0, 2, 0), "trace_id": "trace-fin-crit", "user_id": "system", "extra": {"amount": 250000, "currency": "USD", "status": "ROLLBACK"}},
    {"service": "security",      "level": "CRITICAL","message": "Authentication breach detected: 47 failed attempts from IP 185.220.101.0 in 30 seconds", "logger": "security.monitor","module": "threat_detection","function": "analyze_pattern","line": 205, "timestamp": _ts(0, 11, 0), "user_id": "system", "extra": {"ip": "185.220.101.0", "attempts": 47, "window_seconds": 30}},
    {"service": "command-center","level": "CRITICAL","message": "Backup failure: database backup to S3 failed - insufficient storage quota", "logger": "cmd_center.backup",   "module": "backup",        "function": "run_backup",           "line": 310, "timestamp": _ts(1, 0, 0),  "extra": {"target": "s3://consultoria-backups", "reason": "quota_exceeded"}},
    # --- DEBUG (2 entries) ---
    {"service": "tax-engine",    "level": "DEBUG",   "message": "Cache miss for IVA rate config, loading from database",                   "logger": "tax_engine.cache",    "module": "config",        "function": "load_rates",           "line": 22,  "timestamp": _ts(0, 4, 0),   "extra": {"cache_key": "iva_rates", "cache_ttl_s": 3600}},
    {"service": "macro-service", "level": "DEBUG",   "message": "Iteration 127/380: processing scenario variable 'oil_price' with value $65.30", "logger": "macro.simulation","module": "scenarios",  "function": "run_simulation",       "line": 220, "timestamp": _ts(0, 48, 5), "extra": {"iteration": 127, "total": 380, "variable": "oil_price", "value": 65.30}},
]


class LogsEngine:
    """Motor de logs en memoria con capacidad de filtrado, búsqueda y estadísticas."""

    def __init__(self):
        self._logs: dict[str, LogEntry] = {}
        self._populate_samples()

    def _populate_samples(self):
        for entry in SAMPLE_LOGS:
            log_entry = LogEntry(
                id=entry.get("id", str(uuid.uuid4())),
                timestamp=entry["timestamp"],
                service=entry["service"],
                level=LogLevel(entry["level"]),
                message=entry["message"],
                logger=entry.get("logger", ""),
                module=entry.get("module", ""),
                function=entry.get("function", ""),
                line=entry.get("line", 0),
                trace_id=entry.get("trace_id"),
                span_id=entry.get("span_id"),
                user_id=entry.get("user_id"),
                correlation_id=entry.get("correlation_id"),
                extra=entry.get("extra", {}),
            )
            self._logs[log_entry.id] = log_entry

    def ingest(self, entry: LogEntry) -> LogEntry:
        if not entry.id:
            entry.id = str(uuid.uuid4())
        if not entry.timestamp:
            entry.timestamp = datetime.utcnow().isoformat()
        self._logs[entry.id] = entry
        return entry

    def query(
        self,
        service: Optional[str] = None,
        level: Optional[str] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[LogEntry], int]:
        results = list(self._logs.values())

        if service:
            results = [r for r in results if r.service == service]
        if level:
            results = [r for r in results if r.level.value == level.upper()]
        if start:
            start_dt = datetime.fromisoformat(start)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) >= start_dt]
        if end:
            end_dt = datetime.fromisoformat(end)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) <= end_dt]
        if search:
            text = search.lower()
            results = [r for r in results if text in r.message.lower()]

        results.sort(key=lambda r: r.timestamp, reverse=True)
        total = len(results)
        offset = (page - 1) * limit
        return results[offset: offset + limit], total

    def get(self, log_id: str) -> Optional[LogEntry]:
        return self._logs.get(log_id)

    def get_stats(self) -> LogStats:
        all_logs = list(self._logs.values())
        total = len(all_logs)
        by_level: dict[str, int] = {}
        by_service: dict[str, int] = {}
        last_24h = 0
        errors_last_hour = 0
        top_errors_map: dict[str, dict] = {}

        cutoff_24h = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        cutoff_1h = (datetime.utcnow() - timedelta(hours=1)).isoformat()

        for log in all_logs:
            by_level[log.level.value] = by_level.get(log.level.value, 0) + 1
            by_service[log.service] = by_service.get(log.service, 0) + 1

            if log.timestamp >= cutoff_24h:
                last_24h += 1

            if log.level in (LogLevel.ERROR, LogLevel.CRITICAL):
                if log.timestamp >= cutoff_1h:
                    errors_last_hour += 1
                key = f"{log.message}|{log.service}"
                if key in top_errors_map:
                    top_errors_map[key]["count"] += 1
                else:
                    top_errors_map[key] = {"message": log.message, "count": 1, "service": log.service}

        top_errors = sorted(top_errors_map.values(), key=lambda x: x["count"], reverse=True)[:10]

        return LogStats(
            total=total,
            by_level=by_level,
            by_service=by_service,
            last_24h=last_24h,
            errors_last_hour=errors_last_hour,
            top_errors=top_errors,
        )

    def get_by_level(self, level: LogLevel) -> list[LogEntry]:
        return [r for r in self._logs.values() if r.level == level]

    def search_text(self, text: str) -> list[LogEntry]:
        text_lower = text.lower()
        return [r for r in self._logs.values() if text_lower in r.message.lower()]
