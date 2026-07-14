import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from engines.logs_engine import LogsEngine, LogEntry, LogLevel
from engines.metrics_engine import MetricsEngine, MetricDatapoint, MetricType
from engines.tracing_engine import TracingEngine, Span, SpanStatus
from engines.audit_engine import AuditEngine, AuditEntry, AuditAction


@pytest.fixture
def logs_engine():
    return LogsEngine()


@pytest.fixture
def metrics_engine():
    return MetricsEngine()


@pytest.fixture
def tracing_engine():
    return TracingEngine()


@pytest.fixture
def audit_engine():
    return AuditEngine()


@pytest.fixture
def sample_log_entry():
    return LogEntry(
        id="test-log-001",
        timestamp="2026-07-13T10:00:00",
        service="test-service",
        level=LogLevel.INFO,
        message="Test log entry",
        logger="test",
        module="test",
        function="test_func",
        line=42,
        extra={"key": "value"},
    )


@pytest.fixture
def sample_metric_counter():
    return MetricDatapoint(
        id="test-metric-001",
        metric="test_requests_total",
        type=MetricType.COUNTER,
        value=100.0,
        labels={"service": "test", "endpoint": "/test"},
        timestamp="2026-07-13T10:00:00",
        unit="requests",
    )


@pytest.fixture
def sample_span():
    return Span(
        span_id="test-span-001",
        trace_id="test-trace-001",
        parent_span_id=None,
        service="test-service",
        operation="GET /test",
        start_time="2026-07-13T10:00:00",
        end_time="2026-07-13T10:00:00.045",
        duration_ms=45.0,
        status=SpanStatus.OK,
        tags={"http.status_code": 200},
    )


@pytest.fixture
def sample_audit_entry():
    return AuditEntry(
        id="test-audit-001",
        timestamp="2026-07-13T10:00:00",
        actor="test@consultoria.ec",
        actor_type="user",
        action=AuditAction.CREATE,
        resource_type="test",
        resource_id="TEST-001",
        resource_name="Test Resource",
        details="Test audit entry",
        service="test-service",
        outcome="success",
    )
