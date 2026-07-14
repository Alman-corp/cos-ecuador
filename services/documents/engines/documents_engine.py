import uuid
import hashlib
import random
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
from typing_extensions import Literal


class DocumentVersion(BaseModel):
    id: str
    doc_id: str
    version_number: int
    file_hash: str
    file_size_bytes: int
    created_by: str
    created_at: str
    change_notes: str = ""
    status: Literal["draft", "final", "archived"] = "draft"


class Document(BaseModel):
    id: str
    client_id: Optional[str] = None
    title: str
    description: str = ""
    doc_type: Literal["contrato", "informe", "factura", "anexo", "acta", "propuesta", "carta", "otros"]
    category: str = ""
    tags: list[str] = []
    status: Literal["active", "archived", "deleted"] = "active"
    current_version: int = 1
    versions: list[DocumentVersion] = []
    classified_category: Optional[str] = None
    ocr_text: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""
    created_by: str = ""
    file_extension: str = "pdf"
    confidential: bool = False
    retention_days: int = 3650


class DocumentCreate(BaseModel):
    client_id: Optional[str] = None
    title: str
    description: str = ""
    doc_type: str = "otros"
    category: str = ""
    tags: list[str] = []
    created_by: str = "system"
    file_extension: str = "pdf"
    confidential: bool = False
    retention_days: int = 3650


class Template(BaseModel):
    id: str
    name: str
    description: str = ""
    category: Literal["contratos", "informes", "propuestas", "cartas", "formularios", "actas"]
    content: str
    variables: list[dict] = []
    version: int = 1
    created_at: str = ""
    updated_at: str = ""
    is_builtin: bool = False


class AuditEntry(BaseModel):
    id: str
    doc_id: str
    action: Literal["created", "viewed", "updated", "version_added", "downloaded", "classified", "ocr_performed", "archived", "deleted"]
    performed_by: str
    performed_at: str
    details: str = ""
    ip_address: str = ""


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fake_hash() -> str:
    return hashlib.sha256(str(random.getrandbits(256)).encode()).hexdigest()


