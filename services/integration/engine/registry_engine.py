from datetime import datetime, timezone
from typing import Optional, Literal
from pydantic import BaseModel

SERVICE_REGISTRY = [
    {
        "id": "tax-engine",
        "name": "Tax Engine",
        "description": "Servicio de Cálculos Tributarios Ecuatorianos — IVA, Retenciones, Renta, ICE, ATS, SRI",
        "version": "1.0.0",
        "url": "http://localhost:8001",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "tributario"],
        "dependencies": [],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/tax/iva/calculate", "method": "POST", "description": "Calcular IVA mensual"},
            {"path": "/api/v1/tax/iva/form104", "method": "POST", "description": "Generar Formulario 104"},
            {"path": "/api/v1/tax/iva/rates", "method": "GET", "description": "Tarifas IVA vigentes"},
            {"path": "/api/v1/tax/renta/calculate", "method": "POST", "description": "Calcular Impuesto a la Renta"},
            {"path": "/api/v1/tax/retenciones/calculate", "method": "POST", "description": "Calcular Retenciones en la Fuente"},
        ],
    },
    {
        "id": "macro-service",
        "name": "Macro Service",
        "description": "Servicio de cálculos macroeconómicos y variables agregadas del Ecuador",
        "version": "1.0.0",
        "url": "http://localhost:8002",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "macro"],
        "dependencies": [],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/macro/indicators", "method": "GET", "description": "Indicadores macroeconómicos"},
            {"path": "/api/v1/macro/pib", "method": "GET", "description": "Producto Interno Bruto"},
            {"path": "/api/v1/macro/inflacion", "method": "GET", "description": "Tasa de inflación"},
            {"path": "/api/v1/macro/empleo", "method": "GET", "description": "Indicadores de empleo"},
        ],
    },
    {
        "id": "finance",
        "name": "Finance Service",
        "description": "Servicio financiero — contabilidad, presupuestos, cuentas por cobrar/pagar",
        "version": "1.0.0",
        "url": "http://localhost:8003",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "financiero"],
        "dependencies": [],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/finance/accounts", "method": "GET", "description": "Listar cuentas contables"},
            {"path": "/api/v1/finance/transactions", "method": "POST", "description": "Registrar transacción"},
            {"path": "/api/v1/finance/budget", "method": "GET", "description": "Obtener presupuesto"},
            {"path": "/api/v1/finance/reports/balance", "method": "GET", "description": "Balance general"},
        ],
    },
    {
        "id": "clients",
        "name": "Clients Service",
        "description": "Gestión de clientes, contribuyentes RUC, datos maestros",
        "version": "1.0.0",
        "url": "http://localhost:8004",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "clientes"],
        "dependencies": [],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/clients", "method": "GET", "description": "Listar clientes"},
            {"path": "/api/v1/clients/{id}", "method": "GET", "description": "Detalle de cliente"},
            {"path": "/api/v1/clients/{id}/ruc", "method": "GET", "description": "Información RUC"},
            {"path": "/api/v1/clients/search", "method": "GET", "description": "Buscar contribuyentes"},
        ],
    },
    {
        "id": "documents",
        "name": "Documents Service",
        "description": "Gestión documental — comprobantes electrónicos, facturas, retenciones, guías",
        "version": "1.0.0",
        "url": "http://localhost:8005",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "documentos"],
        "dependencies": [],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/documents/invoices", "method": "POST", "description": "Emitir factura electrónica"},
            {"path": "/api/v1/documents/retentions", "method": "POST", "description": "Emitir retención electrónica"},
            {"path": "/api/v1/documents/debit-notes", "method": "POST", "description": "Nota de débito"},
            {"path": "/api/v1/documents/credit-notes", "method": "POST", "description": "Nota de crédito"},
        ],
    },
    {
        "id": "disaster-recovery",
        "name": "DR Service",
        "description": "Disaster Recovery — respaldos, replicación, planes de contingencia",
        "version": "1.0.0",
        "url": "http://localhost:8006",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["infra", "dr"],
        "dependencies": ["tax-engine", "finance", "clients", "documents", "macro-service"],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/dr/backup", "method": "POST", "description": "Iniciar respaldo"},
            {"path": "/api/v1/dr/restore", "method": "POST", "description": "Restaurar desde respaldo"},
            {"path": "/api/v1/dr/status", "method": "GET", "description": "Estado del DR"},
            {"path": "/api/v1/dr/replication", "method": "GET", "description": "Estado de replicación"},
        ],
    },
    {
        "id": "plugin-registry",
        "name": "Plugin Registry",
        "description": "Marketplace de plugins — registro, versionado, dependencias de módulos",
        "version": "1.0.0",
        "url": "http://localhost:8007",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["marketplace"],
        "dependencies": ["clients"],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/plugins", "method": "GET", "description": "Listar plugins"},
            {"path": "/api/v1/plugins/install", "method": "POST", "description": "Instalar plugin"},
            {"path": "/api/v1/plugins/{id}", "method": "DELETE", "description": "Desinstalar plugin"},
            {"path": "/api/v1/plugins/versions", "method": "GET", "description": "Versiones disponibles"},
        ],
    },
    {
        "id": "public-api",
        "name": "Public API v2",
        "description": "API Gateway público — exposición unificada de servicios externos con rate limiting y auth",
        "version": "2.0.0",
        "url": "http://localhost:8008",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["api", "gateway"],
        "dependencies": ["tax-engine", "clients", "documents", "finance"],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v2/public/tax/iva", "method": "POST", "description": "Cálculo de IVA público"},
            {"path": "/api/v2/public/clients", "method": "GET", "description": "Consulta de clientes"},
            {"path": "/api/v2/public/documents/invoices", "method": "POST", "description": "Emisión de facturas"},
            {"path": "/api/v2/public/finance/reports", "method": "GET", "description": "Reportes financieros"},
            {"path": "/api/v2/public/health", "method": "GET", "description": "Health check público"},
        ],
    },
    {
        "id": "ai-orchestrator",
        "name": "AI Orchestrator",
        "description": "Orquestador de inteligencia artificial — análisis predictivo, NLP tributario, detección de anomalías",
        "version": "1.0.0",
        "url": "http://localhost:8009",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "ia"],
        "dependencies": ["macro-service", "documents", "clients"],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/ai/predict/tax", "method": "POST", "description": "Predicción de impuestos"},
            {"path": "/api/v1/ai/analyze/document", "method": "POST", "description": "Análisis de documento"},
            {"path": "/api/v1/ai/anomalies", "method": "GET", "description": "Detección de anomalías"},
            {"path": "/api/v1/ai/nlp/query", "method": "POST", "description": "Consulta NLP tributaria"},
        ],
    },
    {
        "id": "analytics-advanced",
        "name": "Analytics Advanced",
        "description": "Analítica avanzada — dashboards, forecasting, segmentación, data mining",
        "version": "1.0.0",
        "url": "http://localhost:8010",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "analitica"],
        "dependencies": ["finance", "clients"],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/analytics/dashboard", "method": "GET", "description": "Dashboard analítico"},
            {"path": "/api/v1/analytics/forecast", "method": "POST", "description": "Pronóstico financiero"},
            {"path": "/api/v1/analytics/segmentation", "method": "POST", "description": "Segmentación de clientes"},
            {"path": "/api/v1/analytics/reports", "method": "GET", "description": "Reportes personalizados"},
            {"path": "/api/v1/analytics/trends", "method": "GET", "description": "Tendencias"},
        ],
    },
    {
        "id": "security",
        "name": "Security Service",
        "description": "Servicio de seguridad — autenticación, autorización, OAuth2, JWT, MFA",
        "version": "1.0.0",
        "url": "http://localhost:8011",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["infra", "seguridad"],
        "dependencies": ["clients"],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/security/auth/login", "method": "POST", "description": "Inicio de sesión"},
            {"path": "/api/v1/security/auth/register", "method": "POST", "description": "Registro de usuario"},
            {"path": "/api/v1/security/auth/refresh", "method": "POST", "description": "Refrescar token"},
            {"path": "/api/v1/security/mfa/setup", "method": "POST", "description": "Configurar MFA"},
            {"path": "/api/v1/security/permissions", "method": "GET", "description": "Permisos de usuario"},
        ],
    },
    {
        "id": "bi",
        "name": "BI Service",
        "description": "Business Intelligence — reporting consolidado, cubos OLAP, exportación de datos",
        "version": "1.0.0",
        "url": "http://localhost:8012",
        "health_url": "/health",
        "api_docs_url": "/docs",
        "status": "registered",
        "tags": ["core", "bi"],
        "dependencies": ["finance", "clients", "analytics-advanced"],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/bi/reports", "method": "GET", "description": "Reportes BI"},
            {"path": "/api/v1/bi/dashboard", "method": "GET", "description": "Dashboard BI"},
            {"path": "/api/v1/bi/export", "method": "POST", "description": "Exportar datos"},
            {"path": "/api/v1/bi/cubes", "method": "GET", "description": "Cubos OLAP"},
        ],
    },
]


