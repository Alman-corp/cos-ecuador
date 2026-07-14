"""Motor de auditoría — registro de acciones, consulta y resúmenes."""

import enum
import uuid
from datetime import datetime, timedelta
from typing import Literal, Optional
from pydantic import BaseModel


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    EXPORT = "EXPORT"
    IMPORT = "IMPORT"
    CONFIGURE = "CONFIGURE"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"


class AuditEntry(BaseModel):
    id: str
    timestamp: str
    actor: str
    actor_type: Literal["user", "api_key", "system"] = "user"
    action: AuditAction
    resource_type: str
    resource_id: str
    resource_name: str = ""
    details: str = ""
    changes: dict = {}
    ip_address: str = ""
    user_agent: str = ""
    correlation_id: Optional[str] = None
    service: str
    outcome: Literal["success", "failure", "pending"] = "success"


class AuditSummary(BaseModel):
    total_entries: int
    by_action: dict[str, int]
    by_resource: dict[str, int]
    by_actor: dict[str, int]
    by_service: dict[str, int]
    failures_last_24h: int
    recent_actors: list[str]


NOW = datetime.utcnow()


def _ts(hours_ago: int = 0, minutes_ago: int = 0) -> str:
    dt = NOW - timedelta(hours=hours_ago, minutes=minutes_ago)
    return dt.isoformat()


