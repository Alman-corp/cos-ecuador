from engine.registry_engine import RegistryEngine, SERVICE_REGISTRY


class TestRegistryEngine:
    def test_get_all_returns_12_services(self, registry_engine):
        services = registry_engine.get_all()
        assert len(services) == 12

    def test_get_service_by_id(self, registry_engine):
        svc = registry_engine.get_service("tax-engine")
        assert svc is not None
        assert svc["name"] == "Tax Engine"
        assert svc["url"] == "http://localhost:8001"

    def test_get_service_not_found(self, registry_engine):
        svc = registry_engine.get_service("nonexistent")
        assert svc is None

    def test_register_new_service(self, registry_engine, sample_service):
        result = registry_engine.register(sample_service)
        assert result["id"] == "test-service"
        assert result["status"] == "registered"
        svc = registry_engine.get_service("test-service")
        assert svc is not None

    def test_register_update_existing(self, registry_engine):
        data = {
            "id": "tax-engine",
            "name": "Tax Engine Updated",
            "description": "Updated description",
            "version": "2.0.0",
            "url": "http://localhost:8001",
            "tags": ["core", "tributario", "updated"],
            "dependencies": [],
            "endpoints": [],
        }
        result = registry_engine.register(data)
        assert result["name"] == "Tax Engine Updated"
        assert result["version"] == "2.0.0"
        svc = registry_engine.get_service("tax-engine")
        assert svc["name"] == "Tax Engine Updated"

    def test_unregister_service(self, registry_engine):
        result = registry_engine.unregister("tax-engine")
        assert result["status"] == "deprecated"
        svc = registry_engine.get_service("tax-engine")
        assert svc["status"] == "deprecated"

    def test_get_endpoints_aggregated(self, registry_engine):
        endpoints = registry_engine.get_endpoints()
        assert len(endpoints) > 0
        for ep in endpoints:
            assert "service_id" in ep
            assert "service_name" in ep
            assert "path" in ep
            assert "method" in ep

    def test_get_graph_has_edges(self, registry_engine):
        graph = registry_engine.get_graph()
        assert len(graph) > 0
        for edge in graph:
            assert "from" in edge
            assert "to" in edge
            assert "type" in edge

    def test_get_summary(self, registry_engine):
        summary = registry_engine.get_summary()
        assert summary.total_services == 12
        assert "core" in summary.by_tag
        assert "registered" in summary.by_status

    def test_heartbeat_updates_timestamp(self, registry_engine):
        result = registry_engine.heartbeat("tax-engine")
        assert result is not None
        assert result["last_heartbeat"] is not None
        svc = registry_engine.get_service("tax-engine")
        assert svc["last_heartbeat"] is not None

    def test_dependency_graph_correctness(self, registry_engine):
        graph = registry_engine.get_graph()
        edges_by_from = {}
        for edge in graph:
            edges_by_from.setdefault(edge["from"], []).append(edge["to"])
        assert "disaster-recovery" in edges_by_from
        dr_deps = edges_by_from["disaster-recovery"]
        assert "tax-engine" in dr_deps
        assert "finance" in dr_deps
        assert "clients" in dr_deps
        assert "documents" in dr_deps
        assert "macro-service" in dr_deps
        assert "public-api" in edges_by_from
        assert "plugin-registry" in edges_by_from
        assert "ai-orchestrator" in edges_by_from
        assert "analytics-advanced" in edges_by_from
        assert "bi" in edges_by_from
        bi_deps = edges_by_from["bi"]
        assert "analytics-advanced" in bi_deps