SAMPLE_DOCUMENTS = [
    {
        "id": "doc-001",
        "client_id": "cli-001",
        "title": "Contrato de Servicios Profesionales - Consultoría Tributaria",
        "description": "Prestación de servicios de asesoría y consultoría tributaria integral.",
        "doc_type": "contrato",
        "category": "servicios profesionales",
        "tags": ["contrato", "servicios", "tributario"],
        "status": "active",
        "current_version": 2,
        "versions": [
            DocumentVersion(id="ver-001-1", doc_id="doc-001", version_number=1, file_hash=_fake_hash(), file_size_bytes=245760, created_by="admin", created_at="2026-01-10T10:00:00Z", change_notes="Versión inicial del contrato.", status="final"),
            DocumentVersion(id="ver-001-2", doc_id="doc-001", version_number=2, file_hash=_fake_hash(), file_size_bytes=249856, created_by="admin", created_at="2026-01-15T14:30:00Z", change_notes="Actualización de cláusulas de confidencialidad.", status="final"),
        ],
        "classified_category": "contratos legales",
        "ocr_text": None,
        "created_at": "2026-01-10T10:00:00Z",
        "updated_at": "2026-01-15T14:30:00Z",
        "created_by": "admin",
        "file_extension": "pdf",
        "confidential": True,
        "retention_days": 3650,
    },
    {
        "id": "doc-002",
        "client_id": "cli-001",
        "title": "Contrato de Confidencialidad (NDA)",
        "description": "Acuerdo de confidencialidad mutua entre las partes.",
        "doc_type": "contrato",
        "category": "confidencialidad",
        "tags": ["nda", "confidencialidad", "legal"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-002-1", doc_id="doc-002", version_number=1, file_hash=_fake_hash(), file_size_bytes=184320, created_by="admin", created_at="2026-02-01T09:00:00Z", change_notes="Versión inicial.", status="final"),
        ],
        "classified_category": "contratos legales",
        "ocr_text": None,
        "created_at": "2026-02-01T09:00:00Z",
        "updated_at": "2026-02-01T09:00:00Z",
        "created_by": "admin",
        "file_extension": "pdf",
        "confidential": True,
        "retention_days": 1825,
    },
    {
        "id": "doc-003",
        "client_id": "cli-002",
        "title": "Consulting Agreement - Business Advisory",
        "description": "Acuerdo de consultoría en gestión empresarial y planificación estratégica.",
        "doc_type": "contrato",
        "category": "consulting",
        "tags": ["consulting", "business", "advisory"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-003-1", doc_id="doc-003", version_number=1, file_hash=_fake_hash(), file_size_bytes=302400, created_by="partner", created_at="2026-03-05T11:00:00Z", change_notes="Versión inicial en inglés.", status="draft"),
        ],
        "classified_category": "contratos comerciales",
        "ocr_text": None,
        "created_at": "2026-03-05T11:00:00Z",
        "updated_at": "2026-03-05T11:00:00Z",
        "created_by": "partner",
        "file_extension": "docx",
        "confidential": False,
        "retention_days": 3650,
    },
    {
        "id": "doc-004",
        "client_id": "cli-003",
        "title": "Informe de Due Diligence - Grupo Empresarial XYZ",
        "description": "Informe completo de due diligence financiero, tributario y legal.",
        "doc_type": "informe",
        "category": "due diligence",
        "tags": ["due diligence", "financiero", "tributario", "legal"],
        "status": "active",
        "current_version": 3,
        "versions": [
            DocumentVersion(id="ver-004-1", doc_id="doc-004", version_number=1, file_hash=_fake_hash(), file_size_bytes=512000, created_by="analyst1", created_at="2026-01-20T08:00:00Z", change_notes="Borrador inicial.", status="draft"),
            DocumentVersion(id="ver-004-2", doc_id="doc-004", version_number=2, file_hash=_fake_hash(), file_size_bytes=524288, created_by="analyst1", created_at="2026-01-25T16:00:00Z", change_notes="Revisión del área financiera.", status="draft"),
            DocumentVersion(id="ver-004-3", doc_id="doc-004", version_number=3, file_hash=_fake_hash(), file_size_bytes=530432, created_by="partner", created_at="2026-02-01T10:00:00Z", change_notes="Versión final aprobada.", status="final"),
        ],
        "classified_category": "informes financieros",
        "ocr_text": None,
        "created_at": "2026-01-20T08:00:00Z",
        "updated_at": "2026-02-01T10:00:00Z",
        "created_by": "analyst1",
        "file_extension": "pdf",
        "confidential": True,
        "retention_days": 3650,
    },
    {
        "id": "doc-005",
        "client_id": "cli-002",
        "title": "Informe Mensual de Actividades - Enero 2026",
        "description": "Reporte mensual de actividades, hitos y métricas del proyecto.",
        "doc_type": "informe",
        "category": "reportes mensuales",
        "tags": ["mensual", "actividades", "reporte"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-005-1", doc_id="doc-005", version_number=1, file_hash=_fake_hash(), file_size_bytes=204800, created_by="analyst2", created_at="2026-02-05T09:00:00Z", change_notes="Versión inicial.", status="final"),
        ],
        "classified_category": None,
        "ocr_text": None,
        "created_at": "2026-02-05T09:00:00Z",
        "updated_at": "2026-02-05T09:00:00Z",
        "created_by": "analyst2",
        "file_extension": "pdf",
        "confidential": False,
        "retention_days": 730,
    },
    {
        "id": "doc-006",
        "client_id": "cli-001",
        "title": "Factura - Honorarios Consultoría Enero 2026",
        "description": "Factura por servicios de consultoría tributaria del mes de enero.",
        "doc_type": "factura",
        "category": "honorarios",
        "tags": ["factura", "honorarios", "enero"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-006-1", doc_id="doc-006", version_number=1, file_hash=_fake_hash(), file_size_bytes=153600, created_by="admin", created_at="2026-02-01T08:00:00Z", change_notes="Factura original.", status="final"),
        ],
        "classified_category": "facturación",
        "ocr_text": "CONSULTORIA ECUADOR S.A.\nRUC: 1799999999001\nFACTURA No. 001-001-0000001\nFECHA: 01/02/2026\nCLIENTE: EMPRESA XYZ S.A.\nSUBTOTAL: $5,000.00\nIVA 12%: $600.00\nTOTAL: $5,600.00",
        "created_at": "2026-02-01T08:00:00Z",
        "updated_at": "2026-02-01T08:00:00Z",
        "created_by": "admin",
        "file_extension": "pdf",
        "confidential": False,
        "retention_days": 3650,
    },
    {
        "id": "doc-007",
        "client_id": "cli-003",
        "title": "Factura - Servicios de Auditoría Febrero 2026",
        "description": "Factura por servicios de auditoría externa.",
        "doc_type": "factura",
        "category": "auditoría",
        "tags": ["factura", "auditoria", "febrero"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-007-1", doc_id="doc-007", version_number=1, file_hash=_fake_hash(), file_size_bytes=158720, created_by="admin", created_at="2026-03-01T08:00:00Z", change_notes="Factura original.", status="final"),
        ],
        "classified_category": "facturación",
        "ocr_text": "CONSULTORIA ECUADOR S.A.\nRUC: 1799999999001\nFACTURA No. 001-001-0000002\nFECHA: 01/03/2026\nCLIENTE: GRUPO EMPRESARIAL XYZ\nSUBTOTAL: $8,500.00\nIVA 12%: $1,020.00\nTOTAL: $9,520.00",
        "created_at": "2026-03-01T08:00:00Z",
        "updated_at": "2026-03-01T08:00:00Z",
        "created_by": "admin",
        "file_extension": "pdf",
        "confidential": False,
        "retention_days": 3650,
    },
    {
        "id": "doc-008",
        "client_id": "cli-004",
        "title": "Factura - Consultoría Tributaria Integral",
        "description": "Factura por servicios integrales de consultoría tributaria Q1 2026.",
        "doc_type": "factura",
        "category": "consultoría",
        "tags": ["factura", "tributario", "q1"],
        "status": "archived",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-008-1", doc_id="doc-008", version_number=1, file_hash=_fake_hash(), file_size_bytes=162816, created_by="admin", created_at="2026-01-15T08:00:00Z", change_notes="Factura original.", status="final"),
        ],
        "classified_category": "facturación",
        "ocr_text": "CONSULTORIA ECUADOR S.A.\nRUC: 1799999999001\nFACTURA No. 001-001-0000003\nFECHA: 15/01/2026\nCLIENTE: COMERCIALIZADORA ABC\nSUBTOTAL: $12,000.00\nIVA 12%: $1,440.00\nTOTAL: $13,440.00",
        "created_at": "2026-01-15T08:00:00Z",
        "updated_at": "2026-03-10T12:00:00Z",
        "created_by": "admin",
        "file_extension": "pdf",
        "confidential": False,
        "retention_days": 3650,
    },
    {
        "id": "doc-009",
        "client_id": "cli-002",
        "title": "Anexo - ATS Enero 2026",
        "description": "Anexo Transaccional Simplificado - reporte mensual de ventas y compras.",
        "doc_type": "anexo",
        "category": "ATS",
        "tags": ["anexo", "ats", "sri", "ventas", "compras"],
        "status": "active",
        "current_version": 2,
        "versions": [
            DocumentVersion(id="ver-009-1", doc_id="doc-009", version_number=1, file_hash=_fake_hash(), file_size_bytes=409600, created_by="analyst1", created_at="2026-02-10T10:00:00Z", change_notes="Borrador ATS.", status="draft"),
            DocumentVersion(id="ver-009-2", doc_id="doc-009", version_number=2, file_hash=_fake_hash(), file_size_bytes=415232, created_by="analyst1", created_at="2026-02-12T14:00:00Z", change_notes="ATS validado y firmado.", status="final"),
        ],
        "classified_category": "anexos SRI",
        "ocr_text": None,
        "created_at": "2026-02-10T10:00:00Z",
        "updated_at": "2026-02-12T14:00:00Z",
        "created_by": "analyst1",
        "file_extension": "xml",
        "confidential": False,
        "retention_days": 3650,
    },
    {
        "id": "doc-010",
        "client_id": "cli-001",
        "title": "Anexo - Retenciones en la Fuente Q1 2026",
        "description": "Detalle de retenciones en la fuente realizadas durante el primer trimestre.",
        "doc_type": "anexo",
        "category": "retenciones",
        "tags": ["anexo", "retenciones", "fuente", "q1"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-010-1", doc_id="doc-010", version_number=1, file_hash=_fake_hash(), file_size_bytes=389120, created_by="analyst2", created_at="2026-04-05T09:00:00Z", change_notes="Versión inicial.", status="final"),
        ],
        "classified_category": "anexos SRI",
        "ocr_text": None,
        "created_at": "2026-04-05T09:00:00Z",
        "updated_at": "2026-04-05T09:00:00Z",
        "created_by": "analyst2",
        "file_extension": "xlsx",
        "confidential": False,
        "retention_days": 3650,
    },
    {
        "id": "doc-011",
        "client_id": "cli-003",
        "title": "Acta de Reunión - Comité de Auditoría",
        "description": "Acta de la reunión del comité de auditoría para revisión de hallazgos.",
        "doc_type": "acta",
        "category": "reuniones",
        "tags": ["acta", "reunión", "auditoría", "comité"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-011-1", doc_id="doc-011", version_number=1, file_hash=_fake_hash(), file_size_bytes=122880, created_by="partner", created_at="2026-02-20T15:00:00Z", change_notes="Versión final del acta.", status="final"),
        ],
        "classified_category": None,
        "ocr_text": "ACTA DE REUNIÓN\nFecha: 20 de febrero de 2026\nAsistentes: Comité de Auditoría\nTemas: Revisión de hallazgos de auditoría interna\nAcuerdos: Implementar recomendaciones en 30 días",
        "created_at": "2026-02-20T15:00:00Z",
        "updated_at": "2026-02-20T15:00:00Z",
        "created_by": "partner",
        "file_extension": "pdf",
        "confidential": True,
        "retention_days": 3650,
    },
    {
        "id": "doc-012",
        "client_id": None,
        "title": "Acta de Constitución - Consultoría Ecuador S.A.",
        "description": "Acta de constitución de la sociedad Consultoría Ecuador S.A.",
        "doc_type": "acta",
        "category": "constitución",
        "tags": ["acta", "constitución", "sociedad", "legal"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-012-1", doc_id="doc-012", version_number=1, file_hash=_fake_hash(), file_size_bytes=198656, created_by="admin", created_at="2025-06-01T10:00:00Z", change_notes="Versión original de constitución.", status="final"),
        ],
        "classified_category": "documentos legales",
        "ocr_text": None,
        "created_at": "2025-06-01T10:00:00Z",
        "updated_at": "2025-06-01T10:00:00Z",
        "created_by": "admin",
        "file_extension": "pdf",
        "confidential": False,
        "retention_days": 36500,
    },
    {
        "id": "doc-013",
        "client_id": "cli-004",
        "title": "Propuesta de Consultoría Tributaria - Comercializadora ABC",
        "description": "Propuesta de servicios de consultoría tributaria y planificación fiscal.",
        "doc_type": "propuesta",
        "category": "consultoría tributaria",
        "tags": ["propuesta", "tributario", "fiscal"],
        "status": "active",
        "current_version": 2,
        "versions": [
            DocumentVersion(id="ver-013-1", doc_id="doc-013", version_number=1, file_hash=_fake_hash(), file_size_bytes=358400, created_by="partner", created_at="2026-03-10T09:00:00Z", change_notes="Propuesta inicial.", status="draft"),
            DocumentVersion(id="ver-013-2", doc_id="doc-013", version_number=2, file_hash=_fake_hash(), file_size_bytes=362496, created_by="partner", created_at="2026-03-12T11:00:00Z", change_notes="Propuesta actualizada con alcance detallado.", status="final"),
        ],
        "classified_category": "propuestas comerciales",
        "ocr_text": None,
        "created_at": "2026-03-10T09:00:00Z",
        "updated_at": "2026-03-12T11:00:00Z",
        "created_by": "partner",
        "file_extension": "pdf",
        "confidential": True,
        "retention_days": 1825,
    },
    {
        "id": "doc-014",
        "client_id": "cli-003",
        "title": "Propuesta de Servicios de Auditoría - Grupo XYZ",
        "description": "Propuesta para auditoría financiera y de cumplimiento tributario.",
        "doc_type": "propuesta",
        "category": "auditoría",
        "tags": ["propuesta", "auditoría", "financiero", "cumplimiento"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-014-1", doc_id="doc-014", version_number=1, file_hash=_fake_hash(), file_size_bytes=372736, created_by="partner", created_at="2026-04-01T10:00:00Z", change_notes="Versión inicial.", status="draft"),
        ],
        "classified_category": "propuestas comerciales",
        "ocr_text": None,
        "created_at": "2026-04-01T10:00:00Z",
        "updated_at": "2026-04-01T10:00:00Z",
        "created_by": "partner",
        "file_extension": "pdf",
        "confidential": True,
        "retention_days": 1825,
    },
    {
        "id": "doc-015",
        "client_id": "cli-002",
        "title": "Carta de Renovación de Contrato - Cliente Empresarial",
        "description": "Carta formal de renovación del contrato de servicios de consultoría.",
        "doc_type": "carta",
        "category": "renovación",
        "tags": ["carta", "renovación", "contrato"],
        "status": "active",
        "current_version": 1,
        "versions": [
            DocumentVersion(id="ver-015-1", doc_id="doc-015", version_number=1, file_hash=_fake_hash(), file_size_bytes=102400, created_by="admin", created_at="2026-05-01T10:00:00Z", change_notes="Versión inicial.", status="final"),
        ],
        "classified_category": "correspondencia",
        "ocr_text": None,
        "created_at": "2026-05-01T10:00:00Z",
        "updated_at": "2026-05-01T10:00:00Z",
        "created_by": "admin",
        "file_extension": "pdf",
        "confidential": False,
        "retention_days": 730,
    },
]