SAMPLE_AUDIT_ENTRIES: list[dict] = [
    # CREATE (8)
    {"actor": "María López", "actor_type": "user", "action": "CREATE", "resource_type": "client", "resource_id": "CLI-1042",
     "resource_name": "Corporación Eléctrica del Ecuador", "details": "Creación de nuevo cliente corporativo",
     "ip_address": "192.168.1.50", "service": "clients", "outcome": "success", "timestamp": _ts(0, 5)},
    {"actor": "Carlos Mendoza", "actor_type": "user", "action": "CREATE", "resource_type": "contract", "resource_id": "CTR-2026-00142",
     "resource_name": "Consultoría Tributaria Anual", "details": "Creación de contrato de consultoría tributaria",
     "ip_address": "192.168.1.75", "service": "documents", "outcome": "success", "timestamp": _ts(0, 15)},
    {"actor": "Sistema", "actor_type": "system", "action": "CREATE", "resource_type": "invoice", "resource_id": "INV-001-001-000000042",
     "resource_name": "Factura TechSolutions EC", "details": "Generación automática de factura mensual",
     "service": "finance", "outcome": "success", "timestamp": _ts(0, 25)},
    {"actor": "Ana Torres", "actor_type": "user", "action": "CREATE", "resource_type": "report", "resource_id": "RPT-2026-Q2",
     "resource_name": "Reporte Trimestral Q2 2026", "details": "Creación de reporte financiero trimestral",
     "ip_address": "192.168.1.100", "service": "bi", "outcome": "success", "timestamp": _ts(0, 35)},
    {"actor": "Sistema", "actor_type": "system", "action": "CREATE", "resource_type": "backup", "resource_id": "BKP-20260712",
     "resource_name": "Backup diario base de datos", "details": "Ejecución de respaldo automatizado de base de datos",
     "service": "command-center", "outcome": "failure", "timestamp": _ts(1, 0)},
    {"actor": "API Key integracion-001", "actor_type": "api_key", "action": "CREATE", "resource_type": "webhook", "resource_id": "WH-001",
     "resource_name": "Webhook integración SRI", "details": "Registro de webhook para notificaciones SRI",
     "ip_address": "10.0.0.45", "service": "public-api", "outcome": "success", "timestamp": _ts(1, 10)},
    {"actor": "María López", "actor_type": "user", "action": "CREATE", "resource_type": "user", "resource_id": "USR-008",
     "resource_name": "Pedro Gómez", "details": "Creación de usuario junior en el sistema",
     "ip_address": "192.168.1.50", "service": "security", "outcome": "success", "timestamp": _ts(2, 0)},
    {"actor": "Sistema", "actor_type": "system", "action": "CREATE", "resource_type": "tax_return", "resource_id": "F104-2026-06",
     "resource_name": "Formulario 104 Junio 2026", "details": "Generación automática de declaración de IVA",
     "service": "tax-engine", "outcome": "success", "timestamp": _ts(2, 30)},
    # UPDATE (6)
    {"actor": "Carlos Mendoza", "actor_type": "user", "action": "UPDATE", "resource_type": "contract", "resource_id": "CTR-2026-00142",
     "resource_name": "Consultoría Tributaria Anual", "details": "Actualización de valor del contrato",
     "changes": {"valor": {"from": "2500.00", "to": "2800.00"}},
     "ip_address": "192.168.1.75", "service": "documents", "outcome": "success", "timestamp": _ts(0, 20)},
    {"actor": "María López", "actor_type": "user", "action": "UPDATE", "resource_type": "client", "resource_id": "CLI-1042",
     "resource_name": "Corporación Eléctrica del Ecuador", "details": "Actualización de información de contacto",
     "changes": {"email": {"from": "antiguo@electricidad.ec", "to": "contacto@electricidad.ec"}},
     "ip_address": "192.168.1.50", "service": "clients", "outcome": "success", "timestamp": _ts(1, 5)},
    {"actor": "Sistema", "actor_type": "system", "action": "UPDATE", "resource_type": "tax_rate", "resource_id": "IVA-15",
     "resource_name": "Tarifa IVA 15%", "details": "Actualización automática de tarifa IVA post-reforma",
     "changes": {"porcentaje": {"from": "12", "to": "15"}, "fecha_aplicacion": {"from": "", "to": "2025-09-01"}},
     "service": "tax-engine", "outcome": "success", "timestamp": _ts(3, 0)},
    {"actor": "Ana Torres", "actor_type": "user", "action": "UPDATE", "resource_type": "report", "resource_id": "RPT-2026-Q2",
     "resource_name": "Reporte Trimestral Q2 2026", "details": "Corrección de cifras en sección de ingresos",
     "changes": {"ingresos_netos": {"from": "1250000", "to": "1285000"}},
     "ip_address": "192.168.1.100", "service": "bi", "outcome": "success", "timestamp": _ts(3, 30)},
    {"actor": "Carlos Mendoza", "actor_type": "user", "action": "UPDATE", "resource_type": "client", "resource_id": "CLI-1043",
     "resource_name": "TechSolutions EC", "details": "Cambio de tipo de contribuyente de SOCIEDAD a PERSONA_NATURAL",
     "changes": {"tipo_contribuyente": {"from": "SOCIEDAD", "to": "PERSONA_NATURAL"}},
     "ip_address": "192.168.1.75", "service": "clients", "outcome": "success", "timestamp": _ts(4, 0)},
    {"actor": "Sistema", "actor_type": "system", "action": "UPDATE", "resource_type": "config", "resource_id": "CFG-SRI-001",
     "resource_name": "Configuración SRI endpoint", "details": "Actualización de URL del servicio SOAP del SRI",
     "changes": {"soap_url": {"from": "https://sri.gob.ec/soap/antiguo", "to": "https://sri.gob.ec/soap/v2/recepcion"}},
     "service": "tax-engine", "outcome": "success", "timestamp": _ts(4, 30)},
    # READ (5)
    {"actor": "Ana Torres", "actor_type": "user", "action": "READ", "resource_type": "client", "resource_id": "CLI-1042",
     "resource_name": "Corporación Eléctrica del Ecuador", "details": "Consulta de perfil completo del cliente",
     "ip_address": "192.168.1.100", "service": "clients", "outcome": "success", "timestamp": _ts(0, 30)},
    {"actor": "Carlos Mendoza", "actor_type": "user", "action": "READ", "resource_type": "report", "resource_id": "RPT-2026-Q1",
     "resource_name": "Reporte Trimestral Q1 2026", "details": "Descarga de reporte trimestral anterior",
     "ip_address": "192.168.1.75", "service": "bi", "outcome": "success", "timestamp": _ts(1, 45)},
    {"actor": "API Key integracion-001", "actor_type": "api_key", "action": "READ", "resource_type": "tax_return", "resource_id": "F104-2026-05",
     "resource_name": "Formulario 104 Mayo 2026", "details": "Consulta de declaración de IVA vía API",
     "ip_address": "10.0.0.45", "service": "public-api", "outcome": "success", "timestamp": _ts(2, 15)},
    {"actor": "María López", "actor_type": "user", "action": "READ", "resource_type": "audit_log", "resource_id": "AUDIT-LOGS",
     "resource_name": "Registros de auditoría", "details": "Revisión de historial de cambios del sistema",
     "ip_address": "192.168.1.50", "service": "command-center", "outcome": "success", "timestamp": _ts(3, 15)},
    {"actor": "Pedro Gómez", "actor_type": "user", "action": "READ", "resource_type": "invoice", "resource_id": "INV-001-001-000000042",
     "resource_name": "Factura TechSolutions EC", "details": "Visualización de factura emitida",
     "ip_address": "192.168.1.200", "service": "finance", "outcome": "success", "timestamp": _ts(5, 0)},
    # DELETE (2)
    {"actor": "María López", "actor_type": "user", "action": "DELETE", "resource_type": "document", "resource_id": "DOC-TEMP-0042",
     "resource_name": "Borrador Contrato Temporal", "details": "Eliminación de borrador de contrato no utilizado",
     "ip_address": "192.168.1.50", "service": "documents", "outcome": "success", "timestamp": _ts(1, 30)},
    {"actor": "Sistema", "actor_type": "system", "action": "DELETE", "resource_type": "session", "resource_id": "SESS-EXP-20260712",
     "resource_name": "Sesiones expiradas", "details": "Limpieza automática de sesiones caducadas (47 eliminadas)",
     "service": "security", "outcome": "success", "timestamp": _ts(2, 45)},
    # LOGIN (3)
    {"actor": "Ana Torres", "actor_type": "user", "action": "LOGIN", "resource_type": "session", "resource_id": "SESS-ANA-001",
     "resource_name": "Sesión Ana Torres", "details": "Inicio de sesión desde estación de trabajo corporativa",
     "ip_address": "192.168.1.100", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
     "service": "security", "outcome": "success", "timestamp": _ts(0, 2)},
    {"actor": "Pedro Gómez", "actor_type": "user", "action": "LOGIN", "resource_type": "session", "resource_id": "SESS-PEDRO-001",
     "resource_name": "Sesión Pedro Gómez", "details": "Primer inicio de sesión del nuevo usuario",
     "ip_address": "192.168.1.200", "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/122",
     "service": "security", "outcome": "success", "timestamp": _ts(1, 20)},
    {"actor": "Pedro Gómez", "actor_type": "user", "action": "LOGIN", "resource_type": "session", "resource_id": "SESS-PEDRO-002",
     "resource_name": "Sesión Pedro Gómez", "details": "Inicio de sesión desde IP externa",
     "ip_address": "190.12.34.56", "user_agent": "Mozilla/5.0 (Linux; Android 13) SamsungBrowser/20",
     "service": "security", "outcome": "failure", "timestamp": _ts(1, 25)},
    # LOGOUT (1)
    {"actor": "Ana Torres", "actor_type": "user", "action": "LOGOUT", "resource_type": "session", "resource_id": "SESS-ANA-001",
     "resource_name": "Sesión Ana Torres", "details": "Cierre de sesión manual",
     "ip_address": "192.168.1.100", "service": "security", "outcome": "success", "timestamp": _ts(4, 15)},
    # EXPORT (2)
    {"actor": "API Key integracion-001", "actor_type": "api_key", "action": "EXPORT", "resource_type": "tax_return", "resource_id": "IVA-2026-01",
     "resource_name": "Reporte de IVA Enero 2026", "details": "Exportación de reporte de IVA vía API de integración",
     "ip_address": "10.0.0.45", "service": "tax-engine", "outcome": "success", "timestamp": _ts(0, 45)},
    {"actor": "María López", "actor_type": "user", "action": "EXPORT", "resource_type": "client", "resource_id": "CLI-ALL",
     "resource_name": "Listado completo de clientes", "details": "Exportación de base de clientes a Excel",
     "ip_address": "192.168.1.50", "service": "clients", "outcome": "success", "timestamp": _ts(1, 40)},
    # CONFIGURE (2)
    {"actor": "Carlos Mendoza", "actor_type": "user", "action": "CONFIGURE", "resource_type": "config", "resource_id": "CFG-ALERT-001",
     "resource_name": "Configuración de alertas", "details": "Ajuste de umbrales de alerta para monitoreo de servicios",
     "changes": {"threshold_p95": {"from": "500", "to": "1000"}, "threshold_error_rate": {"from": "1", "to": "2"}},
     "ip_address": "192.168.1.75", "service": "command-center", "outcome": "success", "timestamp": _ts(2, 20)},
    {"actor": "Sistema", "actor_type": "system", "action": "CONFIGURE", "resource_type": "config", "resource_id": "CFG-BACKUP-001",
     "resource_name": "Programación de backups", "details": "Cambio de horario de backup automático de 02:00 a 03:00",
     "changes": {"schedule": {"from": "0 2 * * *", "to": "0 3 * * *"}},
     "service": "command-center", "outcome": "success", "timestamp": _ts(5, 30)},
    # PERMISSION_CHANGE (1)
    {"actor": "María López", "actor_type": "user", "action": "PERMISSION_CHANGE", "resource_type": "permission", "resource_id": "USR-007-PERM",
     "resource_name": "Permisos de Carlos Mendoza", "details": "Cambio de rol de consultor a administrador del módulo tributario",
     "changes": {"role": {"from": "consultor", "to": "admin"}, "module": {"from": "", "to": "tax-engine"}},
     "ip_address": "192.168.1.50", "service": "security", "outcome": "success", "timestamp": _ts(0, 50)},
]


