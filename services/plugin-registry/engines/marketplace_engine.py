"""Motor de marketplace — catálogo, instalación, versiones y dependencias de plugins."""

from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from typing_extensions import Literal

import hashlib
import secrets


class PluginCategory(BaseModel):
    id: str
    name: str
    description: str
    icon: str


class PluginVersion(BaseModel):
    version: str
    published_at: str
    changelog: str
    min_app_version: str
    compatible: bool


class PluginManifest(BaseModel):
    id: str
    name: str
    short_description: str
    description: str
    category: str
    author: str
    website: Optional[str]
    license: str
    price_monthly: float
    price_setup: float
    rating: float
    downloads: int
    versions: list[PluginVersion]
    latest_version: str
    tags: list[str]
    screenshots: list[str]
    requirements: list[str]
    permissions: list[str]
    is_featured: bool
    is_verified: bool


class InstalledPlugin(BaseModel):
    id: str
    tenant_id: str
    plugin_id: str
    name: str
    version: str
    status: Literal["active", "disabled", "error"]
    installed_at: str
    updated_at: Optional[str]
    config: dict
    has_update: bool
    latest_version: Optional[str]


class PluginInstallRequest(BaseModel):
    plugin_id: str
    config: dict = {}
    accept_terms: bool = False


CATEGORIES = [
    PluginCategory(id="tributario", name="Tributario", description="Impuestos, SRI, declaraciones y cumplimiento tributario ecuatoriano.", icon="receipt"),
    PluginCategory(id="legal", name="Legal", description="Contratos, documentos legales, firma electrónica y asesoría legal.", icon="gavel"),
    PluginCategory(id="financiero", name="Financiero", description="Cashflow, activos fijos, cobranza y gestión financiera.", icon="account_balance"),
    PluginCategory(id="crm", name="CRM", description="Gestión de clientes, portales de autoservicio y seguimiento.", icon="people"),
    PluginCategory(id="rrhh", name="RRHH", description="Nómina, roles, vacaciones y gestión del talento humano.", icon="badge"),
    PluginCategory(id="analitica", name="Analítica", description="Dashboards, BI, reportes avanzados y exportación de datos.", icon="bar_chart"),
    PluginCategory(id="documentos", name="Documentos", description="OCR, clasificación, almacenamiento y gestión documental.", icon="description"),
    PluginCategory(id="seguridad", name="Seguridad", description="Auditoría, cumplimiento normativo y seguridad de la información.", icon="security"),
]

