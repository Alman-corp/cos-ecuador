"""Motor de métricas — contadores, gauges, histogramas y timers en memoria."""

import enum
import math
import uuid
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel


class MetricType(str, enum.Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    TIMER = "timer"


class MetricDatapoint(BaseModel):
    id: str
    metric: str
    type: MetricType
    value: float
    labels: dict = {}
    timestamp: str
    unit: str = ""


class MetricSummary(BaseModel):
    metric: str
    type: str
    current_value: float
    min_24h: float
    max_24h: float
    avg_24h: float
    total_24h: float
    p50: float
    p95: float
    p99: float
    sample_count: int


class MetricsDashboard(BaseModel):
    requests_per_minute: dict
    error_rate_pct: float
    avg_response_time_ms: float
    p95_response_time_ms: float
    active_services: int
    services_with_errors: list[str]
    top_slow_endpoints: list[dict]


NOW = datetime.utcnow()


def _ts(hours_ago: int = 0, minutes_ago: int = 0) -> str:
    dt = NOW - timedelta(hours=hours_ago, minutes=minutes_ago)
    return dt.isoformat()


def _random_between(lo: float, hi: float) -> float:
    import random
    return round(random.uniform(lo, hi), 2)


import random

SAMPLE_DATAPOINTS: list[dict] = []

# --- http_requests_total (counter) — 25 datapoints ---
for i in range(25):
    services = ["tax-engine", "command-center", "clients", "public-api", "finance", "documents", "security", "ai-orchestrator", "macro-service"]
    endpoints = [
        "/api/v1/tax/iva/calculate", "/api/v1/tax/iva/form104", "/api/v1/tax/anexos/ats",
        "/api/v1/clients", "/api/v1/clients/{id}", "/api/v1/finance/invoices",
        "/api/v1/documents/generate", "/api/v1/security/auth/login",
        "/api/v1/observability/logs", "/api/v1/observability/metrics",
        "/api/v1/ai/nowcast", "/api/v1/macro/indicators",
    ]
    svc = services[i % len(services)]
    ep = endpoints[i % len(endpoints)]
    base_count = 500 if "tax" in svc or "public" in svc else 150
    SAMPLE_DATAPOINTS.append({
        "metric": "http_requests_total", "type": "counter",
        "value": float(random.randint(base_count - 50, base_count + 200)),
        "labels": {"service": svc, "endpoint": ep, "status": random.choice(["200", "200", "200", "201", "400", "500"])},
        "timestamp": _ts(random.randint(0, 23), random.randint(0, 59)),
        "unit": "requests",
    })

# --- http_request_duration_ms (timer) — 25 datapoints ---
for i in range(25):
    endpoints = [
        "/api/v1/tax/iva/calculate", "/api/v1/tax/iva/form104", "/api/v1/tax/anexos/ats",
        "/api/v1/clients", "/api/v1/finance/invoices", "/api/v1/documents/generate",
        "/api/v1/security/auth/login", "/api/v1/ai/nowcast", "/api/v1/macro/indicators",
    ]
    is_slow = i in (3, 7, 11, 15, 19)
    dur = random.uniform(500, 2000) if is_slow else random.uniform(15, 350)
    ep = endpoints[i % len(endpoints)]
    svc = ["tax-engine", "command-center", "clients", "public-api", "finance", "documents", "security", "ai-orchestrator", "macro-service"][i % 9]
    SAMPLE_DATAPOINTS.append({
        "metric": "http_request_duration_ms", "type": "timer",
        "value": round(dur, 1),
        "labels": {"service": svc, "endpoint": ep, "method": random.choice(["GET", "POST", "PUT", "DELETE"])},
        "timestamp": _ts(random.randint(0, 23), random.randint(0, 59)),
        "unit": "ms",
    })

# --- http_errors_total (counter) — 15 datapoints ---
error_types = ["database_timeout", "validation_error", "sri_unreachable", "auth_denied", "payment_failed", "rate_limited", "not_found"]
for i in range(15):
    svc = ["tax-engine", "tax-engine", "command-center", "clients", "finance", "public-api", "security", "ai-orchestrator", "documents", "macro-service", "tax-engine", "command-center", "clients", "public-api", "finance"][i]
    SAMPLE_DATAPOINTS.append({
        "metric": "http_errors_total", "type": "counter",
        "value": float(random.randint(1, 25)),
        "labels": {"service": svc, "error_type": error_types[i % len(error_types)], "severity": random.choice(["warning", "error", "critical"])},
        "timestamp": _ts(random.randint(0, 23), random.randint(0, 59)),
        "unit": "errors",
    })

# --- active_users (gauge) — 10 datapoints ---
for hour_offset in range(0, 24, 2):
    is_business_hours = 8 <= (NOW.hour - hour_offset) % 24 <= 18
    count = random.randint(5, 15) if is_business_hours else random.randint(1, 3)
    SAMPLE_DATAPOINTS.append({
        "metric": "active_users", "type": "gauge",
        "value": float(count),
        "labels": {},
        "timestamp": _ts(hour_offset, 0),
        "unit": "users",
    })

# --- active_services (gauge) — 6 datapoints ---
for i in range(6):
    SAMPLE_DATAPOINTS.append({
        "metric": "active_services", "type": "gauge",
        "value": float(random.randint(7, 9)),
        "labels": {},
        "timestamp": _ts(i * 4, 0),
        "unit": "services",
    })

# --- queue_depth (gauge) — 8 datapoints ---
for i in range(8):
    SAMPLE_DATAPOINTS.append({
        "metric": "queue_depth", "type": "gauge",
        "value": float(random.randint(0, 50)),
        "labels": {"queue": random.choice(["ats_generation", "invoice_batch", "email_notifications", "webhook_delivery"])},
        "timestamp": _ts(random.randint(0, 23), random.randint(0, 59)),
        "unit": "items",
    })

# --- db_connections (gauge) — 6 datapoints ---
for i in range(6):
    SAMPLE_DATAPOINTS.append({
        "metric": "db_connections", "type": "gauge",
        "value": float(random.randint(5, 45)),
        "labels": {"db": random.choice(["postgres-main", "postgres-analytics", "redis-cache"])},
        "timestamp": _ts(i * 4, 0),
        "unit": "connections",
    })

# --- memory_usage_mb (gauge) — 8 datapoints ---
for i in range(8):
    svc = ["tax-engine", "command-center", "ai-orchestrator", "macro-service", "public-api", "finance", "documents", "security"][i]
    SAMPLE_DATAPOINTS.append({
        "metric": "memory_usage_mb", "type": "gauge",
        "value": float(random.randint(120, 2048)),
        "labels": {"service": svc},
        "timestamp": _ts(random.randint(0, 23), random.randint(0, 59)),
        "unit": "MB",
    })


class MetricsEngine:
    """Motor de métricas en memoria con agregaciones y estadísticas."""

    def __init__(self):
        self._datapoints: list[MetricDatapoint] = []
        self._populate_samples()

    def _populate_samples(self):
        for dp in SAMPLE_DATAPOINTS:
            self._datapoints.append(MetricDatapoint(
                id=str(uuid.uuid4()),
                metric=dp["metric"],
                type=MetricType(dp["type"]),
                value=dp["value"],
                labels=dp.get("labels", {}),
                timestamp=dp["timestamp"],
                unit=dp.get("unit", ""),
            ))

    def record(self, metric: str, type_: MetricType, value: float, labels: dict = None, unit: str = "") -> MetricDatapoint:
        dp = MetricDatapoint(
            id=str(uuid.uuid4()),
            metric=metric,
            type=type_,
            value=value,
            labels=labels or {},
            timestamp=datetime.utcnow().isoformat(),
            unit=unit,
        )
        self._datapoints.append(dp)
        return dp

    def query(self, metric: str, start: Optional[str] = None, end: Optional[str] = None, aggregation: Optional[str] = None) -> list[dict]:
        results = [dp for dp in self._datapoints if dp.metric == metric]
        if start:
            start_dt = datetime.fromisoformat(start)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) >= start_dt]
        if end:
            end_dt = datetime.fromisoformat(end)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) <= end_dt]
        results.sort(key=lambda r: r.timestamp)

        if aggregation == "avg":
            if not results:
                return []
            avg = sum(r.value for r in results) / len(results)
            return [{"metric": metric, "aggregation": "avg", "value": round(avg, 2), "count": len(results)}]
        elif aggregation == "sum":
            total = sum(r.value for r in results)
            return [{"metric": metric, "aggregation": "sum", "value": round(total, 2), "count": len(results)}]
        elif aggregation == "min":
            if not results:
                return []
            return [{"metric": metric, "aggregation": "min", "value": min(r.value for r in results), "count": len(results)}]
        elif aggregation == "max":
            if not results:
                return []
            return [{"metric": metric, "aggregation": "max", "value": max(r.value for r in results), "count": len(results)}]
        else:
            return [r.model_dump() for r in results]

    def get_families(self) -> list[str]:
        return list(dict.fromkeys(dp.metric for dp in self._datapoints))

    def get_dashboard(self) -> MetricsDashboard:
        now_ts = datetime.utcnow().isoformat()
        day_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()

        request_dps = [dp for dp in self._datapoints if dp.metric == "http_requests_total"]
        duration_dps = [dp for dp in self._datapoints if dp.metric == "http_request_duration_ms"]
        error_dps = [dp for dp in self._datapoints if dp.metric == "http_errors_total"]
        active_svc_dps = [dp for dp in self._datapoints if dp.metric == "active_services"]

        total_requests = sum(dp.value for dp in request_dps)
        total_errors = sum(dp.value for dp in error_dps)
        error_rate = (total_errors / total_requests * 100) if total_requests > 0 else 0.0

        durations = [dp.value for dp in duration_dps]
        avg_duration = sum(durations) / len(durations) if durations else 0.0
        p95 = self._percentile(durations, 95) if durations else 0.0

        active_services = int(active_svc_dps[-1].value) if active_svc_dps else 0

        svcs_with_errors = list(set(
            dp.labels.get("service", "unknown") for dp in error_dps
        ))

        slow_endpoints: dict[str, list[float]] = {}
        for dp in duration_dps:
            ep = dp.labels.get("endpoint", "unknown")
            if ep not in slow_endpoints:
                slow_endpoints[ep] = []
            slow_endpoints[ep].append(dp.value)
        top_slow = sorted(
            [{"endpoint": ep, "avg_ms": round(sum(vals) / len(vals), 1), "samples": len(vals)}
             for ep, vals in slow_endpoints.items()],
            key=lambda x: x["avg_ms"], reverse=True
        )[:5]

        rpm: dict[str, float] = {}
        for dp in request_dps:
            svc = dp.labels.get("service", "unknown")
            rpm[svc] = rpm.get(svc, 0) + dp.value

        return MetricsDashboard(
            requests_per_minute={k: round(v, 1) for k, v in rpm.items()},
            error_rate_pct=round(error_rate, 2),
            avg_response_time_ms=round(avg_duration, 1),
            p95_response_time_ms=round(p95, 1),
            active_services=active_services,
            services_with_errors=svcs_with_errors,
            top_slow_endpoints=top_slow,
        )

    def get_health(self) -> dict:
        day_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()

        all_svcs = set()
        error_rates: dict[str, dict] = {}
        for dp in self._datapoints:
            svc = dp.labels.get("service", "unknown")
            all_svcs.add(svc)
            if svc not in error_rates:
                error_rates[svc] = {"requests": 0, "errors": 0, "avg_duration_ms": 0.0, "durations": []}
            if dp.metric == "http_requests_total":
                error_rates[svc]["requests"] += dp.value
            elif dp.metric == "http_errors_total":
                error_rates[svc]["errors"] += dp.value
            elif dp.metric == "http_request_duration_ms":
                error_rates[svc]["durations"].append(dp.value)

        services_health = {}
        for svc in sorted(all_svcs):
            data = error_rates[svc]
            reqs = data["requests"]
            errs = data["errors"]
            err_pct = round((errs / reqs * 100) if reqs > 0 else 0.0, 2)
            durations = data["durations"]
            avg_dur = round(sum(durations) / len(durations), 1) if durations else 0.0
            status = "healthy" if err_pct < 1 else ("degraded" if err_pct < 5 else "unhealthy")
            services_health[svc] = {
                "status": status,
                "error_rate_pct": err_pct,
                "avg_response_time_ms": avg_dur,
                "total_requests": int(reqs),
                "total_errors": int(errs),
            }

        return {
            "overall_status": "healthy" if all(s["status"] == "healthy" for s in services_health.values()) else "degraded",
            "services": services_health,
            "last_updated": datetime.utcnow().isoformat(),
        }

    def get_summary(self, metric: str) -> MetricSummary:
        dps = [dp for dp in self._datapoints if dp.metric == metric]
        if not dps:
            return MetricSummary(
                metric=metric, type="unknown", current_value=0.0,
                min_24h=0.0, max_24h=0.0, avg_24h=0.0, total_24h=0.0,
                p50=0.0, p95=0.0, p99=0.0, sample_count=0,
            )
        values = [dp.value for dp in dps]
        current = dps[-1].value
        return MetricSummary(
            metric=metric,
            type=dps[0].type.value,
            current_value=current,
            min_24h=min(values),
            max_24h=max(values),
            avg_24h=round(sum(values) / len(values), 2),
            total_24h=round(sum(values), 2),
            p50=self._percentile(values, 50),
            p95=self._percentile(values, 95),
            p99=self._percentile(values, 99),
            sample_count=len(values),
        )

    def _percentile(self, values: list[float], percentile: int) -> float:
        if not values:
            return 0.0
        sorted_vals = sorted(values)
        k = (percentile / 100.0) * (len(sorted_vals) - 1)
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return round(sorted_vals[int(k)], 2)
        return round(sorted_vals[f] * (c - k) + sorted_vals[c] * (k - f), 2)
