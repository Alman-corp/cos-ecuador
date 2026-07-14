import pytest
from engines.dr_engine import DREngine, FailoverRequest, DRDrill


class TestReadiness:
    def test_get_readiness_returns_report(self, engine):
        report = engine.get_readiness()
        assert report.overall_status in ("green", "yellow", "red")
        assert isinstance(report.services, list)
        assert isinstance(report.active_regions, list)
        assert isinstance(report.total_backups, int)
        assert isinstance(report.verified_backups, int)
        assert isinstance(report.gaps, list)
        assert isinstance(report.recommendations, list)
        assert isinstance(report.overall_rto_compliance, float)
        assert isinstance(report.overall_rpo_compliance, float)

    def test_get_readiness_services_count(self, engine):
        report = engine.get_readiness()
        assert len(report.services) == 6

    def test_get_readiness_backup_counts(self, engine):
        report = engine.get_readiness()
        assert report.total_backups > 0
        assert report.verified_backups <= report.total_backups


class TestRegions:
    def test_get_regions(self, engine):
        regions = engine.get_regions()
        assert len(regions) == 3
        assert "us-east-1" in regions
        assert "sa-east-1" in regions
        assert "eu-west-1" in regions

    def test_get_regions_zones(self, engine):
        regions = engine.get_regions()
        for region_name, zones in regions.items():
            assert len(zones) >= 1
            for zone in zones:
                assert zone.region == region_name
                assert zone.zone in ("a", "b", "c")
                assert zone.status in ("active", "standby", "degraded", "down")

    def test_us_east_has_three_zones(self, engine):
        regions = engine.get_regions()
        assert len(regions["us-east-1"]) == 3

    def test_sa_east_has_two_zones(self, engine):
        regions = engine.get_regions()
        assert len(regions["sa-east-1"]) == 2

    def test_eu_west_has_two_zones(self, engine):
        regions = engine.get_regions()
        assert len(regions["eu-west-1"]) == 2


class TestFailover:
    def test_failover_tax_engine(self, engine, failover_request):
        result = engine.failover("tax-engine", failover_request)
        assert result.service == "tax-engine"
        assert result.status == "completed"
        assert result.source == "us-east-1"
        assert "sa-east-1" in result.target
        assert result.downtime_seconds == 45
        assert isinstance(result.data_loss_seconds, int)
        assert result.timestamp is not None
        assert result.details is not None

    def test_failover_nonexistent_service(self, engine, failover_request):
        with pytest.raises(ValueError, match="no encontrado"):
            engine.failover("nonexistent-service", failover_request)

    def test_failover_exceeds_rto(self, engine):
        request = FailoverRequest(
            target_region="sa-east-1",
            target_zone="a",
            reason="RTO exceed test",
            estimated_downtime_seconds=300,
        )
        result = engine.failover("tax-engine", request)
        assert result.status == "failed"

    def test_failover_nonexistent_region(self, engine):
        request = FailoverRequest(
            target_region="ap-southeast-1",
            target_zone="a",
            reason="Invalid region",
            estimated_downtime_seconds=30,
        )
        with pytest.raises(ValueError, match="Región objetivo"):
            engine.failover("tax-engine", request)

    def test_failover_nonexistent_zone(self, engine, failover_request):
        request = FailoverRequest(
            target_region="sa-east-1",
            target_zone="z",
            reason="Invalid zone",
            estimated_downtime_seconds=30,
        )
        with pytest.raises(ValueError, match="Zona.*no encontrada"):
            engine.failover("tax-engine", request)

    def test_failover_changes_service_status(self, engine, failover_request):
        engine.failover("tax-engine", failover_request)
        report = engine.get_readiness()
        tax_engine = next(s for s in report.services if s.name == "tax-engine")
        assert tax_engine.status == "failed_over"

    def test_failover_increments_failover_count(self, engine, failover_request):
        report_before = engine.get_readiness()
        svc_before = next(s for s in report_before.services if s.name == "tax-engine")
        count_before = svc_before.failover_count
        engine.failover("tax-engine", failover_request)
        report_after = engine.get_readiness()
        svc_after = next(s for s in report_after.services if s.name == "tax-engine")
        assert svc_after.failover_count == count_before + 1

    def test_failover_records_timestamp(self, engine, failover_request):
        result = engine.failover("tax-engine", failover_request)
        assert result.timestamp is not None
        assert "T" in result.timestamp
        assert result.timestamp.endswith("Z")


class TestFailback:
    def test_failback_tax_engine(self, engine, failover_request):
        engine.failover("tax-engine", failover_request)
        result = engine.failback("tax-engine")
        assert result.status == "completed"
        assert result.service == "tax-engine"
        assert result.downtime_seconds == 30
        assert result.data_loss_seconds == 0

    def test_failback_restores_healthy_status(self, engine, failover_request):
        engine.failover("tax-engine", failover_request)
        engine.failback("tax-engine")
        report = engine.get_readiness()
        tax_engine = next(s for s in report.services if s.name == "tax-engine")
        assert tax_engine.status == "healthy"

    def test_failback_nonexistent_service(self, engine):
        with pytest.raises(ValueError, match="no encontrado"):
            engine.failback("nonexistent-service")

    def test_failback_not_failed_over(self, engine):
        with pytest.raises(ValueError, match="no está en estado failed_over"):
            engine.failback("tax-engine")


