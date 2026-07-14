import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestIntegrationAPI:
    def test_root_endpoint(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"] == "Integration Service — Service Registry & Health Aggregation"
        assert "registered_services" in data
        assert len(data["registered_services"]) == 12

    def test_health_endpoint(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "integration"

    def test_get_registry(self):
        resp = client.get("/api/v1/integration/registry")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 12

    def test_get_service_by_id(self):
        resp = client.get("/api/v1/integration/registry/tax-engine")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Tax Engine"

    def test_get_service_not_found(self):
        resp = client.get("/api/v1/integration/registry/nonexistent")
        assert resp.status_code == 404

    def test_register_service(self):
        payload = {
            "id": "api-test-svc",
            "name": "API Test Service",
            "description": "Created via API test",
            "version": "1.0.0",
            "url": "http://localhost:9999",
            "tags": ["test"],
            "dependencies": [],
            "endpoints": [],
        }
        resp = client.post("/api/v1/integration/registry", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "api-test-svc"

    def test_update_service(self):
        payload = {
            "id": "api-test-svc",
            "name": "API Test Service Updated",
            "description": "Updated via API",
            "version": "2.0.0",
            "url": "http://localhost:9999",
            "tags": ["test", "updated"],
            "dependencies": [],
            "endpoints": [],
        }
        resp = client.put("/api/v1/integration/registry/api-test-svc", json=payload)
        assert resp.status_code == 200
        assert resp.json()["name"] == "API Test Service Updated"

    def test_unregister_service(self):
        resp = client.delete("/api/v1/integration/registry/api-test-svc")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"]["status"] == "deprecated"

    def test_unregister_not_found(self):
        resp = client.delete("/api/v1/integration/registry/no-svc")
        assert resp.status_code == 404

    def test_get_endpoints(self):
        resp = client.get("/api/v1/integration/registry/endpoints")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        assert "service_id" in data[0]

    def test_get_graph(self):
        resp = client.get("/api/v1/integration/registry/graph")
        assert resp.status_code == 200
        data = resp.json()
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) >= 12
        assert len(data["edges"]) > 0

    def test_health_all(self):
        resp = client.get("/api/v1/integration/health/all")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 12
        for item in data:
            assert "status" in item

    def test_health_specific(self):
        resp = client.get("/api/v1/integration/health/tax-engine")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service_id"] == "tax-engine"

    def test_health_specific_not_found(self):
        resp = client.get("/api/v1/integration/health/nonexistent")
        assert resp.status_code == 404

    def test_health_summary(self):
        resp = client.get("/api/v1/integration/health/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 12
        assert "healthy" in data
        assert "degraded" in data
        assert "unreachable" in data

    def test_health_history(self):
        resp = client.get("/api/v1/integration/health/history")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 40
