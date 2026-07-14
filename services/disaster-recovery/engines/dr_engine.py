"""Motor de Disaster Recovery — Failover, Failback, Backups, Drills, RTO/RPO."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Literal
from pydantic import BaseModel, Field
from enum import Enum
from copy import deepcopy
import uuid


class RegionZone(BaseModel):
    region: str
    zone: str
    status: Literal["active", "standby", "degraded", "down"]
    cpu: float
    memory: float
    services: list[str]


class ServiceStatus(BaseModel):
    name: str
    primary_region: str
    standby_region: Optional[str]
    status: Literal["healthy", "degraded", "down", "failed_over"]
    rto_seconds: int
    rpo_seconds: int
    last_backup: Optional[str]
    failover_count: int = 0
    last_failover: Optional[str]


class FailoverRequest(BaseModel):
    target_region: str
    target_zone: str
    reason: str
    estimated_downtime_seconds: int


class FailoverResult(BaseModel):
    service: str
    source: str
    target: str
    status: Literal["completed", "failed", "in_progress"]
    downtime_seconds: int
    data_loss_seconds: int
    timestamp: str
    details: str


class BackupInfo(BaseModel):
    id: str
    service: str
    type: Literal["full", "incremental", "differential"]
    size_gb: float
    status: Literal["completed", "in_progress", "failed"]
    started_at: str
    completed_at: Optional[str]
    location: str
    verified: bool
    retention_days: int


class DRDrill(BaseModel):
    id: str
    drill_type: Literal["failover", "backup_restore", "network_partition", "data_corruption", "full_outage"]
    status: Literal["planned", "in_progress", "completed", "failed"]
    services_involved: list[str]
    scheduled_at: str
    completed_at: Optional[str]
    results: Optional[str]
    lessons_learned: Optional[str]
    rto_achieved_seconds: Optional[int]
    rpo_achieved_seconds: Optional[int]


class DRReadinessReport(BaseModel):
    overall_status: Literal["green", "yellow", "red"]
    services: list[ServiceStatus]
    active_regions: list[str]
    total_backups: int
    verified_backups: int
    last_drill: Optional[str]
    next_scheduled_drill: Optional[str]
    gaps: list[str]
    recommendations: list[str]
    overall_rto_compliance: float
    overall_rpo_compliance: float


SERVICE_NAMES = [
    "tax-engine",
    "ai-orchestrator",
    "data-platform",
    "analytics-advanced",
    "bi",
    "command-center",
]

DEFAULT_SERVICES = [
    ServiceStatus(
        name="tax-engine",
        primary_region="us-east-1",
        standby_region="sa-east-1",
        status="healthy",
        rto_seconds=60,
        rpo_seconds=30,
        last_backup="2026-07-12T23:00:00Z",
        failover_count=2,
        last_failover="2026-06-15T14:30:00Z",
    ),
    ServiceStatus(
        name="ai-orchestrator",
        primary_region="us-east-1",
        standby_region="sa-east-1",
        status="healthy",
        rto_seconds=120,
        rpo_seconds=60,
        last_backup="2026-07-12T22:30:00Z",
        failover_count=1,
        last_failover="2026-05-20T09:15:00Z",
    ),
    ServiceStatus(
        name="data-platform",
        primary_region="us-east-1",
        standby_region="sa-east-1",
        status="healthy",
        rto_seconds=180,
        rpo_seconds=300,
        last_backup="2026-07-12T21:00:00Z",
        failover_count=0,
        last_failover=None,
    ),
    ServiceStatus(
        name="analytics-advanced",
        primary_region="us-east-1",
        standby_region="eu-west-1",
        status="degraded",
        rto_seconds=300,
        rpo_seconds=600,
        last_backup="2026-07-11T18:00:00Z",
        failover_count=1,
        last_failover="2026-04-10T11:00:00Z",
    ),
    ServiceStatus(
        name="bi",
        primary_region="us-east-1",
        standby_region="eu-west-1",
        status="healthy",
        rto_seconds=120,
        rpo_seconds=120,
        last_backup="2026-07-12T20:00:00Z",
        failover_count=0,
        last_failover=None,
    ),
    ServiceStatus(
        name="command-center",
        primary_region="us-east-1",
        standby_region="sa-east-1",
        status="healthy",
        rto_seconds=300,
        rpo_seconds=600,
        last_backup="2026-07-12T23:30:00Z",
        failover_count=3,
        last_failover="2026-07-01T08:00:00Z",
    ),
]

DEFAULT_REGIONS: Dict[str, list[RegionZone]] = {
    "us-east-1": [
        RegionZone(
            region="us-east-1", zone="a", status="active", cpu=62.5, memory=71.2,
            services=["tax-engine", "ai-orchestrator", "data-platform", "analytics-advanced", "bi", "command-center"],
        ),
        RegionZone(
            region="us-east-1", zone="b", status="active", cpu=55.8, memory=68.4,
            services=["tax-engine", "ai-orchestrator", "data-platform", "bi", "command-center"],
        ),
        RegionZone(
            region="us-east-1", zone="c", status="active", cpu=48.3, memory=59.7,
            services=["tax-engine", "ai-orchestrator", "command-center"],
        ),
    ],
    "sa-east-1": [
        RegionZone(
            region="sa-east-1", zone="a", status="standby", cpu=18.2, memory=22.6,
            services=["tax-engine", "ai-orchestrator", "data-platform", "command-center"],
        ),
        RegionZone(
            region="sa-east-1", zone="b", status="standby", cpu=12.7, memory=15.3,
            services=["tax-engine", "ai-orchestrator", "command-center"],
        ),
    ],
    "eu-west-1": [
        RegionZone(
            region="eu-west-1", zone="a", status="standby", cpu=9.4, memory=11.8,
            services=["analytics-advanced", "bi"],
        ),
        RegionZone(
            region="eu-west-1", zone="b", status="standby", cpu=6.1, memory=8.2,
            services=["analytics-advanced"],
        ),
    ],
}

DEFAULT_BACKUPS: Dict[str, list[BackupInfo]] = {
    "tax-engine": [
        BackupInfo(id="bkp-te-001", service="tax-engine", type="full", size_gb=12.5, status="completed",
                   started_at="2026-07-12T23:00:00Z", completed_at="2026-07-12T23:12:30Z",
                   location="s3://cos-backups/tax-engine/full/20260712", verified=True, retention_days=90),
        BackupInfo(id="bkp-te-002", service="tax-engine", type="incremental", size_gb=2.1, status="completed",
                   started_at="2026-07-12T06:00:00Z", completed_at="2026-07-12T06:04:15Z",
                   location="s3://cos-backups/tax-engine/inc/20260712", verified=True, retention_days=30),
        BackupInfo(id="bkp-te-003", service="tax-engine", type="incremental", size_gb=1.8, status="completed",
                   started_at="2026-07-11T06:00:00Z", completed_at="2026-07-11T06:03:50Z",
                   location="s3://cos-backups/tax-engine/inc/20260711", verified=True, retention_days=30),
        BackupInfo(id="bkp-te-004", service="tax-engine", type="differential", size_gb=5.3, status="completed",
                   started_at="2026-07-10T23:00:00Z", completed_at="2026-07-10T23:08:20Z",
                   location="s3://cos-backups/tax-engine/diff/20260710", verified=True, retention_days=60),
        BackupInfo(id="bkp-te-005", service="tax-engine", type="full", size_gb=11.9, status="completed",
                   started_at="2026-07-05T23:00:00Z", completed_at="2026-07-05T23:11:45Z",
                   location="s3://cos-backups/tax-engine/full/20260705", verified=True, retention_days=90),
    ],
    "ai-orchestrator": [
        BackupInfo(id="bkp-ai-001", service="ai-orchestrator", type="full", size_gb=28.3, status="completed",
                   started_at="2026-07-12T22:30:00Z", completed_at="2026-07-12T22:55:10Z",
                   location="s3://cos-backups/ai-orchestrator/full/20260712", verified=True, retention_days=90),
        BackupInfo(id="bkp-ai-002", service="ai-orchestrator", type="incremental", size_gb=4.7, status="completed",
                   started_at="2026-07-12T06:30:00Z", completed_at="2026-07-12T06:37:20Z",
                   location="s3://cos-backups/ai-orchestrator/inc/20260712", verified=True, retention_days=30),
        BackupInfo(id="bkp-ai-003", service="ai-orchestrator", type="incremental", size_gb=5.1, status="completed",
                   started_at="2026-07-11T06:30:00Z", completed_at="2026-07-11T06:38:05Z",
                   location="s3://cos-backups/ai-orchestrator/inc/20260711", verified=True, retention_days=30),
    ],
    "data-platform": [
        BackupInfo(id="bkp-dp-001", service="data-platform", type="full", size_gb=156.2, status="completed",
                   started_at="2026-07-12T21:00:00Z", completed_at="2026-07-12T22:15:30Z",
                   location="s3://cos-backups/data-platform/full/20260712", verified=True, retention_days=90),
        BackupInfo(id="bkp-dp-002", service="data-platform", type="incremental", size_gb=12.8, status="completed",
                   started_at="2026-07-12T06:00:00Z", completed_at="2026-07-12T06:20:10Z",
                   location="s3://cos-backups/data-platform/inc/20260712", verified=False, retention_days=30),
        BackupInfo(id="bkp-dp-003", service="data-platform", type="differential", size_gb=45.6, status="completed",
                   started_at="2026-07-11T21:00:00Z", completed_at="2026-07-11T21:40:00Z",
                   location="s3://cos-backups/data-platform/diff/20260711", verified=True, retention_days=60),
        BackupInfo(id="bkp-dp-004", service="data-platform", type="incremental", size_gb=11.3, status="failed",
                   started_at="2026-07-11T06:00:00Z", completed_at=None,
                   location="s3://cos-backups/data-platform/inc/20260711", verified=False, retention_days=30),
    ],
    "analytics-advanced": [
        BackupInfo(id="bkp-aa-001", service="analytics-advanced", type="full", size_gb=89.1, status="completed",
                   started_at="2026-07-11T18:00:00Z", completed_at="2026-07-11T19:05:20Z",
                   location="s3://cos-backups/analytics-advanced/full/20260711", verified=True, retention_days=90),
        BackupInfo(id="bkp-aa-002", service="analytics-advanced", type="incremental", size_gb=7.4, status="completed",
                   started_at="2026-07-11T06:00:00Z", completed_at="2026-07-11T06:12:45Z",
                   location="s3://cos-backups/analytics-advanced/inc/20260711", verified=True, retention_days=30),
        BackupInfo(id="bkp-aa-003", service="analytics-advanced", type="incremental", size_gb=8.2, status="completed",
                   started_at="2026-07-10T06:00:00Z", completed_at="2026-07-10T06:14:10Z",
                   location="s3://cos-backups/analytics-advanced/inc/20260710", verified=False, retention_days=30),
    ],
    "bi": [
        BackupInfo(id="bkp-bi-001", service="bi", type="full", size_gb=34.7, status="completed",
                   started_at="2026-07-12T20:00:00Z", completed_at="2026-07-12T20:25:30Z",
                   location="s3://cos-backups/bi/full/20260712", verified=True, retention_days=90),
        BackupInfo(id="bkp-bi-002", service="bi", type="incremental", size_gb=3.9, status="completed",
                   started_at="2026-07-12T06:00:00Z", completed_at="2026-07-12T06:05:55Z",
                   location="s3://cos-backups/bi/inc/20260712", verified=True, retention_days=30),
        BackupInfo(id="bkp-bi-003", service="bi", type="differential", size_gb=12.1, status="completed",
                   started_at="2026-07-11T20:00:00Z", completed_at="2026-07-11T20:18:40Z",
                   location="s3://cos-backups/bi/diff/20260711", verified=True, retention_days=60),
        BackupInfo(id="bkp-bi-004", service="bi", type="full", size_gb=33.2, status="completed",
                   started_at="2026-07-05T20:00:00Z", completed_at="2026-07-05T20:24:10Z",
                   location="s3://cos-backups/bi/full/20260705", verified=True, retention_days=90),
    ],
    "command-center": [
        BackupInfo(id="bkp-cc-001", service="command-center", type="full", size_gb=8.9, status="completed",
                   started_at="2026-07-12T23:30:00Z", completed_at="2026-07-12T23:38:20Z",
                   location="s3://cos-backups/command-center/full/20260712", verified=True, retention_days=90),
        BackupInfo(id="bkp-cc-002", service="command-center", type="incremental", size_gb=1.2, status="completed",
                   started_at="2026-07-12T06:00:00Z", completed_at="2026-07-12T06:02:10Z",
                   location="s3://cos-backups/command-center/inc/20260712", verified=True, retention_days=30),
        BackupInfo(id="bkp-cc-003", service="command-center", type="incremental", size_gb=1.0, status="completed",
                   started_at="2026-07-11T06:00:00Z", completed_at="2026-07-11T06:01:45Z",
                   location="s3://cos-backups/command-center/inc/20260711", verified=True, retention_days=30),
        BackupInfo(id="bkp-cc-004", service="command-center", type="differential", size_gb=3.4, status="completed",
                   started_at="2026-07-10T23:30:00Z", completed_at="2026-07-10T23:35:00Z",
                   location="s3://cos-backups/command-center/diff/20260710", verified=True, retention_days=60),
        BackupInfo(id="bkp-cc-005", service="command-center", type="full", size_gb=8.5, status="completed",
                   started_at="2026-07-05T23:30:00Z", completed_at="2026-07-05T23:37:50Z",
                   location="s3://cos-backups/command-center/full/20260705", verified=True, retention_days=90),
    ],
}

DEFAULT_DRILLS: list[DRDrill] = [
    DRDrill(
        id="drill-001",
        drill_type="failover",
        status="completed",
        services_involved=["tax-engine", "command-center"],
        scheduled_at="2026-06-15T14:00:00Z",
        completed_at="2026-06-15T14:45:00Z",
        results="Failover exitoso. tax-engine recuperado en 52s, command-center en 85s. Sin pérdida de datos.",
        lessons_learned="Mejorar tiempos de detección de fallos. Implementar health checks más frecuentes.",
        rto_achieved_seconds=52,
        rpo_achieved_seconds=5,
    ),
    DRDrill(
        id="drill-002",
        drill_type="backup_restore",
        status="completed",
        services_involved=["data-platform"],
        scheduled_at="2026-05-10T10:00:00Z",
        completed_at="2026-05-10T12:30:00Z",
        results="Restauración completa de data-platform desde backup full. 156GB restaurados en 2h 15m. Verificación de integridad OK.",
        lessons_learned="Optimizar throughput de restauración. Considerar restauración paralela por shard.",
        rto_achieved_seconds=8100,
        rpo_achieved_seconds=0,
    ),
    DRDrill(
        id="drill-003",
        drill_type="network_partition",
        status="completed",
        services_involved=["ai-orchestrator", "bi"],
        scheduled_at="2026-04-10T10:30:00Z",
        completed_at="2026-04-10T11:15:00Z",
        results="Simulación de partición de red en us-east-1. ai-orchestrator failover a sa-east-1 en 95s. bi failover a eu-west-1 en 110s.",
        lessons_learned="Actualizar configuración de timeouts en balanceadores. Agregar redundancia de DNS.",
        rto_achieved_seconds=110,
        rpo_achieved_seconds=30,
    ),
    DRDrill(
        id="drill-004",
        drill_type="full_outage",
        status="failed",
        services_involved=["analytics-advanced"],
        scheduled_at="2026-03-05T08:00:00Z",
        completed_at="2026-03-05T09:30:00Z",
        results="Fallo en failover de analytics-advanced. El standby en eu-west-1 no pudo asumir la carga por capacidad insuficiente.",
        lessons_learned="Ampliar capacidad del cluster standby en eu-west-1. Revisar política de auto-scaling.",
        rto_achieved_seconds=None,
        rpo_achieved_seconds=None,
    ),
]


class DREngine:
    """Motor principal de Disaster Recovery con datos simulados realistas."""

    def __init__(self):
        self._services: Dict[str, ServiceStatus] = {s.name: s for s in DEFAULT_SERVICES}
        self._regions: Dict[str, list[RegionZone]] = deepcopy(DEFAULT_REGIONS)
        self._backups: Dict[str, list[BackupInfo]] = deepcopy(DEFAULT_BACKUPS)
        self._drills: list[DRDrill] = deepcopy(DEFAULT_DRILLS)
        self._rto_compliance: Dict[str, float] = {
            "tax-engine": 99.2,
            "ai-orchestrator": 96.8,
            "data-platform": 85.4,
            "analytics-advanced": 75.1,
            "bi": 91.5,
            "command-center": 98.7,
        }
        self._rpo_compliance: Dict[str, float] = {
            "tax-engine": 98.5,
            "ai-orchestrator": 95.2,
            "data-platform": 82.3,
            "analytics-advanced": 72.8,
            "bi": 89.4,
            "command-center": 97.1,
        }

    def _compute_overall_status(self) -> str:
        total = len(self._services)
        total_backups = sum(len(b) for b in self._backups.values())
        verified = sum(
            sum(1 for b in blist if b.verified) for blist in self._backups.values()
        )
        verify_rate = (verified / total_backups * 100) if total_backups > 0 else 0
        avg_compliance = (
            sum(self._rto_compliance.get(s, 0) for s in self._services)
            + sum(self._rpo_compliance.get(s, 0) for s in self._services)
        ) / (total * 2) if total > 0 else 0
        if verify_rate >= 90 and avg_compliance >= 90:
            return "green"
        elif verify_rate >= 70 and avg_compliance >= 70:
            return "yellow"
        return "red"

    def get_readiness(self) -> DRReadinessReport:
        services_list = list(self._services.values())
        total_backups = sum(len(b) for b in self._backups.values())
        verified = sum(
            sum(1 for b in blist if b.verified) for blist in self._backups.values()
        )
        completed_drills = [d for d in self._drills if d.status == "completed"]
        last_drill = max(
            (d.completed_at for d in completed_drills if d.completed_at), default=None
        )
        next_drill = "2026-08-01T14:00:00Z"
        gaps = []
        recommendations = []
        svc_aa = self._services.get("analytics-advanced")
        if svc_aa and svc_aa.status != "healthy":
            gaps.append("analytics-advanced degraded - standby capacity insuficiente en eu-west-1")
            recommendations.append("Ampliar capacidad del cluster standby de analytics-advanced en eu-west-1")
        if self._rto_compliance.get("analytics-advanced", 100) < 80:
            gaps.append("RTO compliance de analytics-advanced por debajo del 80%")
            recommendations.append("Revisar procedimientos de failover para analytics-advanced")
        unverified = sum(
            sum(1 for b in blist if not b.verified) for blist in self._backups.values()
        )
        if unverified > 2:
            gaps.append(f"{unverified} backups sin verificar requieren atención")
            recommendations.append("Programar verificación de backups pendientes")
        svc_dp = self._services.get("data-platform")
        if svc_dp and svc_dp.failover_count == 0:
            gaps.append("data-platform nunca ha sido sometido a failover")
            recommendations.append("Programar drill de failover para data-platform")
        rto_vals = [self._rto_compliance.get(s, 0) for s in self._services]
        rpo_vals = [self._rpo_compliance.get(s, 0) for s in self._services]
        overall_rto = sum(rto_vals) / len(rto_vals) if rto_vals else 0
        overall_rpo = sum(rpo_vals) / len(rpo_vals) if rpo_vals else 0
        return DRReadinessReport(
            overall_status=self._compute_overall_status(),
            services=services_list,
            active_regions=list(self._regions.keys()),
            total_backups=total_backups,
            verified_backups=verified,
            last_drill=last_drill,
            next_scheduled_drill=next_drill,
            gaps=gaps,
            recommendations=recommendations,
            overall_rto_compliance=round(overall_rto, 1),
            overall_rpo_compliance=round(overall_rpo, 1),
        )

    def get_regions(self) -> Dict[str, list[RegionZone]]:
        return self._regions

    def failover(self, service_name: str, request: FailoverRequest) -> FailoverResult:
        if service_name not in self._services:
            raise ValueError(f"Servicio '{service_name}' no encontrado")
        service = self._services[service_name]
        source = f"{service.primary_region}"
        target = f"{request.target_region}-{request.target_zone}"
        if request.target_region not in self._regions:
            raise ValueError(f"Región objetivo '{request.target_region}' no encontrada")
        zone_found = any(
            z.zone == request.target_zone and z.region == request.target_region
            for z in self._regions[request.target_region]
        )
        if not zone_found:
            raise ValueError(f"Zona '{request.target_zone}' no encontrada en '{request.target_region}'")
        downtime = request.estimated_downtime_seconds
        data_loss = max(0, downtime - service.rpo_seconds) if downtime > service.rpo_seconds else 0
        if downtime < service.rto_seconds:
            status = "completed"
            details = f"Failover exitoso. Servicio '{service_name}' migrado a {target}. Downtime: {downtime}s dentro del RTO de {service.rto_seconds}s."
            self._services[service_name].status = "failed_over"
            self._services[service_name].failover_count += 1
            self._services[service_name].last_failover = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            for zone in self._regions.get(request.target_region, []):
                if service_name not in zone.services and zone.status != "down":
                    zone.services.append(service_name)
        else:
            status = "failed"
            details = f"Failover excedió RTO. Tiempo estimado: {downtime}s vs RTO: {service.rto_seconds}s."
        return FailoverResult(
            service=service_name,
            source=source,
            target=target,
            status=status,
            downtime_seconds=downtime,
            data_loss_seconds=data_loss,
            timestamp=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            details=details,
        )

    def failback(self, service_name: str) -> FailoverResult:
        if service_name not in self._services:
            raise ValueError(f"Servicio '{service_name}' no encontrado")
        service = self._services[service_name]
        if service.status != "failed_over":
            raise ValueError(f"El servicio '{service_name}' no está en estado failed_over")
        source = f"{service.primary_region}"
        target = f"{service.primary_region}"
        service.status = "healthy"
        service.failover_count += 1
        service.last_failover = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        return FailoverResult(
            service=service_name,
            source=source,
            target=target,
            status="completed",
            downtime_seconds=30,
            data_loss_seconds=0,
            timestamp=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            details=f"Failback completado. Servicio '{service_name}' retornado a {target}. Sin pérdida de datos.",
        )

    def get_backups(self, service_name: str) -> list[BackupInfo]:
        if service_name not in self._backups:
            raise ValueError(f"Servicio '{service_name}' no encontrado")
        return self._backups[service_name]

    def trigger_backup(self, service_name: str) -> BackupInfo:
        if service_name not in self._backups:
            raise ValueError(f"Servicio '{service_name}' no encontrado")
        backup_id = f"bkp-{service_name[:2].lower()}-{uuid.uuid4().hex[:6]}"
        new_backup = BackupInfo(
            id=backup_id,
            service=service_name,
            type="full",
            size_gb=round(10 + (hash(service_name) % 200) / 10, 1),
            status="in_progress",
            started_at=datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            completed_at=None,
            location=f"s3://cos-backups/{service_name}/full/{datetime.utcnow().strftime('%Y%m%d')}",
            verified=False,
            retention_days=90,
        )
        self._backups[service_name].append(new_backup)
        import threading
        def complete_backup():
            import time
            time.sleep(2)
            for b in self._backups.get(service_name, []):
                if b.id == backup_id:
                    b.status = "completed"
                    b.completed_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
                    b.verified = True
        t = threading.Thread(target=complete_backup, daemon=True)
        t.start()
        return new_backup

    def get_drills(self) -> list[DRDrill]:
        return self._drills

    def execute_drill(self, drill: DRDrill) -> DRDrill:
        for s in drill.services_involved:
            if s not in self._services:
                raise ValueError(f"Servicio '{s}' no encontrado en el inventario")
        drill.id = f"drill-{uuid.uuid4().hex[:6]}"
        drill.status = "in_progress"
        drill.scheduled_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        self._drills.append(drill)
        import threading
        def complete_drill():
            import time
            time.sleep(2)
            for d in self._drills:
                if d.id == drill.id:
                    d.status = "completed"
                    d.completed_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
                    simulated_rto = max(30, min(300, len(d.services_involved) * 45))
                    d.rto_achieved_seconds = simulated_rto
                    d.rpo_achieved_seconds = max(0, simulated_rto - 60)
                    d.results = (
                        f"Drill '{d.drill_type}' ejecutado en {len(d.services_involved)} servicios. "
                        f"RTO alcanzado: {simulated_rto}s. "
                        f"RPO alcanzado: {d.rpo_achieved_seconds}s."
                    )
                    d.lessons_learned = "Monitorear tiempos de conmutación. Revisar dependencias entre servicios."
                    if d.drill_type == "failover" and d.services_involved == ["data-platform"]:
                        d.status = "failed"
                        d.results = "Fallo controlado: el failover de data-platform excedió la ventana de RTO."
                        d.rto_achieved_seconds = 300
                        d.rpo_achieved_seconds = 120
        t = threading.Thread(target=complete_drill, daemon=True)
        t.start()
        return drill

    def get_rto(self, service_name: str) -> Dict:
        if service_name not in self._services:
            raise ValueError(f"Servicio '{service_name}' no encontrado")
        service = self._services[service_name]
        compliance = self._rto_compliance.get(service_name, 0)
        completed_drills = [
            d for d in self._drills
            if service_name in d.services_involved and d.rto_achieved_seconds is not None
        ]
        best_rto = min((d.rto_achieved_seconds for d in completed_drills), default=None)
        worst_rto = max((d.rto_achieved_seconds for d in completed_drills), default=None)
        return {
            "service": service_name,
            "rto_seconds": service.rto_seconds,
            "compliance_pct": compliance,
            "best_achieved_seconds": best_rto,
            "worst_achieved_seconds": worst_rto,
            "drill_count": len(completed_drills),
            "status": "within_sla" if compliance >= 95 else "at_risk" if compliance >= 80 else "breach",
        }

    def get_rpo(self, service_name: str) -> Dict:
        if service_name not in self._services:
            raise ValueError(f"Servicio '{service_name}' no encontrado")
        service = self._services[service_name]
        compliance = self._rpo_compliance.get(service_name, 0)
        completed_drills = [
            d for d in self._drills
            if service_name in d.services_involved and d.rpo_achieved_seconds is not None
        ]
        best_rpo = min((d.rpo_achieved_seconds for d in completed_drills), default=None)
        worst_rpo = max((d.rpo_achieved_seconds for d in completed_drills), default=None)
        return {
            "service": service_name,
            "rpo_seconds": service.rpo_seconds,
            "compliance_pct": compliance,
            "best_achieved_seconds": best_rpo,
            "worst_achieved_seconds": worst_rpo,
            "drill_count": len(completed_drills),
            "status": "within_sla" if compliance >= 95 else "at_risk" if compliance >= 80 else "breach",
        }