MARKETPLACE_PLUGINS = [
    PluginManifest(
        id="sri-automation",
        name="Automatización SRI",
        short_description="Automatiza envío de anexos y obtención de comprobantes SRI.",
        description="Plugin integral para automatizar la comunicación con el SRI. Permite el envío masivo de anexos transaccionales (ATS), descarga automática de comprobantes electrónicos, verificación de estados tributarios y generación de reportes de cumplimiento. Compatible con ATS v2.7 y facturación electrónica SRI.",
        category="tributario",
        author="COS Ecuador",
        website="https://cos.ec/plugins/sri-automation",
        license="MIT",
        price_monthly=49.99,
        price_setup=99.00,
        rating=4.8,
        downloads=3200,
        versions=[
            PluginVersion(version="2.1.0", published_at="2026-06-15", changelog="Soporte ATS v2.7. Nuevo módulo de verificación masiva de RUC. Mejoras en cache de comprobantes.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="2.0.0", published_at="2026-03-01", changelog="Migración a API REST SRI. Nuevo dashboard de cumplimiento. Corrección de errores en envío batch.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.5.0", published_at="2025-11-10", changelog="Primera versión estable. Soporte para ATS y facturación electrónica básica.", min_app_version="2.5.0", compatible=False),
        ],
        latest_version="2.1.0",
        tags=["sri", "anexos", "ats", "comprobantes", "facturación", "tributario"],
        screenshots=["https://cos.ec/plugins/sri-automation/screen1.png", "https://cos.ec/plugins/sri-automation/screen2.png"],
        requirements=["core>=3.0.0", "php-curl", "xml-parser"],
        permissions=["sri:read", "sri:write", "tax:read", "client:read"],
        is_featured=True,
        is_verified=True,
    ),
    PluginManifest(
        id="legal-draft",
        name="Redacción Legal IA",
        short_description="Genera contratos y cláusulas con IA entrenada en legislación ecuatoriana.",
        description="Asistente de redacción legal basado en inteligencia artificial, entrenado específicamente con legislación ecuatoriana. Genera contratos de prestación de servicios, confidencialidad, arrendamiento, compraventa y más. Incluye biblioteca de cláusulas personalizables y detector de riesgos legales.",
        category="legal",
        author="LegalTech EC",
        website="https://legaltech.ec",
        license="Proprietary",
        price_monthly=39.99,
        price_setup=149.00,
        rating=4.5,
        downloads=1800,
        versions=[
            PluginVersion(version="1.3.0", published_at="2026-05-20", changelog="Nuevo generador de actas de junta. Mejora en detección de cláusulas abusivas. Integración con Firma Digital EC.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.2.0", published_at="2026-01-15", changelog="Biblioteca de 50+ plantillas. Corrección de errores en generación PDF.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.0.0", published_at="2025-09-01", changelog="Lanzamiento inicial. Generación básica de contratos.", min_app_version="2.5.0", compatible=False),
        ],
        latest_version="1.3.0",
        tags=["legal", "contratos", "ia", "documentos", "cláusulas", "redacción"],
        screenshots=["https://cos.ec/plugins/legal-draft/screen1.png"],
        requirements=["core>=3.0.0", "ai-module>=1.0", "pdf-generator"],
        permissions=["document:write", "ai:inference"],
        is_featured=True,
        is_verified=True,
    ),
    PluginManifest(
        id="cashflow-pro",
        name="Cashflow Pro",
        short_description="Proyección de flujo de caja con escenarios.",
        description="Herramienta avanzada de proyección de flujo de caja con modelado de escenarios (optimista, pesimista, realista). Incluye proyección de ingresos por cliente, cuentas por cobrar, cuentas por pagar, alertas de liquidez y reportes exportables a Excel. Ideal para consultoras que gestionan múltiples proyectos.",
        category="financiero",
        author="COS Ecuador",
        website="https://cos.ec/plugins/cashflow-pro",
        license="MIT",
        price_monthly=29.99,
        price_setup=49.00,
        rating=4.6,
        downloads=2500,
        versions=[
            PluginVersion(version="1.4.0", published_at="2026-04-10", changelog="Escenarios automatizados con ML. Integración con cuentas contables. Nuevos gráficos interactivos.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.3.0", published_at="2025-12-01", changelog="Alertas de liquidez vía email. Mejora en proyección semanal.", min_app_version="2.8.0", compatible=True),
        ],
        latest_version="1.4.0",
        tags=["cashflow", "financiero", "proyección", "liquidez", "escenarios"],
        screenshots=["https://cos.ec/plugins/cashflow-pro/screen1.png", "https://cos.ec/plugins/cashflow-pro/screen2.png"],
        requirements=["core>=3.0.0", "finance-module"],
        permissions=["finance:read", "finance:write"],
        is_featured=True,
        is_verified=True,
    ),
    PluginManifest(
        id="client-portal",
        name="Portal Clientes",
        short_description="Portal de autoservicio para clientes de la consultora.",
        description="Portal white-label donde los clientes de la consultora pueden acceder a sus facturas, estados de cuenta, documentos compartidos, historial de servicios y tickets de soporte. Incluye personalización de marca, notificaciones automáticas y módulo de mensajería.",
        category="crm",
        author="COS Ecuador",
        website="https://cos.ec",
        license="MIT",
        price_monthly=59.99,
        price_setup=199.00,
        rating=4.7,
        downloads=1500,
        versions=[
            PluginVersion(version="3.0.0", published_at="2026-06-01", changelog="Nuevo módulo de tickets. Notificaciones en tiempo real. Tema oscuro. API pública.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="2.1.0", published_at="2025-10-20", changelog="Personalización de marca. Integración firma digital.", min_app_version="2.5.0", compatible=False),
        ],
        latest_version="3.0.0",
        tags=["portal", "clientes", "crm", "autoservicio", "soporte", "white-label"],
        screenshots=["https://cos.ec/plugins/client-portal/screen1.png"],
        requirements=["core>=3.0.0", "notifications-module", "file-storage"],
        permissions=["client:read", "client:write", "document:read"],
        is_featured=True,
        is_verified=True,
    ),
    PluginManifest(
        id="rrhh-integral",
        name="RRHH Integral",
        short_description="Gestión de nómina, roles y vacaciones para consultoras.",
        description="Sistema completo de gestión de recursos humanos adaptado a consultoras ecuatorianas. Administración de nómina con cálculo de impuestos (IESS, IR), control de asistencia, gestión de vacaciones, evaluación de desempeño y expedientes digitales del personal.",
        category="rrhh",
        author="HR Solutions EC",
        website="https://hrsolutions.ec",
        license="Proprietary",
        price_monthly=34.99,
        price_setup=79.00,
        rating=4.3,
        downloads=980,
        versions=[
            PluginVersion(version="2.0.0", published_at="2026-02-15", changelog="Cálculo automático IESS. Roles de pago exportables. Integración con timbrado electrónico.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.2.0", published_at="2025-08-10", changelog="Gestión de vacaciones y permisos. Corrección de bugs.", min_app_version="2.5.0", compatible=False),
        ],
        latest_version="2.0.0",
        tags=["rrhh", "nómina", "iess", "vacaciones", "roles", "talento humano"],
        screenshots=["https://cos.ec/plugins/rrhh-integral/screen1.png", "https://cos.ec/plugins/rrhh-integral/screen2.png"],
        requirements=["core>=3.0.0", "tax-engine>=1.0", "pdf-generator"],
        permissions=["hr:read", "hr:write", "tax:read"],
        is_featured=False,
        is_verified=True,
    ),
    PluginManifest(
        id="analytics-plus",
        name="Analytics+",
        short_description="Dashboards personalizados y exportación avanzada.",
        description="Plataforma de analytics con dashboards arrastrar-y-soltar, conectores a múltiples fuentes de datos, exportación avanzada (PDF, Excel, CSV, PNG) y programación de reportes automáticos. Incluye plantillas predefinidas para consultoras: rentabilidad por proyecto, productividad del equipo y facturación mensual.",
        category="analitica",
        author="COS Ecuador",
        website="https://cos.ec",
        license="MIT",
        price_monthly=44.99,
        price_setup=129.00,
        rating=4.4,
        downloads=2100,
        versions=[
            PluginVersion(version="2.2.0", published_at="2026-05-05", changelog="Nuevo conector BI. Dashboards compartibles. Exportación programada.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="2.1.0", published_at="2025-11-20", changelog="Plantillas para consultoras. Correcciones en exportación PDF.", min_app_version="2.8.0", compatible=True),
        ],
        latest_version="2.2.0",
        tags=["analítica", "dashboards", "bi", "reportes", "exportación", "datos"],
        screenshots=["https://cos.ec/plugins/analytics-plus/screen1.png"],
        requirements=["core>=3.0.0", "chart-engine"],
        permissions=["bi:read", "data:read"],
        is_featured=True,
        is_verified=True,
    ),
    PluginManifest(
        id="firma-digital",
        name="Firma Digital EC",
        short_description="Integración con FirmaEC para firmar documentos legalmente.",
        description="Plugin de integración con FirmaEC (entidad certificadora ecuatoriana) que permite firmar digitalmente documentos con validez jurídica. Soporta firmas individuales y masivas, verificación de integridad de documentos, sello de tiempo y validación automática de certificados digitales.",
        category="legal",
        author="FirmaEC",
        website="https://firmaec.ec",
        license="Proprietary",
        price_monthly=19.99,
        price_setup=49.00,
        rating=4.2,
        downloads=3400,
        versions=[
            PluginVersion(version="1.1.0", published_at="2026-03-20", changelog="Firma masiva de documentos. Verificación automática de vigencia de certificados.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.0.0", published_at="2025-12-05", changelog="Lanzamiento inicial. Firma individual PDF.", min_app_version="2.8.0", compatible=True),
        ],
        latest_version="1.1.0",
        tags=["firma", "digital", "firmaec", "certificado", "documentos", "legal"],
        screenshots=["https://cos.ec/plugins/firma-digital/screen1.png"],
        requirements=["core>=3.0.0", "pdf-signer"],
        permissions=["document:write", "signature:write"],
        is_featured=False,
        is_verified=True,
    ),
    PluginManifest(
        id="inventario-activos",
        name="Inventario Activos",
        short_description="Control de activos fijos con depreciación según SRI.",
        description="Gestión integral del inventario de activos fijos con cálculo de depreciación conforme a las tablas del SRI (10 años para muebles, 5 para vehículos, 20 para inmuebles). Incluye asignación por departamento, códigos de barras, seguimiento de mantenimientos y reportes contables.",
        category="financiero",
        author="COS Ecuador",
        website="https://cos.ec",
        license="MIT",
        price_monthly=24.99,
        price_setup=39.00,
        rating=4.1,
        downloads=750,
        versions=[
            PluginVersion(version="1.0.0", published_at="2026-01-10", changelog="Lanzamiento oficial. Depreciación lineal y acelerada. Reportes SRI.", min_app_version="3.0.0", compatible=True),
        ],
        latest_version="1.0.0",
        tags=["activos", "inventario", "depreciación", "sri", "fijos"],
        screenshots=["https://cos.ec/plugins/inventario-activos/screen1.png"],
        requirements=["core>=3.0.0"],
        permissions=["finance:read", "finance:write"],
        is_featured=False,
        is_verified=False,
    ),
    PluginManifest(
        id="documentos-intel",
        name="Documentos Inteligente",
        short_description="OCR y clasificación automática de documentos.",
        description="Motor de reconocimiento óptico de caracteres (OCR) con clasificación automática mediante IA. Escanea facturas, comprobantes, contratos y documentos legales, extrae datos clave y los clasifica en las categorías correctas. Integración directa con el repositorio documental del sistema.",
        category="documentos",
        author="DocAI EC",
        website="https://docai.ec",
        license="Proprietary",
        price_monthly=19.99,
        price_setup=59.00,
        rating=4.0,
        downloads=1200,
        versions=[
            PluginVersion(version="2.0.0", published_at="2026-06-10", changelog="Nuevo modelo OCR con 99% precisión. Clasificación multietiqueta. Soporte para 20 tipos documentales.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.5.0", published_at="2025-09-15", changelog="Reconocimiento de facturas ecuatorianas. Mejoras en velocidad.", min_app_version="2.5.0", compatible=False),
        ],
        latest_version="2.0.0",
        tags=["ocr", "documentos", "ia", "clasificación", "escaneo", "facturas"],
        screenshots=["https://cos.ec/plugins/documentos-intel/screen1.png", "https://cos.ec/plugins/documentos-intel/screen2.png"],
        requirements=["core>=3.0.0", "ai-module>=1.0", "file-storage"],
        permissions=["document:read", "document:write", "ai:inference"],
        is_featured=False,
        is_verified=True,
    ),
    PluginManifest(
        id="auditoria-continua",
        name="Auditoría Continua",
        short_description="Monitoreo continuo de cumplimiento normativo.",
        description="Sistema de auditoría continua que monitorea en tiempo real el cumplimiento normativo de la consultora. Detecta anomalías en procesos tributarios, legales y financieros. Genera alertas, pistas de auditoría inmutables y reportes para la Superintendencia de Compañías.",
        category="seguridad",
        author="COS Ecuador",
        website="https://cos.ec",
        license="MIT",
        price_monthly=49.99,
        price_setup=199.00,
        rating=4.9,
        downloads=560,
        versions=[
            PluginVersion(version="1.2.0", published_at="2026-04-25", changelog="Alertas en tiempo real. Panel de cumplimiento. Reportes SuperCias.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.1.0", published_at="2025-12-10", changelog="Pista de auditoría blockchain. Corrección de falsos positivos.", min_app_version="2.8.0", compatible=True),
            PluginVersion(version="1.0.0", published_at="2025-08-20", changelog="Lanzamiento inicial. Monitoreo básico de eventos.", min_app_version="2.5.0", compatible=False),
        ],
        latest_version="1.2.0",
        tags=["auditoría", "cumplimiento", "seguridad", "normativo", "supercias", "monitoreo"],
        screenshots=["https://cos.ec/plugins/auditoria-continua/screen1.png"],
        requirements=["core>=3.0.0", "audit-trail", "blockchain-verifier"],
        permissions=["audit:read", "audit:write", "admin:logs"],
        is_featured=True,
        is_verified=True,
    ),
    PluginManifest(
        id="ruc-verifier",
        name="RUC Verifier",
        short_description="Verificación masiva de RUCs contra SRI.",
        description="Herramienta rápida para verificar el estado de RUCs de personas naturales y sociedades contra la base de datos del SRI. Permite carga masiva desde Excel, verificación de estado (activo, pasivo, suspendido), validación del dígito verificador y exportación de resultados. Ideal para procesos KYC.",
        category="tributario",
        author="COS Ecuador",
        website="https://cos.ec",
        license="MIT",
        price_monthly=9.99,
        price_setup=0.00,
        rating=4.5,
        downloads=4800,
        versions=[
            PluginVersion(version="1.0.0", published_at="2026-02-01", changelog="Lanzamiento oficial. Verificación individual y masiva. Exportación Excel.", min_app_version="3.0.0", compatible=True),
        ],
        latest_version="1.0.0",
        tags=["ruc", "sri", "verificación", "kyc", "masiva", "tributario"],
        screenshots=["https://cos.ec/plugins/ruc-verifier/screen1.png"],
        requirements=["core>=3.0.0"],
        permissions=["sri:read"],
        is_featured=False,
        is_verified=True,
    ),
    PluginManifest(
        id="pymes-cobranza",
        name="Cobranza PyMEs",
        short_description="Gestión de cobranzas con recordatorios automáticos.",
        description="Sistema de gestión de cobranzas diseñado para pequeñas y medianas consultoras. Automatiza recordatorios de pago, gestiona flujo de cobranza, genera reportes de antigüedad de cartera, envía notificaciones por WhatsApp y email, y ofrece integración con pasarelas de pago ecuatorianas.",
        category="financiero",
        author="FinTech EC",
        website="https://fintech.ec",
        license="Proprietary",
        price_monthly=14.99,
        price_setup=29.00,
        rating=4.0,
        downloads=1350,
        versions=[
            PluginVersion(version="1.2.0", published_at="2026-05-30", changelog="Integración WhatsApp Business. Recordatorios inteligentes. Cartera por antigüedad.", min_app_version="3.0.0", compatible=True),
            PluginVersion(version="1.1.0", published_at="2026-01-20", changelog="Notificaciones email. Reporte de gestión.", min_app_version="2.8.0", compatible=True),
        ],
        latest_version="1.2.0",
        tags=["cobranza", "pymes", "cartera", "recordatorios", "whatsapp", "financiero"],
        screenshots=["https://cos.ec/plugins/pymes-cobranza/screen1.png"],
        requirements=["core>=3.0.0", "notifications-module"],
        permissions=["finance:read", "finance:write", "client:read"],
        is_featured=False,
        is_verified=False,
    ),
]

DEFAULT_TENANT = "tenant-consultora-demo"

INSTALLED_PLUGINS_DATA = [
    InstalledPlugin(
        id="inst-001",
        tenant_id=DEFAULT_TENANT,
        plugin_id="sri-automation",
        name="Automatización SRI",
        version="2.0.0",
        status="active",
        installed_at="2026-01-15T10:30:00Z",
        updated_at="2026-03-05T14:00:00Z",
        config={"auto_send_ats": True, "sri_token": "encrypted_token_here", "notify_on_error": True},
        has_update=True,
        latest_version="2.1.0",
    ),
    InstalledPlugin(
        id="inst-002",
        tenant_id=DEFAULT_TENANT,
        plugin_id="client-portal",
        name="Portal Clientes",
        version="3.0.0",
        status="active",
        installed_at="2026-04-01T08:00:00Z",
        updated_at=None,
        config={"portal_url": "clientes.miconsultora.ec", "theme": "light", "logo_url": ""},
        has_update=False,
        latest_version="3.0.0",
    ),
    InstalledPlugin(
        id="inst-003",
        tenant_id=DEFAULT_TENANT,
        plugin_id="cashflow-pro",
        name="Cashflow Pro",
        version="1.3.0",
        status="active",
        installed_at="2025-12-20T09:15:00Z",
        updated_at="2026-04-15T11:00:00Z",
        config={"default_scenario": "realista", "alert_threshold": 5000, "currency": "USD"},
        has_update=True,
        latest_version="1.4.0",
    ),
    InstalledPlugin(
        id="inst-004",
        tenant_id=DEFAULT_TENANT,
        plugin_id="rrhh-integral",
        name="RRHH Integral",
        version="1.2.0",
        status="active",
        installed_at="2026-02-10T16:45:00Z",
        updated_at=None,
        config={"iess_auto_calc": True, "payroll_export_format": "pdf"},
        has_update=True,
        latest_version="2.0.0",
    ),
    InstalledPlugin(
        id="inst-005",
        tenant_id=DEFAULT_TENANT,
        plugin_id="auditoria-continua",
        name="Auditoría Continua",
        version="1.2.0",
        status="active",
        installed_at="2026-05-01T08:30:00Z",
        updated_at=None,
        config={"alerts_email": "auditor@miconsultora.ec", "compliance_standards": ["iso27001", "sri"]},
        has_update=False,
        latest_version="1.2.0",
    ),
    InstalledPlugin(
        id="inst-006",
        tenant_id=DEFAULT_TENANT,
        plugin_id="firma-digital",
        name="Firma Digital EC",
        version="1.0.0",
        status="disabled",
        installed_at="2026-01-05T12:00:00Z",
        updated_at="2026-03-10T09:00:00Z",
        config={"certificate_expiry": "2026-12-31", "default_signer": "admin"},
        has_update=True,
        latest_version="1.1.0",
    ),
]


class MarketplaceEngine:

    def list_plugins(self, category: Optional[str] = None, search: Optional[str] = None, page: int = 1, limit: int = 10) -> dict:
        filtered = MARKETPLACE_PLUGINS
        if category:
            filtered = [p for p in filtered if p.category == category]
        if search:
            q = search.lower()
            filtered = [p for p in filtered if q in p.name.lower() or q in p.short_description.lower() or q in p.description.lower() or q in p.tags]
        total = len(filtered)
        start = (page - 1) * limit
        end = start + limit
        items = filtered[start:end]
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": max(1, -(-total // limit)),
        }

    def get_plugin(self, plugin_id: str) -> Optional[PluginManifest]:
        for p in MARKETPLACE_PLUGINS:
            if p.id == plugin_id:
                return p
        return None

    def get_categories(self) -> list[PluginCategory]:
        return CATEGORIES

    def get_featured(self) -> list[PluginManifest]:
        return [p for p in MARKETPLACE_PLUGINS if p.is_featured]

    def get_installed(self, tenant_id: str) -> list[InstalledPlugin]:
        return [p for p in INSTALLED_PLUGINS_DATA if p.tenant_id == tenant_id]

    def install(self, tenant_id: str, request: PluginInstallRequest) -> InstalledPlugin:
        plugin = self.get_plugin(request.plugin_id)
        if not plugin:
            raise ValueError(f"Plugin {request.plugin_id} no encontrado en el marketplace.")
        if not request.accept_terms:
            raise ValueError("Debe aceptar los términos y condiciones para instalar el plugin.")
        existing = [p for p in INSTALLED_PLUGINS_DATA if p.tenant_id == tenant_id and p.plugin_id == request.plugin_id]
        if existing:
            raise ValueError(f"El plugin {plugin.name} ya está instalado.")
        now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        installed = InstalledPlugin(
            id=f"inst-{hashlib.md5(f'{tenant_id}{plugin.id}{now}'.encode()).hexdigest()[:8]}",
            tenant_id=tenant_id,
            plugin_id=plugin.id,
            name=plugin.name,
            version=plugin.latest_version,
            status="active",
            installed_at=now,
            updated_at=None,
            config=request.config,
            has_update=False,
            latest_version=plugin.latest_version,
        )
        INSTALLED_PLUGINS_DATA.append(installed)
        return installed

    def uninstall(self, tenant_id: str, plugin_id: str) -> bool:
        for i, p in enumerate(INSTALLED_PLUGINS_DATA):
            if p.tenant_id == tenant_id and p.plugin_id == plugin_id:
                INSTALLED_PLUGINS_DATA.pop(i)
                return True
        raise ValueError(f"Plugin {plugin_id} no está instalado.")

    def configure(self, tenant_id: str, plugin_id: str, config: dict) -> InstalledPlugin:
        for p in INSTALLED_PLUGINS_DATA:
            if p.tenant_id == tenant_id and p.plugin_id == plugin_id:
                p.config = config
                p.updated_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
                return p
        raise ValueError(f"Plugin {plugin_id} no está instalado.")

    def check_updates(self, tenant_id: str) -> list[InstalledPlugin]:
        installed = self.get_installed(tenant_id)
        result = []
        for p in installed:
            plugin = self.get_plugin(p.plugin_id)
            if plugin and plugin.latest_version != p.version:
                p.has_update = True
                p.latest_version = plugin.latest_version
            else:
                p.has_update = False
                p.latest_version = p.version
            result.append(p)
        return result

    def update_plugin(self, tenant_id: str, plugin_id: str) -> InstalledPlugin:
        for p in INSTALLED_PLUGINS_DATA:
            if p.tenant_id == tenant_id and p.plugin_id == plugin_id:
                plugin = self.get_plugin(p.plugin_id)
                if not plugin:
                    raise ValueError(f"Plugin {plugin_id} no encontrado en marketplace.")
                if plugin.latest_version == p.version:
                    raise ValueError(f"El plugin {plugin.name} ya está en la versión más reciente ({p.version}).")
                p.version = plugin.latest_version
                p.latest_version = plugin.latest_version
                p.has_update = False
                p.updated_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
                return p
        raise ValueError(f"Plugin {plugin_id} no está instalado.")
