from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealth:
    def test_health_endpoint(self):
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "healthy"
        assert body["service"] == "dr-service"
        assert body["version"] == "1.0.0"
        assert "failover" in body["capabilities"]

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        body = response.json()
        assert "DR Service" in body["service"]
        assert body["version"] == "1.0.0"
        assert "/docs" in body["docs"]


class TestStatus:
    def test_get_status(self):
        response = client.get("/api/v1/dr/status")
        assert response.status_code == 200
        body = response.json()
        assert "overall_status" in body
        assert "services" in body
        assert "active_regions" in body
        assert "total_backups" in body
        assert "verified_backups" in body
        assert "gaps" in body
        assert "recommendations" in body
        assert "overall_rto_compliance" in body
        assert "overall_rpo_compliance" in body

    def test_get_status_has_six_services(self):
        response = client.get("/api/v1/dr/status")
        assert len(response.json()["services"]) == 6


class TestRegions:
    def test_get_regions(self):
        response = client.get("/api/v1/dr/regions")
        assert response.status_code == 200
        body = response.json()
        assert "us-east-1" in body
        assert "sa-east-1" in body
        assert "eu-west-1" in body

    def test_get_regions_zones_have_required_fields(self):
        response = client.get("/api/v1/dr/regions")
        body = response.json()
        for region, zones in body.items():
            for zone in zones:
                assert "region" in zone
                assert "zone" in zone
                assert "status" in zone
                assert "cpu" in zone
                assert "memory" in zone
                assert "services" in zone


class TestFailover:
    def test_failover(self):
        response = client.post(
            "/api/v1/dr/failover/tax-engine",
            json={
                "target_region": "sa-east-1",
                "target_zone": "a",
                "reason": "Test failover via API",
                "estimated_downtime_seconds": 45,
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert body["service"] == "tax-engine"
        assert body["status"] == "completed"

    def test_failover_nonexistent_service(self):
        response = client.post(
            "/api/v1/dr/failover/nonexistent",
            json={
                "target_region": "sa-east-1",
                "target_zone": "a",
                "reason": "Invalid service",
                "estimated_downtime_seconds": 30,
            },
        )
        assert response.status_code == 404


class TestFailback:
    def test_failback(self):
        client.post(
            "/api/v1/dr/failover/tax-engine",
            json={
                "target_region": "sa-east-1",
                "target_zone": "a",
                "reason": "Failover before failback test",
                "estimated_downtime_seconds": 45,
            },
        )
        response = client.post("/api/v1/dr/failback/tax-engine")
        assert response.status_code == 200
        body = response.json()
        assert body["service"] == "tax-engine"
        assert body["status"] == "completed"

    def test_failback_not_failed_over(self):
        client.post(
            "/api/v1/dr/failback/bi",
        )
        response = client.post("/api/v1/dr/failback/bi")
        assert response.status_code == 404


class TestBackups:
    def test_get_backups(self):
        response = client.get("/api/v1/dr/backups/tax-engine")
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        assert len(body) >= 1
        for b in body:
            assert "id" in b
            assert "service" in b
            assert "type" in b
            assert "status" in b
            assert "verified" in b

    def test_get_backups_nonexistent_service(self):
        response = client.get("/api/v1/dr/backups/nonexistent")
        assert response.status_code == 404

    def test_trigger_backup(self):
        response = client.post("/api/v1/dr/backups/tax-engine")
        assert response.status_code == 200
        body = response.json()
        assert body["service"] == "tax-engine"
        assert body["status"] == "in_progress"


class TestDrills:
    def test_get_drills(self):
        response = client.get("/api/v1/dr/drills")
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        assert len(body) >= 1
        for d in body:
            assert "id" in d
            assert "drill_type" in d
            assert "status" in d
            assert "services_involved" in d

    def test_execute_drill(self):
        response = client.post(
            "/api/v1/dr/drills",
            json={
                "id": "",
                "drill_type": "failover",
                "status": "planned",
                "services_involved": ["tax-engine", "bi"],
                "scheduled_at": "",
                "completed_at": None,
                "results": None,
                "lessons_learned": None,
                "rto_achieved_seconds": None,
                "rpo_achieved_seconds": None,
            },
        )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "in_progress"
        assert "tax-engine" in body["services_involved"]


class TestRTO:
    def test_get_rto(self):
        response = client.get("/api/v1/dr/rto/tax-engine")
        assert response.status_code == 200
        body = response.json()
        assert body["service"] == "tax-engine"
        assert "rto_seconds" in body
        assert "compliance_pct" in body
        assert "status" in body
        assert "drill_count" in body

    def test_get_rto_nonexistent_service(self):
        response = client.get("/api/v1/dr/rto/nonexistent")
        assert response.status_code == 404


class TestRPO:
    def test_get_rpo(self):
        response = client.get("/api/v1/dr/rpo/tax-engine")
        assert response.status_code == 200
        body = response.json()
        assert body["service"] == "tax-engine"
        assert "rpo_seconds" in body
        assert "compliance_pct" in body
        assert "status" in body
        assert "drill_count" in body

    def test_get_rpo_nonexistent_service(self):
        response = client.get("/api/v1/dr/rpo/nonexistent")
        assert response.status_code == 404
