"""PortfolioEngine — Segments, Retention, Geography and Growth analysis."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel
from .clients_engine import ClientsEngine


class SegmentAnalysis(BaseModel):
    segment: str
    count: int
    mrr_total: float
    avg_arpu: float
    churn_rate: float
    total_billed: float


class RetentionAnalysis(BaseModel):
    cohort_month: str
    clients_start: int
    retained_1m: float
    retained_3m: float
    retained_6m: float
    retained_12m: float
    avg_lifetime_months: float


class GeographyDistribution(BaseModel):
    province: str
    count: int
    mrr: float
    pct_clients: float


class GrowthTrend(BaseModel):
    month: str
    new_clients: int
    churned_clients: int
    total_active: int
    mrr_added: float
    mrr_lost: float
    net_mrr_change: float


class PortfolioEngine:
    """Portfolio analysis engine operating on the ClientsEngine data store."""

    def __init__(self, engine: ClientsEngine):
        self._engine = engine

    # ---------- Segments ----------

    def get_segments(self) -> list[SegmentAnalysis]:
        clients = list(self._engine._clients.values())
        segments: dict[str, list[dict]] = {}
        for c in clients:
            seg = c["segment"]
            segments.setdefault(seg, []).append(c)

        result = []
        for seg_name, seg_clients in segments.items():
            active_in_seg = [c for c in seg_clients if c["status"] == "active"]
            client_ids = {c["id"] for c in seg_clients}
            contracts = [ct for ct in self._engine._contracts.values() if ct["client_id"] in client_ids and ct["status"] == "active"]
            mrr_total = sum(c["monthly_value"] for c in contracts)
            total_billed = sum(c.get("total_billed", 0) for c in seg_clients)
            churned = len([c for c in seg_clients if c["status"] == "churned"])
            total_seg = len(seg_clients)
            churn_rate = churned / total_seg if total_seg else 0
            active_count = len(active_in_seg)
            avg_arpu = mrr_total / active_count if active_count else 0
            result.append(SegmentAnalysis(
                segment=seg_name,
                count=total_seg,
                mrr_total=round(mrr_total, 2),
                avg_arpu=round(avg_arpu, 2),
                churn_rate=round(churn_rate, 4),
                total_billed=round(total_billed, 2),
            ))
        return result

    # ---------- Retention ----------

    def get_retention(self) -> list[RetentionAnalysis]:
        clients = list(self._engine._clients.values())
        contracts = list(self._engine._contracts.values())

        cohort_map: dict[str, set[str]] = {}
        for c in clients:
            created = c["created_at"][:7]
            cohort_map.setdefault(created, set()).add(c["id"])

        now = "2026-07"
        result = []
        for cohort_month in sorted(cohort_map.keys()):
            cohort_ids = cohort_map[cohort_month]
            start_count = len(cohort_ids)

            retained_1m = 0
            retained_3m = 0
            retained_6m = 0
            retained_12m = 0

            for cid in cohort_ids:
                client_contracts = [ct for ct in contracts if ct["client_id"] == cid and ct["status"] in ("active", "completed", "cancelled")]
                if not client_contracts:
                    continue
                latest_end = max(
                    (ct.get("end_date") or now) for ct in client_contracts
                )
                if latest_end >= _add_months(cohort_month, 1):
                    retained_1m += 1
                if latest_end >= _add_months(cohort_month, 3):
                    retained_3m += 1
                if latest_end >= _add_months(cohort_month, 6):
                    retained_6m += 1
                if latest_end >= _add_months(cohort_month, 12):
                    retained_12m += 1

            avg_lifetime = 0
            if start_count:
                total_months = 0
                for cid in cohort_ids:
                    client_contracts = [ct for ct in contracts if ct["client_id"] == cid and ct["status"] in ("active", "completed", "cancelled")]
                    if client_contracts:
                        latest = max(ct.get("end_date") or now for ct in client_contracts)
                        start = cohort_month
                        total_months += max(0, _month_diff(start, latest))
                avg_lifetime = round(total_months / start_count, 1) if start_count else 0

            result.append(RetentionAnalysis(
                cohort_month=cohort_month,
                clients_start=start_count,
                retained_1m=round(retained_1m / start_count * 100, 1) if start_count else 0,
                retained_3m=round(retained_3m / start_count * 100, 1) if start_count else 0,
                retained_6m=round(retained_6m / start_count * 100, 1) if start_count else 0,
                retained_12m=round(retained_12m / start_count * 100, 1) if start_count else 0,
                avg_lifetime_months=avg_lifetime,
            ))
        return result

    # ---------- Geography ----------

    def get_geography(self) -> list[GeographyDistribution]:
        clients = list(self._engine._clients.values())
        total = len(clients) or 1
        geo: dict[str, dict] = {}
        for c in clients:
            prov = c.get("address", {}).get("province", "Desconocida")
            if prov not in geo:
                geo[prov] = {"count": 0, "mrr": 0.0}
            geo[prov]["count"] += 1
            geo[prov]["mrr"] += c.get("mrr", 0)
        result = []
        for prov, data in geo.items():
            result.append(GeographyDistribution(
                province=prov,
                count=data["count"],
                mrr=round(data["mrr"], 2),
                pct_clients=round(data["count"] / total * 100, 1),
            ))
        return sorted(result, key=lambda x: x.count, reverse=True)

    # ---------- Growth ----------

    def get_growth(self) -> list[GrowthTrend]:
        clients = list(self._engine._clients.values())
        contracts = list(self._engine._contracts.values())
        history = self._engine._history

        months: dict[str, dict] = {}
        for c in clients:
            created_month = c["created_at"][:7]
            months.setdefault(created_month, {"new": 0, "churned": 0, "mrr_added": 0.0, "mrr_lost": 0.0})

        for c in clients:
            created_month = c["created_at"][:7]
            months[created_month]["new"] += 1
            client_contracts = [ct for ct in contracts if ct["client_id"] == c["id"] and ct["status"] == "active"]
            mrr_added = sum(ct["monthly_value"] for ct in client_contracts)
            months[created_month]["mrr_added"] += mrr_added

        for h in history:
            if h["event_type"] == "status_change" and h.get("metadata", {}).get("new_status") in ("inactive", "churned"):
                churn_month = h["created_at"][:7]
                months.setdefault(churn_month, {"new": 0, "churned": 0, "mrr_added": 0.0, "mrr_lost": 0.0})
                months[churn_month]["churned"] += 1
                cid = h["client_id"]
                client_contracts = [ct for ct in contracts if ct["client_id"] == cid and ct["status"] in ("cancelled",)]
                mrr_lost = sum(ct["monthly_value"] for ct in client_contracts if ct["status"] == "cancelled")
                months[churn_month]["mrr_lost"] += mrr_lost

        running_active = 0
        result = []
        for month in sorted(months.keys()):
            data = months[month]
            running_active += data["new"] - data["churned"]
            net_mrr = data["mrr_added"] - data["mrr_lost"]
            result.append(GrowthTrend(
                month=month,
                new_clients=data["new"],
                churned_clients=data["churned"],
                total_active=running_active,
                mrr_added=round(data["mrr_added"], 2),
                mrr_lost=round(data["mrr_lost"], 2),
                net_mrr_change=round(net_mrr, 2),
            ))
        return result


def _add_months(ym: str, n: int) -> str:
    year, month = int(ym[:4]), int(ym[5:7])
    month += n
    while month > 12:
        year += 1
        month -= 12
    while month < 1:
        year -= 1
        month += 12
    return f"{year:04d}-{month:02d}"


def _month_diff(start: str, end: str) -> int:
    sy, sm = int(start[:4]), int(start[5:7])
    ey, em = int(end[:4]), int(end[5:7])
    return (ey - sy) * 12 + (em - sm)
