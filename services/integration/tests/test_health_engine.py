from engine.health_engine import HealthEngine
from engine.registry_engine import RegistryEngine


class TestHealthEngine:
    def test_aggregate_health_returns_all_services(self, health_engine):
        registry = RegistryEngine().get_all()
        results = health_engine.aggregate_health(registry)
        assert len(results) == 12

    def test_aggregate_health_has_correct_types(self, health_engine):
        registry = RegistryEngine().get_all()
        results = health_engine.aggregate_health(registry)
        for r in results:
            assert r.status in ("healthy", "degraded", "unreachable")
            assert isinstance(r.response_time_ms, int)
            assert r.response_time_ms > 0
            assert r.service_id is not None

    def test_get_service_health(self, health_engine):
        result = health_engine.get_service_health("tax-engine")
        assert result is not None
        assert result.service_id == "tax-engine"
        assert result.status in ("healthy", "degraded", "unreachable")

    def test_get_service_health_not_found(self, health_engine):
        result = health_engine.get_service_health("nonexistent")
        assert result is None

    def test_get_summary(self, health_engine):
        summary = health_engine.get_summary()
        assert summary.total == 12
        assert summary.healthy + summary.degraded + summary.unreachable == summary.total
        assert summary.overall in ("healthy", "degraded", "down")

    def test_overall_healthy_when_all_healthy(self):
        engine = HealthEngine()
        summary = engine.get_summary()
        assert isinstance(summary.healthy, int)

    def test_history_has_24h_of_data(self, health_engine):
        history = health_engine.get_history()
        assert len(history) >= 40
        for entry in history:
            assert "service_id" in entry
            assert "checked_at" in entry
            assert "status" in entry
