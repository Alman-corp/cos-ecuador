"""Motor de API — keys, rate limiting, webhooks y simulación de endpoints públicos."""

from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from typing_extensions import Literal

import hashlib
import hmac
import secrets
import bcrypt


SCOPES_AVAILABLE = [
    "tax:read", "tax:write",
    "legal:read", "legal:write",
    "bi:read",
    "client:read", "client:write",
    "document:read", "document:write",
    "admin:keys", "admin:webhooks",
]


class APIKey(BaseModel):
    id: str
    tenant_id: str
    name: str
    key_prefix: str
    key_hash: str
    scopes: list[str]
    rate_limit: int
    status: Literal["active", "revoked", "expired"]
    created_at: str
    expires_at: Optional[str]
    last_used_at: Optional[str]


class APIUsage(BaseModel):
    tenant_id: str
    total_requests: int
    requests_by_endpoint: dict[str, int]
    requests_by_day: dict[str, int]
    current_month_requests: int
    monthly_limit: int
    throttled_count: int
    error_rate: float


class WebhookRegistration(BaseModel):
    id: str
    tenant_id: str
    url: str
    events: list[str]
    secret: str
    status: Literal["active", "paused", "failed"]
    created_at: str
    last_triggered_at: Optional[str]
    failure_count: int
    retry_count: int


class RateLimitStatus(BaseModel):
    tenant_id: str
    limit: int
    remaining: int
    reset_at: str
    current_minute_requests: int


class APICreateKeyRequest(BaseModel):
    tenant_id: str
    name: str
    scopes: list[str]
    rate_limit: int = 60
    expires_in_days: int = 365


DEFAULT_TENANT = "tenant-consultora-demo"

API_KEYS_DATA = [
    APIKey(
        id="key-integracion-001",
        tenant_id=DEFAULT_TENANT,
        name="Integración SRI Automática",
        key_prefix="cos_live_",
        key_hash=bcrypt.hashpw(b"sk_live_placeholder_replace_me", bcrypt.gensalt()).decode(),
        scopes=["tax:read", "tax:write", "sri:read"],
        rate_limit=120,
        status="active",
        created_at="2026-01-10T08:00:00Z",
        expires_at="2027-01-10T08:00:00Z",
        last_used_at="2026-07-12T14:30:00Z",
    ),
    APIKey(
        id="key-portal-002",
        tenant_id=DEFAULT_TENANT,
        name="Portal Clientes - Frontend",
        key_prefix="cos_pub_",
        key_hash=bcrypt.hashpw(b"pk_pub_1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e", bcrypt.gensalt()).decode(),
        scopes=["client:read", "document:read"],
        rate_limit=300,
        status="active",
        created_at="2026-03-15T10:00:00Z",
        expires_at="2027-03-15T10:00:00Z",
        last_used_at="2026-07-13T08:15:00Z",
    ),
    APIKey(
        id="key-admin-003",
        tenant_id=DEFAULT_TENANT,
        name="Admin Dashboard - Reportes",
        key_prefix="cos_admin_",
        key_hash=bcrypt.hashpw(b"sk_admin_9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d", bcrypt.gensalt()).decode(),
        scopes=["bi:read", "admin:keys", "admin:webhooks", "client:read", "tax:read"],
        rate_limit=60,
        status="active",
        created_at="2026-04-01T12:00:00Z",
        expires_at="2027-04-01T12:00:00Z",
        last_used_at="2026-07-12T18:45:00Z",
    ),
    APIKey(
        id="key-revoked-004",
        tenant_id=DEFAULT_TENANT,
        name="Desarrollo Legacy",
        key_prefix="cos_legacy_",
        key_hash=bcrypt.hashpw(b"sk_legacy_0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d", bcrypt.gensalt()).decode(),
        scopes=["tax:read", "legal:read"],
        rate_limit=30,
        status="revoked",
        created_at="2025-06-01T08:00:00Z",
        expires_at="2025-12-01T08:00:00Z",
        last_used_at="2025-11-28T16:00:00Z",
    ),
]