SAMPLE_TEMPLATES = [
    {
        "id": "tpl-001",
        "name": "Contrato de Servicios Profesionales",
        "description": "Plantilla estándar de contrato de prestación de servicios profesionales.",
        "category": "contratos",
        "content": "CONTRATO DE SERVICIOS PROFESIONALES\n\nComparecen: {{cliente}}, con RUC {{ruc}}, en adelante \"EL CLIENTE\", y CONSULTORÍA ECUADOR S.A.\n\nOBJETO: {{servicio}}\nVALOR: ${{valor}}\nPLAZO: {{plazo}} meses\nFECHA DE INICIO: {{fecha_inicio}}\n\nFIRMAS:\n________________________\n{{cliente}}\n________________________\nCONSULTORÍA ECUADOR S.A.",
        "variables": [
            {"name": "cliente", "type": "string", "required": True, "description": "Nombre del cliente"},
            {"name": "ruc", "type": "string", "required": True, "description": "RUC del cliente"},
            {"name": "servicio", "type": "string", "required": True, "description": "Descripción del servicio"},
            {"name": "valor", "type": "number", "required": True, "description": "Valor del contrato"},
            {"name": "fecha_inicio", "type": "date", "required": True, "description": "Fecha de inicio"},
            {"name": "plazo", "type": "number", "required": True, "description": "Plazo en meses"},
        ],
        "version": 1,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
        "is_builtin": True,
    },
    {
        "id": "tpl-002",
        "name": "Propuesta de Consultoría Tributaria",
        "description": "Plantilla para propuestas de servicios de consultoría tributaria.",
        "category": "propuestas",
        "content": "PROPUESTA DE CONSULTORÍA TRIBUTARIA\n\nCLIENTE: {{cliente}}\n\nALCANCE DEL SERVICIO:\n{{alcance}}\n\nHONORARIOS: ${{honorarios}}\n\nPLAZO DE ENTREGA: {{plazo_entrega}} días hábiles\n\nAtentamente,\nCONSULTORÍA ECUADOR S.A.",
        "variables": [
            {"name": "cliente", "type": "string", "required": True, "description": "Nombre del cliente"},
            {"name": "alcance", "type": "string", "required": True, "description": "Alcance del servicio"},
            {"name": "honorarios", "type": "number", "required": True, "description": "Honorarios propuestos"},
            {"name": "plazo_entrega", "type": "number", "required": True, "description": "Plazo de entrega en días"},
        ],
        "version": 1,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-02-01T10:00:00Z",
        "is_builtin": True,
    },
    {
        "id": "tpl-003",
        "name": "Informe de Due Diligence",
        "description": "Plantilla para informes de due diligence financiero y tributario.",
        "category": "informes",
        "content": "INFORME DE DUE DILIGENCE\n\nEMPRESA REVISADA: {{empresa}}\nFECHA DE REVISIÓN: {{fecha_revision}}\n\nALCANCE:\n{{alcance}}\n\nCONCLUSIONES:\n[Completar según hallazgos]\n\n________________________\nCONSULTORÍA ECUADOR S.A.",
        "variables": [
            {"name": "empresa", "type": "string", "required": True, "description": "Empresa revisada"},
            {"name": "fecha_revision", "type": "date", "required": True, "description": "Fecha de revisión"},
            {"name": "alcance", "type": "string", "required": True, "description": "Alcance de la revisión"},
        ],
        "version": 1,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
        "is_builtin": True,
    },
    {
        "id": "tpl-004",
        "name": "Carta de Renovación de Contrato",
        "description": "Plantilla para cartas de renovación contractual.",
        "category": "cartas",
        "content": "CARTA DE RENOVACIÓN DE CONTRATO\n\nCLIENTE: {{cliente}}\n\nPor medio de la presente, notificamos la renovación del contrato {{contrato_actual}}.\n\nNUEVA FECHA DE VIGENCIA: {{nueva_fecha}}\nNUEVO VALOR: ${{nuevo_valor}}\n\nQuedamos atentos a la firma de la presente.\n\nAtentamente,\nCONSULTORÍA ECUADOR S.A.",
        "variables": [
            {"name": "cliente", "type": "string", "required": True, "description": "Nombre del cliente"},
            {"name": "contrato_actual", "type": "string", "required": True, "description": "Referencia del contrato actual"},
            {"name": "nueva_fecha", "type": "date", "required": True, "description": "Nueva fecha de vigencia"},
            {"name": "nuevo_valor", "type": "number", "required": True, "description": "Nuevo valor del contrato"},
        ],
        "version": 1,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
        "is_builtin": True,
    },
    {
        "id": "tpl-005",
        "name": "Acta de Reunión",
        "description": "Plantilla para actas de reunión corporativas.",
        "category": "actas",
        "content": "ACTA DE REUNIÓN\n\nPROYECTO: {{proyecto}}\nFECHA: {{fecha}}\n\nASISTENTES:\n{{asistentes}}\n\nTEMAS TRATADOS:\n{{temas}}\n\nACUERDOS:\n{{acuerdos}}\n\n________________________\nSecretario",
        "variables": [
            {"name": "proyecto", "type": "string", "required": True, "description": "Nombre del proyecto"},
            {"name": "fecha", "type": "date", "required": True, "description": "Fecha de la reunión"},
            {"name": "asistentes", "type": "string", "required": True, "description": "Lista de asistentes"},
            {"name": "temas", "type": "string", "required": True, "description": "Temas tratados"},
            {"name": "acuerdos", "type": "string", "required": True, "description": "Acuerdos tomados"},
        ],
        "version": 1,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z",
        "is_builtin": True,
    },
    {
        "id": "tpl-006",
        "name": "Factura Profesional",
        "description": "Plantilla para facturación de servicios profesionales.",
        "category": "formularios",
        "content": "FACTURA PROFESIONAL\n\nCLIENTE: {{cliente}}\nRUC: {{ruc}}\n\nDETALLE:\n{{items}}\n\nSUBTOTAL: ${{subtotal}}\nIVA 12%: ${{iva}}\nTOTAL: ${{total}}\n\n________________________\nCONSULTORÍA ECUADOR S.A.",
        "variables": [
            {"name": "cliente", "type": "string", "required": True, "description": "Nombre del cliente"},
            {"name": "ruc", "type": "string", "required": True, "description": "RUC del cliente"},
            {"name": "items", "type": "string", "required": True, "description": "Detalle de items facturados"},
            {"name": "subtotal", "type": "number", "required": True, "description": "Subtotal sin IVA"},
            {"name": "iva", "type": "number", "required": True, "description": "Valor del IVA"},
            {"name": "total", "type": "number", "required": True, "description": "Total a pagar"},
        ],
        "version": 2,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-03-01T08:00:00Z",
        "is_builtin": True,
    },
    {
        "id": "tpl-007",
        "name": "Anexo de Servicios Adicionales",
        "description": "Plantilla para anexos de servicios adicionales a contratos existentes.",
        "category": "contratos",
        "content": "ANEXO DE SERVICIOS ADICIONALES\n\nCONTRATO DE REFERENCIA: {{contrato_referencia}}\n\nSERVICIOS ADICIONALES:\n{{servicios}}\n\nVALOR ADICIONAL: ${{valor_adicional}}\n\nLas demás cláusulas del contrato original se mantienen vigentes.\n\n________________________\nCONSULTORÍA ECUADOR S.A.",
        "variables": [
            {"name": "contrato_referencia", "type": "string", "required": True, "description": "Contrato de referencia"},
            {"name": "servicios", "type": "string", "required": True, "description": "Servicios adicionales"},
            {"name": "valor_adicional", "type": "number", "required": True, "description": "Valor adicional"},
        ],
        "version": 1,
        "created_at": "2026-02-01T00:00:00Z",
        "updated_at": "2026-02-01T00:00:00Z",
        "is_builtin": False,
    },
    {
        "id": "tpl-008",
        "name": "Informe de Cumplimiento SRI",
        "description": "Plantilla para informes de cumplimiento de obligaciones tributarias SRI.",
        "category": "informes",
        "content": "INFORME DE CUMPLIMIENTO SRI\n\nCLIENTE: {{cliente}}\nPERÍODO: {{periodo}}\n\nOBLIGACIONES REVISADAS:\n{{obligaciones}}\n\nESTADO DE CUMPLIMIENTO: {{estado}}\n\n________________________\nCONSULTORÍA ECUADOR S.A.",
        "variables": [
            {"name": "cliente", "type": "string", "required": True, "description": "Nombre del cliente"},
            {"name": "periodo", "type": "string", "required": True, "description": "Período fiscal revisado"},
            {"name": "obligaciones", "type": "string", "required": True, "description": "Obligaciones revisadas"},
            {"name": "estado", "type": "string", "required": True, "description": "Estado de cumplimiento"},
        ],
        "version": 1,
        "created_at": "2026-03-01T00:00:00Z",
        "updated_at": "2026-03-01T00:00:00Z",
        "is_builtin": False,
    },
]