class AuditEngine:
    """Motor de auditoría — registro y consulta de eventos auditables."""

    def __init__(self):
        self._entries: dict[str, AuditEntry] = {}
        self._populate_samples()

    def _populate_samples(self):
        for entry in SAMPLE_AUDIT_ENTRIES:
            audit_entry = AuditEntry(
                id=str(uuid.uuid4()),
                timestamp=entry["timestamp"],
                actor=entry["actor"],
                actor_type=entry.get("actor_type", "user"),
                action=AuditAction(entry["action"]),
                resource_type=entry["resource_type"],
                resource_id=entry["resource_id"],
                resource_name=entry.get("resource_name", ""),
                details=entry.get("details", ""),
                changes=entry.get("changes", {}),
                ip_address=entry.get("ip_address", ""),
                user_agent=entry.get("user_agent", ""),
                correlation_id=entry.get("correlation_id"),
                service=entry["service"],
                outcome=entry.get("outcome", "success"),
            )
            self._entries[audit_entry.id] = audit_entry

    def record(self, entry: AuditEntry) -> AuditEntry:
        if not entry.id:
            entry.id = str(uuid.uuid4())
        if not entry.timestamp:
            entry.timestamp = datetime.utcnow().isoformat()
        self._entries[entry.id] = entry
        return entry

    def query(
        self,
        actor: Optional[str] = None,
        action: Optional[str] = None,
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        service: Optional[str] = None,
        start: Optional[str] = None,
        end: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[AuditEntry], int]:
        results = list(self._entries.values())
        if actor:
            results = [r for r in results if actor.lower() in r.actor.lower()]
        if action:
            results = [r for r in results if r.action.value == action.upper()]
        if resource:
            results = [r for r in results if resource.lower() in r.resource_type.lower()]
        if resource_id:
            results = [r for r in results if resource_id.lower() in r.resource_id.lower()]
        if service:
            results = [r for r in results if service.lower() in r.service.lower()]
        if start:
            start_dt = datetime.fromisoformat(start)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) >= start_dt]
        if end:
            end_dt = datetime.fromisoformat(end)
            results = [r for r in results if datetime.fromisoformat(r.timestamp) <= end_dt]
        results.sort(key=lambda r: r.timestamp, reverse=True)
        total = len(results)
        offset = (page - 1) * limit
        return results[offset: offset + limit], total

    def get(self, audit_id: str) -> Optional[AuditEntry]:
        return self._entries.get(audit_id)

    def get_summary(self) -> AuditSummary:
        all_entries = list(self._entries.values())
        by_action: dict[str, int] = {}
        by_resource: dict[str, int] = {}
        by_actor: dict[str, int] = {}
        by_service: dict[str, int] = {}
        failures_last_24h = 0
        cutoff_24h = (datetime.utcnow() - timedelta(hours=24)).isoformat()

        for entry in all_entries:
            by_action[entry.action.value] = by_action.get(entry.action.value, 0) + 1
            by_resource[entry.resource_type] = by_resource.get(entry.resource_type, 0) + 1
            by_actor[entry.actor] = by_actor.get(entry.actor, 0) + 1
            by_service[entry.service] = by_service.get(entry.service, 0) + 1
            if entry.outcome == "failure" and entry.timestamp >= cutoff_24h:
                failures_last_24h += 1

        actor_counts = sorted(by_actor.items(), key=lambda x: x[1], reverse=True)
        recent_actors = [a[0] for a in actor_counts[:10]]

        return AuditSummary(
            total_entries=len(all_entries),
            by_action=by_action,
            by_resource=by_resource,
            by_actor=by_actor,
            by_service=by_service,
            failures_last_24h=failures_last_24h,
            recent_actors=recent_actors,
        )

    def get_by_date_range(self, start: str, end: str) -> list[AuditEntry]:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
        return [r for r in self._entries.values()
                if start_dt <= datetime.fromisoformat(r.timestamp) <= end_dt]