class TestBackups:
    def test_get_backups_tax_engine(self, engine):
        backups = engine.get_backups("tax-engine")
        assert isinstance(backups, list)
        assert len(backups) == 5
        for b in backups:
            assert b.service == "tax-engine"
            assert b.type in ("full", "incremental", "differential")
            assert b.status in ("completed", "in_progress", "failed")

    def test_get_backups_nonexistent_service(self, engine):
        with pytest.raises(ValueError, match="no encontrado"):
            engine.get_backups("nonexistent-service")

    def test_get_backups_all_services(self, engine):
        services = ["tax-engine", "ai-orchestrator", "data-platform",
                     "analytics-advanced", "bi", "command-center"]
        for svc in services:
            backups = engine.get_backups(svc)
            assert len(backups) >= 1, f"{svc} should have backups"

    def test_backup_verification_status(self, engine):
        backups = engine.get_backups("tax-engine")
        for b in backups:
            assert isinstance(b.verified, bool)

    def test_backup_has_valid_id(self, engine):
        backups = engine.get_backups("tax-engine")
        for b in backups:
            assert b.id is not None
            assert len(b.id) > 0

    def test_trigger_backup(self, engine):
        count_before = len(engine.get_backups("tax-engine"))
        new_backup = engine.trigger_backup("tax-engine")
        assert new_backup.service == "tax-engine"
        assert new_backup.status == "in_progress"
        assert new_backup.verified is False
        assert new_backup.completed_at is None
        assert len(engine.get_backups("tax-engine")) == count_before + 1

    def test_trigger_backup_nonexistent_service(self, engine):
        with pytest.raises(ValueError, match="no encontrado"):
            engine.trigger_backup("nonexistent-service")


class TestDrills:
    def test_get_drills(self, engine):
        drills = engine.get_drills()
        assert isinstance(drills, list)
        assert len(drills) == 4

    def test_get_drills_has_all_types(self, engine):
        drills = engine.get_drills()
        types = {d.drill_type for d in drills}
        assert "failover" in types
        assert "backup_restore" in types
        assert "network_partition" in types
        assert "full_outage" in types

    def test_execute_drill(self, engine, sample_drill):
        result = engine.execute_drill(sample_drill)
        assert result.status == "in_progress"
        assert result.id is not None
        assert len(result.id) > 0
        assert result.scheduled_at is not None
        assert len(engine.get_drills()) == 5

    def test_execute_drill_invalid_service(self, engine):
        drill = DRDrill(
            id="",
            drill_type="failover",
            status="planned",
            services_involved=["nonexistent-service"],
            scheduled_at="",
            completed_at=None,
            results=None,
            lessons_learned=None,
            rto_achieved_seconds=None,
            rpo_achieved_seconds=None,
        )
        with pytest.raises(ValueError, match="no encontrado"):
            engine.execute_drill(drill)

    def test_drill_history_has_required_fields(self, engine):
        drills = engine.get_drills()
        for d in drills:
            assert d.completed_at is not None, f"Drill {d.id} missing completed_at"
            assert d.results is not None, f"Drill {d.id} missing results"

    def test_drill_has_rto_rpo_metrics(self, engine):
        drills = engine.get_drills()
        for d in drills:
            if d.status == "completed":
                assert d.rto_achieved_seconds is not None
                assert d.rpo_achieved_seconds is not None


class TestRTO:
    def test_get_rto_tax_engine(self, engine):
        rto = engine.get_rto("tax-engine")
        assert rto["service"] == "tax-engine"
        assert rto["rto_seconds"] == 60
        assert isinstance(rto["compliance_pct"], float)
        assert rto["compliance_pct"] == 99.2
        assert rto["status"] in ("within_sla", "at_risk", "breach")
        assert isinstance(rto["drill_count"], int)

    def test_get_rto_nonexistent_service(self, engine):
        with pytest.raises(ValueError, match="no encontrado"):
            engine.get_rto("nonexistent-service")

    def test_get_rto_all_services(self, engine):
        for svc in ["tax-engine", "ai-orchestrator", "data-platform",
                     "analytics-advanced", "bi", "command-center"]:
            rto = engine.get_rto(svc)
            assert rto["service"] == svc
            assert rto["rto_seconds"] > 0


class TestRPO:
    def test_get_rpo_tax_engine(self, engine):
        rpo = engine.get_rpo("tax-engine")
        assert rpo["service"] == "tax-engine"
        assert rpo["rpo_seconds"] == 30
        assert isinstance(rpo["compliance_pct"], float)
        assert rpo["compliance_pct"] == 98.5
        assert rpo["status"] in ("within_sla", "at_risk", "breach")
        assert isinstance(rpo["drill_count"], int)

    def test_get_rpo_nonexistent_service(self, engine):
        with pytest.raises(ValueError, match="no encontrado"):
            engine.get_rpo("nonexistent-service")

    def test_get_rpo_all_services(self, engine):
        for svc in ["tax-engine", "ai-orchestrator", "data-platform",
                     "analytics-advanced", "bi", "command-center"]:
            rpo = engine.get_rpo(svc)
            assert rpo["service"] == svc
            assert rpo["rpo_seconds"] > 0


class TestEngineEdgeCases:
    def test_new_engine_is_independent(self):
        e1 = DREngine()
        e2 = DREngine()
        assert e1.get_regions() is not e2.get_regions()

    def test_failover_and_failback_cycle(self, engine, failover_request):
        engine.failover("tax-engine", failover_request)
        assert engine.failback("tax-engine").status == "completed"

    def test_backup_ids_are_unique(self, engine):
        b1 = engine.trigger_backup("tax-engine")
        b2 = engine.trigger_backup("tax-engine")
        assert b1.id != b2.id

    def test_drill_round_trip(self, engine, sample_drill):
        created = engine.execute_drill(sample_drill)
        drills = engine.get_drills()
        found = any(d.id == created.id for d in drills)
        assert found
