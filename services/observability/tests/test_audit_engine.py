import pytest
from engines.audit_engine import AuditEngine, AuditEntry, AuditAction, AuditSummary


class TestAuditEngine:

    def test_record_audit_entry(self, audit_engine, sample_audit_entry):
        result = audit_engine.record(sample_audit_entry)
        assert result.id == "test-audit-001"
        assert result.actor == "test@consultoria.ec"
        assert result.action == AuditAction.CREATE

    def test_query_audit_by_actor(self, audit_engine):
        results, total = audit_engine.query(actor="María López")
        assert total > 0
        assert all("María López" in r.actor for r in results)

    def test_query_audit_by_action(self, audit_engine):
        results, total = audit_engine.query(action="CREATE")
        assert total > 0
        assert all(r.action.value == "CREATE" for r in results)

    def test_query_audit_by_resource(self, audit_engine):
        results, total = audit_engine.query(resource="client")
        assert total > 0
        assert all("client" in r.resource_type.lower() for r in results)

    def test_query_audit_pagination(self, audit_engine):
        page1, total = audit_engine.query(page=1, limit=5)
        assert len(page1) <= 5
        assert total >= 30
        page2, _ = audit_engine.query(page=2, limit=5)
        if len(page1) == 5:
            assert len(page2) > 0

    def test_get_audit_entry(self, audit_engine):
        all_entries, _ = audit_engine.query(limit=1)
        if all_entries:
            entry = audit_engine.get(all_entries[0].id)
            assert entry is not None
            assert entry.id == all_entries[0].id

    def test_get_summary(self, audit_engine):
        summary = audit_engine.get_summary()
        assert isinstance(summary, AuditSummary)
        assert summary.total_entries >= 30
        assert len(summary.by_action) >= 9
        assert summary.by_action.get("CREATE", 0) == 8
        assert summary.by_action.get("UPDATE", 0) == 6
        assert "client" in summary.by_resource
        assert "security" in summary.by_service
        assert len(summary.recent_actors) > 0

    def test_date_range_filter(self, audit_engine):
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        start = (now - timedelta(days=1)).isoformat()
        end = (now + timedelta(hours=1)).isoformat()
        entries = audit_engine.get_by_date_range(start, end)
        assert len(entries) >= 30
