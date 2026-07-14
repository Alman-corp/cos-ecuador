import random
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal
from pydantic import BaseModel


class HealthCheckResult(BaseModel):
    service_id: str
    service_name: str
    status: Literal["healthy", "degraded", "unreachable"]
    response_time_ms: int
    checked_at: str
    error: Optional[str] = None
    details: dict = {}


class HealthSummary(BaseModel):
    total: int
    healthy: int
    degraded: int
    unreachable: int
    overall: Literal["healthy", "degraded", "down"]
    last_updated: str


# Deterministic health profiles for each service
HEALTH_PROFILES = {
    "tax-engine": {"base_ms": 8, "jitter": 7, "fail_rate": 0.0, "degrade_rate": 0.0},
    "macro-service": {"base_ms": 25, "jitter": 20, "fail_rate": 0.0, "degrade_rate": 0.02},
    "finance": {"base_ms": 12, "jitter": 8, "fail_rate": 0.0, "degrade_rate": 0.01},
    "clients": {"base_ms": 20, "jitter": 10, "fail_rate": 0.0, "degrade_rate": 0.01},
    "documents": {"base_ms": 28, "jitter": 12, "fail_rate": 0.0, "degrade_rate": 0.02},
    "disaster-recovery": {"base_ms": 85, "jitter": 35, "fail_rate": 0.0, "degrade_rate": 0.03},
    "plugin-registry": {"base_ms": 18, "jitter": 7, "fail_rate": 0.0, "degrade_rate": 0.01},
    "public-api": {"base_ms": 110, "jitter": 90, "fail_rate": 0.02, "degrade_rate": 0.08},
    "ai-orchestrator": {"base_ms": 55, "jitter": 25, "fail_rate": 0.0, "degrade_rate": 0.02},
    "analytics-advanced": {"base_ms": 95, "jitter": 55, "fail_rate": 0.01, "degrade_rate": 0.06},
    "security": {"base_ms": 10, "jitter": 5, "fail_rate": 0.0, "degrade_rate": 0.0},
    "bi": {"base_ms": 40, "jitter": 20, "fail_rate": 0.0, "degrade_rate": 0.02},
}


def _simulate_health_check(service_id: str, service_name: str) -> HealthCheckResult:
    profile = HEALTH_PROFILES.get(service_id, {"base_ms": 50, "jitter": 30, "fail_rate": 0.05, "degrade_rate": 0.05})
    now = datetime.now(timezone.utc).isoformat()
    roll = random.random()
    response_time = profile["base_ms"] + random.randint(-profile["jitter"], profile["jitter"])
    response_time = max(1, response_time)

    if roll < profile["fail_rate"]:
        return HealthCheckResult(
            service_id=service_id,
            service_name=service_name,
            status="unreachable",
            response_time_ms=response_time,
            checked_at=now,
            error="Connection refused",
            details={},
        )
    elif roll < profile["fail_rate"] + profile["degrade_rate"]:
        return HealthCheckResult(
            service_id=service_id,
            service_name=service_name,
            status="degraded",
            response_time_ms=response_time,
            checked_at=now,
            details={"warning": "High response time", "threshold_ms": 100},
        )
    else:
        return HealthCheckResult(
            service_id=service_id,
            service_name=service_name,
            status="healthy",
            response_time_ms=response_time,
            checked_at=now,
            details={},
        )


def _generate_sample_history() -> list[dict]:
    now = datetime.now(timezone.utc)
    history = []
    deterministic_states = {
        "tax-engine": {"offset": 0, "pattern": ["healthy"]},
        "macro-service": {"offset": 0, "pattern": ["healthy"]},
        "finance": {"offset": 0, "pattern": ["healthy"]},
        "clients": {"offset": 0, "pattern": ["healthy"]},
        "documents": {"offset": 0, "pattern": ["healthy"]},
        "disaster-recovery": {"offset": 0, "pattern": ["healthy"]},
        "plugin-registry": {"offset": 0, "pattern": ["healthy"]},
        "public-api": {"offset": 0, "pattern": ["healthy", "healthy", "degraded", "healthy"]},
        "ai-orchestrator": {"offset": 0, "pattern": ["healthy"]},
        "analytics-advanced": {"offset": 0, "pattern": ["healthy", "healthy", "degraded"]},
        "security": {"offset": 0, "pattern": ["healthy"]},
        "bi": {"offset": 0, "pattern": ["healthy"]},
    }
    base_ms_map = {sid: p["base_ms"] for sid, p in HEALTH_PROFILES.items()}

    for i in range(40):
        ts = now - timedelta(hours=24 - i * 0.6)
        for sid, state in deterministic_states.items():
            pattern = state["pattern"]
            idx = (i + state["offset"]) % len(pattern)
            status = pattern[idx]
            entry = {
                "service_id": sid,
                "service_name": next(
                    (s["name"] for s in _all_services() if s["id"] == sid), sid
                ),
                "status": status,
                "response_time_ms": base_ms_map.get(sid, 50) + random.randint(-10, 20),
                "checked_at": ts.isoformat(),
                "error": None if status != "unreachable" else "Simulated outage",
                "details": {},
            }
            entry["response_time_ms"] = max(1, entry["response_time_ms"])
            history.append(entry)
    return history


def _all_services():
    from .registry_engine import SERVICE_REGISTRY
    return SERVICE_REGISTRY


class HealthEngine:
    def __init__(self):
        self._history: list[dict] = _generate_sample_history()

    def aggregate_health(self, registry: list[dict]) -> list[HealthCheckResult]:
        results = []
        for svc in registry:
            result = _simulate_health_check(svc["id"], svc["name"])
            results.append(result)
            self._history.append(result.model_dump())
        return results

    def get_service_health(self, service_id: str) -> Optional[HealthCheckResult]:
        profile = HEALTH_PROFILES.get(service_id)
        if profile is None:
            return None
        name_map = {s["id"]: s["name"] for s in _all_services()}
        return _simulate_health_check(service_id, name_map.get(service_id, service_id))

    def get_summary(self) -> HealthSummary:
        results = self.aggregate_health(_all_services())
        total = len(results)
        healthy = sum(1 for r in results if r.status == "healthy")
        degraded = sum(1 for r in results if r.status == "degraded")
        unreachable = sum(1 for r in results if r.status == "unreachable")
        if unreachable > 0:
            overall = "down"
        elif degraded > 0:
            overall = "degraded"
        else:
            overall = "healthy"
        return HealthSummary(
            total=total,
            healthy=healthy,
            degraded=degraded,
            unreachable=unreachable,
            overall=overall,
            last_updated=datetime.now(timezone.utc).isoformat(),
        )

    def get_history(self, hours: int = 24) -> list[dict]:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        return [h for h in self._history if h["checked_at"] >= cutoff.isoformat()]
