"""Tests de integración para todos los endpoints de la API de Observabilidad."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestLogsAPI:

    def test_list_logs_default(self):
        response = client.get("/api/v1/observability/logs")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert data["total"] >= 50

    def test_list_logs_filter_by_service(self):
        response = client.get("/api/v1/observability/logs?service=tax-engine")
        assert response.status_code == 200
        data = response.json()
        assert all(r["service"] == "tax-engine" for r in data["data"])

    def test_list_logs_filter_by_level(self):
        response = client.get("/api/v1/observability/logs?level=ERROR")
        assert response.status_code == 200
        data = response.json()
        assert all(r["level"] == "ERROR" for r in data["data"])

    def test_list_logs_pagination(self):
        response = client.get("/api/v1/observability/logs?page=1&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) <= 5
        assert data["page"] == 1
        assert data["limit"] == 5

    def test_list_logs_search(self):
        response = client.get("/api/v1/observability/logs?search=IVA")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) > 0

    def test_ingest_log(self):
        payload = {
            "id": "api-test-log-001",
            "timestamp": "2026-07-13T10:00:00",
            "service": "api-test",
            "level": "INFO",
            "message": "Test desde API",
            "logger": "test",
            "module": "test_api",
            "function": "test_ingest",
            "line": 1,
        }
        response = client.post("/api/v1/observability/logs", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "api-test-log-001"
        assert data["service"] == "api-test"

    def test_get_log_by_id(self):
        list_resp = client.get("/api/v1/observability/logs?limit=1")
        log_id = list_resp.json()["data"][0]["id"]
        response = client.get(f"/api/v1/observability/logs/{log_id}")
        assert response.status_code == 200
        assert response.json()["id"] == log_id

    def test_get_log_not_found(self):
        response = client.get("/api/v1/observability/logs/non-existent")
        assert response.status_code == 404

    def test_get_log_stats(self):
        response = client.get("/api/v1/observability/logs/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_level" in data
        assert "by_service" in data
        assert "last_24h" in data
        assert "errors_last_hour" in data
        assert "top_errors" in data


class TestMetricsAPI:

    def test_list_metric_families(self):
        response = client.get("/api/v1/observability/metrics")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert "http_requests_total" in data

    def test_record_metric(self):
        response = client.post(
            "/api/v1/observability/metrics?metric=test_api_counter&type=counter&value=42&unit=requests"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["metric"] == "test_api_counter"
        assert data["value"] == 42.0

    def test_query_metric(self):
        response = client.get("/api/v1/observability/metrics/http_requests_total")
        assert response.status_code == 200
        data = response.json()
        assert data["metric"] == "http_requests_total"
        assert len(data["datapoints"]) > 0

    def test_query_metric_not_found(self):
        response = client.get("/api/v1/observability/metrics/non_existent_metric")
        assert response.status_code == 404

    def test_query_metric_with_aggregation(self):
        response = client.get("/api/v1/observability/metrics/http_requests_total?aggregation=avg")
        assert response.status_code == 200
        data = response.json()
        assert data["aggregation"] == "avg"
        assert data["value"] > 0

    def test_get_dashboard(self):
        response = client.get("/api/v1/observability/metrics/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "requests_per_minute" in data
        assert "error_rate_pct" in data
        assert "avg_response_time_ms" in data
        assert "p95_response_time_ms" in data
        assert "active_services" in data
        assert "services_with_errors" in data
        assert "top_slow_endpoints" in data

    def test_get_health_metrics(self):
        response = client.get("/api/v1/observability/metrics/health")
        assert response.status_code == 200
        data = response.json()
        assert "overall_status" in data
        assert "services" in data
        assert len(data["services"]) > 0


class TestTracingAPI:

    def test_list_traces_default(self):
        response = client.get("/api/v1/observability/traces")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["total"] == 15

    def test_list_traces_filter_by_service(self):
        response = client.get("/api/v1/observability/traces?service=tax-engine")
        assert response.status_code == 200
        data = response.json()
        assert all(t["root_service"] == "tax-engine" for t in data["data"])

    def test_list_traces_filter_by_status(self):
        response = client.get("/api/v1/observability/traces?status=ERROR")
        assert response.status_code == 200
        data = response.json()
        if data["data"]:
            assert all(t["status"] == "ERROR" for t in data["data"])

    def test_list_traces_filter_by_min_duration(self):
        response = client.get("/api/v1/observability/traces?min_duration=2000")
        assert response.status_code == 200
        data = response.json()
        assert all(t["total_duration_ms"] >= 2000 for t in data["data"])

    def test_ingest_span(self):
        payload = {
            "span_id": "api-test-span-001",
            "trace_id": "api-test-trace-001",
            "service": "api-test",
            "operation": "GET /api/test",
            "start_time": "2026-07-13T10:00:00",
            "duration_ms": 50.0,
            "status": "OK",
        }
        response = client.post("/api/v1/observability/traces", json=payload)
        assert response.status_code == 200
        assert response.json()["span_id"] == "api-test-span-001"

    def test_get_trace_by_id(self):
        response = client.get("/api/v1/observability/traces/trace-001")
        assert response.status_code == 200
        data = response.json()
        assert data["trace_id"] == "trace-001"
        assert len(data["spans"]) >= 1

    def test_get_trace_not_found(self):
        response = client.get("/api/v1/observability/traces/non-existent")
        assert response.status_code == 404

    def test_search_traces_by_tag(self):
        response = client.get("/api/v1/observability/traces/search?key=http.status_code&value=200")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0


class TestAuditAPI:

    def test_list_audit_default(self):
        response = client.get("/api/v1/observability/audit")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert data["total"] >= 30

    def test_list_audit_filter_by_actor(self):
        response = client.get("/api/v1/observability/audit?actor=María López")
        assert response.status_code == 200
        data = response.json()
        assert all("María López" in r["actor"] for r in data["data"])

    def test_list_audit_filter_by_action(self):
        response = client.get("/api/v1/observability/audit?action=CREATE")
        assert response.status_code == 200
        data = response.json()
        assert all(r["action"] == "CREATE" for r in data["data"])

    def test_list_audit_filter_by_resource(self):
        response = client.get("/api/v1/observability/audit?resource=client")
        assert response.status_code == 200
        data = response.json()
        assert all("client" in r["resource_type"].lower() for r in data["data"])

    def test_list_audit_pagination(self):
        response = client.get("/api/v1/observability/audit?page=1&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) <= 5
        assert data["page"] == 1
        assert data["limit"] == 5

    def test_record_audit_entry(self):
        payload = {
            "id": "api-test-audit-001",
            "timestamp": "2026-07-13T10:00:00",
            "actor": "api.test@consultoria.ec",
            "actor_type": "user",
            "action": "EXPORT",
            "resource_type": "test",
            "resource_id": "TEST-API-001",
            "resource_name": "Test API",
            "details": "Prueba desde API",
            "service": "api-test",
            "outcome": "success",
        }
        response = client.post("/api/v1/observability/audit", json=payload)
        assert response.status_code == 200
        assert response.json()["id"] == "api-test-audit-001"

    def test_get_audit_entry(self):
        list_resp = client.get("/api/v1/observability/audit?limit=1")
        audit_id = list_resp.json()["data"][0]["id"]
        response = client.get(f"/api/v1/observability/audit/{audit_id}")
        assert response.status_code == 200
        assert response.json()["id"] == audit_id

    def test_get_audit_not_found(self):
        response = client.get("/api/v1/observability/audit/non-existent")
        assert response.status_code == 404

    def test_get_audit_summary(self):
        response = client.get("/api/v1/observability/audit/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_entries" in data
        assert "by_action" in data
        assert "by_resource" in data
        assert "by_actor" in data
        assert "by_service" in data
        assert "failures_last_24h" in data
        assert "recent_actors" in data


class TestHealthAndRoot:

    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "observability"
        assert "modules" in data

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "docs" in data
        assert "health" in data
