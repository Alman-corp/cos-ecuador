import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from engines.dr_engine import DREngine, FailoverRequest, DRDrill


@pytest.fixture
def engine():
    return DREngine()


@pytest.fixture
def failover_request():
    return FailoverRequest(
        target_region="sa-east-1",
        target_zone="a",
        reason="Prueba de failover",
        estimated_downtime_seconds=45,
    )


@pytest.fixture
def sample_drill():
    return DRDrill(
        id="",
        drill_type="failover",
        status="planned",
        services_involved=["tax-engine", "bi"],
        scheduled_at="",
        completed_at=None,
        results=None,
        lessons_learned=None,
        rto_achieved_seconds=None,
        rpo_achieved_seconds=None,
    )