API_USAGE_DATA = APIUsage(
    tenant_id=DEFAULT_TENANT,
    total_requests=28450,
    requests_by_endpoint={
        "/api/v1/tax/iva/calculate": 8250,
        "/api/v1/tax/renta/calculate": 3400,
        "/api/v1/tax/retenciones/calculate": 5100,
        "/api/v1/sri/send-document": 2800,
        "/api/v1/legal/contracts": 1900,
        "/api/v2/status": 3200,
        "/api/v2/keys": 1800,
    },
    requests_by_day={
        "2026-07-01": 420,
        "2026-07-02": 380,
        "2026-07-03": 510,
        "2026-07-04": 120,
        "2026-07-05": 95,
        "2026-07-06": 450,
        "2026-07-07": 490,
        "2026-07-08": 520,
        "2026-07-09": 470,
        "2026-07-10": 530,
        "2026-07-11": 310,
        "2026-07-12": 480,
        "2026-07-13": 215,
    },
    current_month_requests=5490,
    monthly_limit=50000,
    throttled_count=23,
    error_rate=0.018,
)

WEBHOOKS_DATA = [
    WebhookRegistration(
        id="wh-facturas-001",
        tenant_id=DEFAULT_TENANT,
        url="https://hooks.miconsultora.ec/sri/facturas-recibidas",
        events=["sri.document.received", "sri.ats.submitted", "tax.form104.submitted"],
        secret="whsec_f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1",
        status="active",
        created_at="2026-02-01T09:00:00Z",
        last_triggered_at="2026-07-13T07:55:00Z",
        failure_count=2,
        retry_count=5,
    ),
    WebhookRegistration(
        id="wh-clientes-002",
        tenant_id=DEFAULT_TENANT,
        url="https://hooks.miconsultora.ec/crm/clientes-nuevos",
        events=["client.created", "client.updated", "client.deleted"],
        secret="whsec_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
        status="failed",
        created_at="2026-03-10T14:00:00Z",
        last_triggered_at="2026-06-28T11:30:00Z",
        failure_count=12,
        retry_count=8,
    ),
]