_CLASSIFICATION_KEYWORDS = {
    "contrato": "contratos legales",
    "acuerdo": "contratos legales",
    "confidencialidad": "contratos legales",
    "consulting": "contratos comerciales",
    "informe": "informes financieros",
    "reporte": "informes financieros",
    "due diligence": "informes financieros",
    "cumplimiento": "informes de cumplimiento",
    "factura": "facturación",
    "honorarios": "facturación",
    "anexo": "anexos SRI",
    "ats": "anexos SRI",
    "retenciones": "anexos SRI",
    "acta": "actas corporativas",
    "reunión": "actas corporativas",
    "constitución": "documentos legales",
    "propuesta": "propuestas comerciales",
    "auditoría": "propuestas comerciales",
    "carta": "correspondencia",
    "renovación": "correspondencia",
}

_OCR_TEXTS = {
    "contrato": "CONTRATO DE SERVICIOS\n\nEntre las partes comparecientes...\nCláusula Primera: Objeto del Contrato\nCláusula Segunda: Obligaciones de las Partes\nCláusula Tercera: Plazo y Vigencia\nCláusula Cuarta: Valor y Forma de Pago\nCláusula Quinta: Confidencialidad\n\nFirmas digitales al pie.",
    "informe": "INFORME DE CONSULTORÍA\n\n1. Objetivo del Informe\n2. Metodología Aplicada\n3. Análisis de Resultados\n3.1 Hallazgos Principales\n3.2 Recomendaciones\n4. Conclusiones\n5. Anexos\n\nDocumento confidencial.",
    "factura": "FACTURA COMERCIAL\n\nCONSULTORÍA ECUADOR S.A.\nRUC: 1799999999001\nDirección Matriz: Quito, Ecuador\n\nCliente: [Razón Social]\nRUC: [Número RUC]\n\nSubtotal: $[valor]\nIVA 12%: $[valor]\nTotal: $[valor]\n\nForma de pago: Transferencia bancaria.",
    "anexo": "ANEXO TRIBUTARIO\n\nDetalle de operaciones:\n- Ventas sujetas a IVA\n- Ventas exentas\n- Compras sujetas a IVA\n- Retenciones en la fuente\n- Retenciones de IVA\n\nTotal transacciones: [número]",
    "acta": "ACTA\n\nEn la ciudad de [ciudad], siendo las [hora] del día [fecha], se reunieron...\n\nOrden del día:\n1. Verificación del quórum\n2. Lectura del acta anterior\n3. Temas a tratar\n4. Acuerdos y compromisos\n\nSiendo las [hora] se da por terminada la reunión.",
    "propuesta": "PROPUESTA DE SERVICIOS\n\nCONSULTORÍA ECUADOR S.A.\n\n1. Antecedentes\n2. Objetivos\n3. Alcance de los servicios\n4. Metodología\n5. Cronograma\n6. Inversión\n7. Forma de pago\n\nA la espera de su aprobación.",
    "carta": "CARTA FORMAL\n\n[Ciudad], [fecha]\n\nSeñores\n[Destinatario]\nPresente\n\nDe mis consideraciones:\n\nPor medio de la presente...\n\nAtentamente,\n\n[Nombre]\nCONSULTORÍA ECUADOR S.A.",
    "otros": "DOCUMENTO DIGITAL\n\nDocumento procesado por el sistema de gestión documental.\n\nFecha de digitalización: [fecha]\nUsuario: [nombre]\n\nContenido no clasificado.",
}


