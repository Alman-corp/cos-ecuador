import pytest
from engines.metrics_engine import MetricsEngine, MetricDatapoint, MetricType, MetricSummary


class TestMetricsEngine:

    def test_record_counter(self, metrics_engine):
        dp = metrics_engine.record("test_counter", MetricType.COUNTER, 42.0, unit="requests")
        assert dp.metric == "test_counter"
        assert dp.value == 42.0
        assert dp.type == MetricType.COUNTER

    def test_record_gauge(self, metrics_engine):
        dp = metrics_engine.record("test_gauge", MetricType.GAUGE, 15.0, labels={"service": "test"})
        assert dp.metric == "test_gauge"
        assert dp.labels.get("service") == "test"

    def test_query_metric(self, metrics_engine):
        data = metrics_engine.query("http_requests_total")
        assert len(data) > 0
        assert data[0]["metric"] == "http_requests_total"

    def test_get_families(self, metrics_engine):
        families = metrics_engine.get_families()
        required = ["http_requests_total", "http_request_duration_ms", "http_errors_total",
                    "active_users", "active_services", "queue_depth", "db_connections", "memory_usage_mb"]
        for r in required:
            assert r in families, f"Missing metric family: {r}"

    def test_get_dashboard_has_required_fields(self, metrics_engine):
        dash = metrics_engine.get_dashboard()
        assert dash.requests_per_minute is not None
        assert len(dash.requests_per_minute) > 0
        assert dash.error_rate_pct >= 0
        assert dash.avg_response_time_ms > 0
        assert dash.p95_response_time_ms > 0
        assert dash.active_services > 0
        assert len(dash.services_with_errors) > 0
        assert len(dash.top_slow_endpoints) > 0

    def test_get_summary(self, metrics_engine):
        summary = metrics_engine.get_summary("http_requests_total")
        assert isinstance(summary, MetricSummary)
        assert summary.metric == "http_requests_total"
        assert summary.sample_count > 0
        assert summary.avg_24h > 0
        assert summary.min_24h >= 0
        assert summary.max_24h >= summary.min_24h

    def test_percentile_calculation(self, metrics_engine):
        values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        p50 = metrics_engine._percentile(values, 50)
        p95 = metrics_engine._percentile(values, 95)
        p99 = metrics_engine._percentile(values, 99)
        assert p50 >= 50 and p50 <= 60
        assert p95 >= 90
        assert p99 >= 90

    def test_metric_with_labels(self, metrics_engine):
        dp = metrics_engine.record("labeled_test", MetricType.GAUGE, 100.0,
                                    labels={"service": "test-svc", "env": "prod"})
        assert dp.labels["service"] == "test-svc"
        assert dp.labels["env"] == "prod"