class ServiceRegistration(BaseModel):
    id: str
    name: str
    description: str
    version: str
    url: str
    health_url: str = "/health"
    api_docs_url: Optional[str] = "/docs"
    status: Literal["registered", "unreachable", "deprecated"] = "registered"
    tags: list[str] = []
    dependencies: list[str] = []
    registered_at: str
    last_heartbeat: Optional[str] = None
    endpoints: list[dict] = []


class RegistrySummary(BaseModel):
    total_services: int
    by_status: dict[str, int]
    by_tag: dict[str, int]


class RegistryEngine:
    def __init__(self):
        self._registry = {s["id"]: dict(s) for s in SERVICE_REGISTRY}

    def register(self, data: dict) -> dict:
        service_id = data["id"]
        now = datetime.now(timezone.utc).isoformat()
        if service_id in self._registry:
            existing = self._registry[service_id]
            existing.update(data)
            existing["status"] = data.get("status", existing.get("status", "registered"))
            return existing
        data.setdefault("status", "registered")
        data["registered_at"] = now
        data["last_heartbeat"] = None
        self._registry[service_id] = data
        return data

    def get_service(self, service_id: str) -> Optional[dict]:
        return self._registry.get(service_id)

    def get_all(self) -> list[dict]:
        return list(self._registry.values())

    def unregister(self, service_id: str) -> Optional[dict]:
        service = self._registry.get(service_id)
        if service:
            service["status"] = "deprecated"
        return service

    def get_endpoints(self) -> list[dict]:
        result = []
        for svc in self._registry.values():
            for ep in svc.get("endpoints", []):
                result.append({
                    "service_id": svc["id"],
                    "service_name": svc["name"],
                    **ep,
                })
        return result

    def get_graph(self) -> list[dict]:
        edges = []
        for svc in self._registry.values():
            for dep_id in svc.get("dependencies", []):
                edges.append({
                    "from": svc["id"],
                    "to": dep_id,
                    "type": "depends_on",
                })
        return edges

    def get_summary(self) -> RegistrySummary:
        by_status = {}
        by_tag = {}
        for svc in self._registry.values():
            s = svc["status"]
            by_status[s] = by_status.get(s, 0) + 1
            for tag in svc.get("tags", []):
                by_tag[tag] = by_tag.get(tag, 0) + 1
        return RegistrySummary(
            total_services=len(self._registry),
            by_status=by_status,
            by_tag=by_tag,
        )

    def heartbeat(self, service_id: str) -> Optional[dict]:
        service = self._registry.get(service_id)
        if service:
            service["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
        return service