def _build_document(raw: dict) -> Document:
    raw["versions"] = raw.get("versions", [])
    return Document(**raw)


def _build_template(raw: dict) -> Template:
    return Template(**raw)


class DocumentsEngine:
    def __init__(self):
        self._documents: dict[str, Document] = {}
        self._templates: dict[str, Template] = {}
        self._audit_logs: dict[str, list[AuditEntry]] = {}
        self._next_version: dict[str, int] = {}

        for raw in SAMPLE_DOCUMENTS:
            doc = _build_document(raw)
            self._documents[doc.id] = doc
            self._next_version[doc.id] = len(doc.versions) + 1

        for raw in SAMPLE_TEMPLATES:
            tpl = _build_template(raw)
            self._templates[tpl.id] = tpl

    def _audit(self, doc_id: str, action: str, performed_by: str = "system", details: str = "", ip: str = ""):
        entry = AuditEntry(
            id=str(uuid.uuid4()),
            doc_id=doc_id,
            action=action,
            performed_by=performed_by,
            performed_at=_utcnow(),
            details=details,
            ip_address=ip,
        )
        if doc_id not in self._audit_logs:
            self._audit_logs[doc_id] = []
        self._audit_logs[doc_id].append(entry)
        return entry

    def create_document(self, data: DocumentCreate) -> Document:
        doc_id = f"doc-{str(uuid.uuid4())[:8]}"
        now = _utcnow()
        version = DocumentVersion(
            id=f"ver-{doc_id}-1",
            doc_id=doc_id,
            version_number=1,
            file_hash=_fake_hash(),
            file_size_bytes=random.randint(50_000, 500_000),
            created_by=data.created_by,
            created_at=now,
            change_notes="Versión inicial.",
            status="draft",
        )
        doc = Document(
            id=doc_id,
            client_id=data.client_id,
            title=data.title,
            description=data.description,
            doc_type=data.doc_type,
            category=data.category,
            tags=data.tags,
            status="active",
            current_version=1,
            versions=[version],
            classified_category=None,
            ocr_text=None,
            created_at=now,
            updated_at=now,
            created_by=data.created_by,
            file_extension=data.file_extension,
            confidential=data.confidential,
            retention_days=data.retention_days,
        )
        self._documents[doc_id] = doc
        self._next_version[doc_id] = 2
        self._audit(doc_id, "created", data.created_by, f"Documento '{data.title}' creado.")
        return doc

    def get_document(self, doc_id: str) -> Optional[Document]:
        doc = self._documents.get(doc_id)
        if doc and doc.status != "deleted":
            self._audit(doc_id, "viewed", "system", "Documento consultado.")
            return doc
        return None

    def update_document(self, doc_id: str, data: dict) -> Optional[Document]:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return None
        for key, value in data.items():
            if hasattr(doc, key) and key not in ("id", "created_at", "versions", "current_version"):
                setattr(doc, key, value)
        doc.updated_at = _utcnow()
        self._audit(doc_id, "updated", data.get("created_by", "system"), "Metadatos actualizados.")
        return doc

    def delete_document(self, doc_id: str) -> bool:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return False
        doc.status = "deleted"
        doc.updated_at = _utcnow()
        self._audit(doc_id, "deleted", "system", "Documento eliminado (soft-delete).")
        return True

    def list_documents(
        self,
        client_id: Optional[str] = None,
        doc_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> tuple[list[Document], int]:
        docs = [d for d in self._documents.values() if d.status != "deleted"]
        if client_id:
            docs = [d for d in docs if d.client_id == client_id]
        if doc_type:
            docs = [d for d in docs if d.doc_type == doc_type]
        if status:
            docs = [d for d in docs if d.status == status]
        if search:
            term = search.lower()
            docs = [
                d for d in docs
                if term in d.title.lower() or term in d.description.lower() or term in " ".join(d.tags).lower()
            ]
        docs.sort(key=lambda d: d.created_at, reverse=True)
        total = len(docs)
        start = (page - 1) * limit
        end = start + limit
        return docs[start:end], total

    def add_version(self, doc_id: str, created_by: str = "system", notes: str = "") -> Optional[DocumentVersion]:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return None
        ver_num = self._next_version.get(doc_id, len(doc.versions) + 1)
        version = DocumentVersion(
            id=f"ver-{doc_id}-{ver_num}",
            doc_id=doc_id,
            version_number=ver_num,
            file_hash=_fake_hash(),
            file_size_bytes=random.randint(50_000, 500_000),
            created_by=created_by,
            created_at=_utcnow(),
            change_notes=notes,
            status="draft",
        )
        doc.versions.append(version)
        doc.current_version = ver_num
        doc.updated_at = _utcnow()
        self._next_version[doc_id] = ver_num + 1
        self._audit(doc_id, "version_added", created_by, f"Versión {ver_num} agregada: {notes}")
        return version

    def get_versions(self, doc_id: str) -> list[DocumentVersion]:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return []
        return list(doc.versions)

    def get_version(self, doc_id: str, version_id: str) -> Optional[DocumentVersion]:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return None
        for v in doc.versions:
            if v.id == version_id:
                return v
        return None

    def classify_document(self, doc_id: str) -> Optional[str]:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return None
        title_lower = doc.title.lower()
        category = "general"
        for keyword, cat in _CLASSIFICATION_KEYWORDS.items():
            if keyword in title_lower:
                category = cat
                break
        doc.classified_category = category
        doc.updated_at = _utcnow()
        self._audit(doc_id, "classified", "ai-classifier", f"Clasificado como: {category}")
        return category

    def ocr_document(self, doc_id: str) -> Optional[str]:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return None
        text = _OCR_TEXTS.get(doc.doc_type, _OCR_TEXTS["otros"])
        doc.ocr_text = text
        doc.updated_at = _utcnow()
        self._audit(doc_id, "ocr_performed", "ocr-engine", "Texto extraído mediante OCR.")
        return text

    def get_download_url(self, doc_id: str) -> Optional[str]:
        doc = self._documents.get(doc_id)
        if not doc or doc.status == "deleted":
            return None
        self._audit(doc_id, "downloaded", "system", "URL de descarga generada.")
        return f"https://storage.consultoria-ec.com/documents/{doc_id}/download?v={doc.current_version}"

    def get_audit_trail(self, doc_id: str) -> list[AuditEntry]:
        return self._audit_logs.get(doc_id, [])

    def create_template(self, data: dict) -> Template:
        tpl_id = f"tpl-{str(uuid.uuid4())[:8]}"
        now = _utcnow()
        tpl = Template(
            id=tpl_id,
            name=data["name"],
            description=data.get("description", ""),
            category=data.get("category", "formularios"),
            content=data["content"],
            variables=data.get("variables", []),
            version=1,
            created_at=now,
            updated_at=now,
            is_builtin=False,
        )
        self._templates[tpl_id] = tpl
        return tpl

    def get_template(self, template_id: str) -> Optional[Template]:
        return self._templates.get(template_id)

    def update_template(self, template_id: str, data: dict) -> Optional[Template]:
        tpl = self._templates.get(template_id)
        if not tpl:
            return None
        for key, value in data.items():
            if hasattr(tpl, key) and key not in ("id", "created_at", "is_builtin"):
                setattr(tpl, key, value)
        tpl.version += 1
        tpl.updated_at = _utcnow()
        return tpl

    def delete_template(self, template_id: str) -> bool:
        if template_id in self._templates and not self._templates[template_id].is_builtin:
            del self._templates[template_id]
            return True
        return False

    def list_templates(self, category: Optional[str] = None) -> list[Template]:
        tpls = list(self._templates.values())
        if category:
            tpls = [t for t in tpls if t.category == category]
        return tpls

    def render_template(self, template_id: str, variables: dict) -> Optional[str]:
        tpl = self._templates.get(template_id)
        if not tpl:
            return None
        content = tpl.content
        for key, value in variables.items():
            placeholder = "{{" + key + "}}"
            content = content.replace(placeholder, str(value))
        return content
