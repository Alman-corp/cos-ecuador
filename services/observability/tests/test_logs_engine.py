import pytest
from engines.logs_engine import LogsEngine, LogEntry, LogLevel, LogStats


class TestLogsEngine:

    def test_ingest_log(self, logs_engine, sample_log_entry):
        result = logs_engine.ingest(sample_log_entry)
        assert result.id == "test-log-001"
        assert logs_engine.get("test-log-001") is not None

    def test_query_logs_by_service(self, logs_engine):
        results, total = logs_engine.query(service="tax-engine")
        assert total > 0
        assert all(r.service == "tax-engine" for r in results)

    def test_query_logs_by_level(self, logs_engine):
        results, total = logs_engine.query(level="ERROR")
        assert total > 0
        assert all(r.level.value == "ERROR" for r in results)

    def test_query_logs_pagination(self, logs_engine):
        page1, total = logs_engine.query(page=1, limit=5)
        assert len(page1) <= 5
        page2, _ = logs_engine.query(page=2, limit=5)
        assert total > 0
        if len(page1) == 5:
            assert len(page2) > 0
            assert page1[0].id != page2[0].id

    def test_get_log_by_id(self, logs_engine):
        entry = logs_engine.get(list(logs_engine._logs.keys())[0])
        assert entry is not None
        assert entry.id is not None

    def test_get_log_not_found(self, logs_engine):
        entry = logs_engine.get("non-existent-id")
        assert entry is None

    def test_get_stats(self, logs_engine):
        stats = logs_engine.get_stats()
        assert isinstance(stats, LogStats)
        assert stats.total >= 50
        assert "INFO" in stats.by_level
        assert "ERROR" in stats.by_level
        assert "CRITICAL" in stats.by_level
        assert stats.last_24h > 0
        assert len(stats.by_service) >= 9
        assert len(stats.top_errors) > 0

    def test_search_text(self, logs_engine):
        results = logs_engine.search_text("IVA")
        assert len(results) > 0
        assert all("IVA" in r.message.upper() for r in results)

    def test_error_rate_calculation(self, logs_engine):
        stats = logs_engine.get_stats()
        errors = stats.by_level.get("ERROR", 0)
        criticals = stats.by_level.get("CRITICAL", 0)
        total = stats.total
        error_rate = (errors + criticals) / total * 100 if total > 0 else 0
        assert error_rate > 0
        assert stats.errors_last_hour >= 0
