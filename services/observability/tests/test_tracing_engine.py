import pytest
from engines.tracing_engine import TracingEngine, Span, SpanStatus, Trace


class TestTracingEngine:

    def test_ingest_span(self, tracing_engine, sample_span):
        result = tracing_engine.ingest_span(sample_span)
        assert result.span_id == "test-span-001"
        assert result.trace_id == "test-trace-001"

    def test_ingest_span_creates_trace(self, tracing_engine):
        span = Span(
            span_id="new-span-001",
            trace_id="new-trace-001",
            service="new-service",
            operation="GET /new",
            start_time="2026-07-13T12:00:00",
            duration_ms=50.0,
            status=SpanStatus.OK,
        )
        tracing_engine.ingest_span(span)
        trace = tracing_engine.get_trace("new-trace-001")
        assert trace is not None
        assert trace.root_service == "new-service"
        assert trace.total_duration_ms == 50.0

    def test_get_trace(self, tracing_engine):
        trace = tracing_engine.get_trace("trace-001")
        assert trace is not None
        assert trace.trace_id == "trace-001"
        assert len(trace.spans) >= 1

    def test_get_trace_not_found(self, tracing_engine):
        trace = tracing_engine.get_trace("non-existent-trace")
        assert trace is None

    def test_list_traces_default(self, tracing_engine):
        traces, total = tracing_engine.list_traces()
        assert total == 15
        assert len(traces) <= 20

    def test_list_traces_filter_by_service(self, tracing_engine):
        traces, total = tracing_engine.list_traces(service="tax-engine")
        assert total > 0
        assert all(t.root_service == "tax-engine" for t in traces)

    def test_list_traces_filter_by_status(self, tracing_engine):
        traces, total = tracing_engine.list_traces(status="ERROR")
        assert total > 0
        assert all(t.status.value == "ERROR" for t in traces)

    def test_trace_has_correct_duration(self, tracing_engine):
        trace = tracing_engine.get_trace("trace-003")
        assert trace is not None
        assert trace.total_duration_ms == 340.0

    def test_search_by_tag(self, tracing_engine):
        traces = tracing_engine.search_traces("http.status_code", "200")
        assert len(traces) > 0