RATE_LIMIT_STATUS_DATA = RateLimitStatus(
    tenant_id=DEFAULT_TENANT,
    limit=300,
    remaining=245,
    reset_at=(datetime.utcnow() + timedelta(minutes=1)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    current_minute_requests=55,
)


MOCK_RESPONSES = {
    "GET:/api/v1/tax/iva/calculate": {
        "status": "ok",
        "data": {
            "iva_ventas": 1200.00,
            "iva_compras": 680.00,
            "retefuente": 180.00,
            "iva_a_pagar": 340.00,
            "periodo": "07-2026",
        },
    },
    "GET:/api/v1/tax/renta/calculate": {
        "status": "ok",
        "data": {
            "ingresos_gravados": 85000.00,
            "gastos_deducibles": 42000.00,
            "base_imponible": 43000.00,
            "fraccion_basica": 0.00,
            "impuesto_fraccion_basica": 0.00,
            "impuesto_fraccion_excedente": 3010.00,
            "total_impuesto_renta": 3010.00,
        },
    },
    "GET:/api/v1/sri/ruc/verify": {
        "status": "ok",
        "data": {
            "ruc": "1799999999001",
            "razon_social": "CONSULTORA ECUADOR S.A.",
            "estado": "ACTIVO",
            "obligado_contabilidad": True,
            "fecha_actualizacion": "2026-06-15",
        },
    },
    "GET:/api/v1/legal/contracts": {
        "status": "ok",
        "data": {
            "contracts": [
                {"id": "cnt-001", "tipo": "Prestación de Servicios", "cliente": "Cliente Demo S.A.", "monto": 15000.00, "estado": "VIGENTE"},
                {"id": "cnt-002", "tipo": "Confidencialidad", "cliente": "TechStartup EC", "monto": 0.00, "estado": "VIGENTE"},
            ]
        },
    },
    "GET:/api/v2/status": {
        "status": "ok",
        "service": "Public API v2",
        "version": "2.0.0",
        "uptime_seconds": 15834200,
        "active_keys": 3,
        "requests_today": 215,
    },
    "POST:/api/v2/keys": {
        "status": "ok",
        "data": {
            "id": "key-nueva-005",
            "name": "Nueva API Key",
            "key_prefix": "cos_live_",
            "full_key": "cos_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
            "scopes": ["tax:read", "client:read"],
            "rate_limit": 60,
            "status": "active",
            "created_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "expires_at": (datetime.utcnow() + timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
    },
}


class APIEngine:

    def __init__(self):
        self.keys = API_KEYS_DATA
        self.usage = API_USAGE_DATA
        self.webhooks = WEBHOOKS_DATA
        self.rate_limit = RATE_LIMIT_STATUS_DATA

    def create_key(self, tenant_id: str, request: APICreateKeyRequest) -> dict:
        for scope in request.scopes:
            if scope not in SCOPES_AVAILABLE:
                raise ValueError(f"Scope '{scope}' no es válido. Scopes disponibles: {', '.join(SCOPES_AVAILABLE)}")
        raw_key = f"cos_live_{secrets.token_hex(32)}"
        key_id = f"key-{hashlib.sha256(raw_key.encode()).hexdigest()[:12]}"
        key_hash = bcrypt.hashpw(raw_key.encode(), bcrypt.gensalt()).decode()
        key_prefix = raw_key[:16]
        now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        expires_at = (datetime.utcnow() + timedelta(days=request.expires_in_days)).strftime("%Y-%m-%dT%H:%M:%SZ")
        new_key = APIKey(
            id=key_id,
            tenant_id=tenant_id,
            name=request.name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            scopes=request.scopes,
            rate_limit=request.rate_limit,
            status="active",
            created_at=now,
            expires_at=expires_at,
            last_used_at=None,
        )
        self.keys.append(new_key)
        return {
            "id": key_id,
            "name": request.name,
            "key_prefix": key_prefix,
            "full_key": raw_key,
            "scopes": request.scopes,
            "rate_limit": request.rate_limit,
            "status": "active",
            "created_at": now,
            "expires_at": expires_at,
        }

    def get_key(self, tenant_id: str, key_id: str) -> Optional[APIKey]:
        for k in self.keys:
            if k.id == key_id and k.tenant_id == tenant_id:
                return k
        return None

    def revoke_key(self, tenant_id: str, key_id: str) -> bool:
        for k in self.keys:
            if k.id == key_id and k.tenant_id == tenant_id:
                if k.status == "revoked":
                    raise ValueError(f"La API Key '{key_id}' ya está revocada.")
                k.status = "revoked"
                return True
        raise ValueError(f"API Key '{key_id}' no encontrada.")

    def list_keys(self, tenant_id: str) -> list[APIKey]:
        return [k for k in self.keys if k.tenant_id == tenant_id]

    def get_usage(self, tenant_id: str) -> APIUsage:
        return self.usage

    def register_webhook(self, tenant_id: str, url: str, events: list[str]) -> WebhookRegistration:
        if not url.startswith("https://"):
            raise ValueError("La URL del webhook debe usar HTTPS.")
        secret = f"whsec_{secrets.token_hex(32)}"
        wh_id = f"wh-{hashlib.sha256(f'{tenant_id}{url}{datetime.utcnow()}'.encode()).hexdigest()[:12]}"
        now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        webhook = WebhookRegistration(
            id=wh_id,
            tenant_id=tenant_id,
            url=url,
            events=events,
            secret=secret,
            status="active",
            created_at=now,
            last_triggered_at=None,
            failure_count=0,
            retry_count=0,
        )
        self.webhooks.append(webhook)
        return webhook

    def list_webhooks(self, tenant_id: str) -> list[WebhookRegistration]:
        return [w for w in self.webhooks if w.tenant_id == tenant_id]

    def remove_webhook(self, tenant_id: str, webhook_id: str) -> bool:
        for i, w in enumerate(self.webhooks):
            if w.id == webhook_id and w.tenant_id == tenant_id:
                self.webhooks.pop(i)
                return True
        raise ValueError(f"Webhook '{webhook_id}' no encontrado.")

    def get_rate_limit(self, tenant_id: str) -> RateLimitStatus:
        now = datetime.utcnow()
        if now >= datetime.strptime(self.rate_limit.reset_at, "%Y-%m-%dT%H:%M:%SZ"):
            self.rate_limit.remaining = self.rate_limit.limit
            self.rate_limit.current_minute_requests = 0
            self.rate_limit.reset_at = (now + timedelta(minutes=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
        return self.rate_limit

    def simulate_response(self, endpoint: str, method: str = "GET") -> dict:
        key = f"{method.upper()}:{endpoint}"
        if key in MOCK_RESPONSES:
            return MOCK_RESPONSES[key]
        return {
            "status": "ok",
            "message": f"Respuesta simulada para {method} {endpoint}",
            "endpoint": endpoint,
            "method": method,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
