"""ClientsEngine — In-memory client, contract, invoice, payment and history management."""

from __future__ import annotations

import uuid
import copy
from datetime import datetime, timedelta
from typing import Optional, Literal
from pydantic import BaseModel


class Address(BaseModel):
    street: str = ""
    city: str = ""
    province: str = ""
    country: str = "Ecuador"


class ClientContact(BaseModel):
    name: str
    email: str
    phone: str = ""
    role: str = ""


class ClientCreate(BaseModel):
    legal_name: str
    ruc: str
    trade_name: str = ""
    segment: Literal["small", "medium", "enterprise"] = "small"
    industry: str = ""
    address: Address = Address()
    contacts: list[ClientContact] = []
    phone: str = ""
    email: str = ""
    website: str = ""
    notes: str = ""
    status: Literal["active", "inactive", "prospect", "churned"] = "active"


class Client(ClientCreate):
    id: str
    created_at: str
    updated_at: str
    last_interaction: Optional[str] = None
    total_billed: float = 0.0
    outstanding_balance: float = 0.0
    mrr: float = 0.0
    contracts_count: int = 0
    lifetime_value: float = 0.0


class Contract(BaseModel):
    id: str = ""
    client_id: str = ""
    title: str
    type: Literal["fijo", "recurrente", "proyecto", "honorarios"]
    start_date: str
    end_date: Optional[str] = None
    monthly_value: float
    setup_fee: float = 0.0
    status: Literal["active", "completed", "cancelled", "draft"]
    terms: str = ""
    signed_at: Optional[str] = None
    renewal_auto: bool = True


class Invoice(BaseModel):
    id: str = ""
    client_id: str = ""
    contract_id: Optional[str] = None
    number: str = ""
    issue_date: str = ""
    due_date: str = ""
    subtotal: float = 0.0
    iva_rate: float = 0.15
    iva_amount: float = 0.0
    total: float = 0.0
    status: Literal["emitida", "pagada", "vencida", "anulada"] = "emitida"
    paid_at: Optional[str] = None
    paid_amount: Optional[float] = None
    items: list[dict] = []


class Payment(BaseModel):
    id: str = ""
    client_id: str = ""
    invoice_id: str = ""
    amount: float
    method: Literal["transferencia", "tarjeta", "efectivo", "cheque"]
    paid_at: str
    reference: str = ""
    notes: str = ""


class ClientHistory(BaseModel):
    id: str
    client_id: str
    event_type: Literal["created", "contract_signed", "invoice_issued", "payment_received", "contract_ended", "status_change", "note"]
    description: str
    created_at: str
    metadata: dict = {}


def _now_str() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _id() -> str:
    return uuid.uuid4().hex[:12]


def _make_invoice_number(seq: int) -> str:
    return f"001-001-{seq:09d}"


_iva_rate = 0.15


def _calc_iva(subtotal: float) -> float:
    return round(subtotal * _iva_rate, 2)


def _total_from_subtotal(subtotal: float) -> float:
    return round(subtotal + _calc_iva(subtotal), 2)


INITIAL_CLIENTS = [
    {
        "id": "cli001",
        "legal_name": "TECHNOLOGY SOLUTIONS ECUADOR S.A.",
        "ruc": "1791234567001",
        "trade_name": "TechSol EC",
        "segment": "enterprise",
        "industry": "technology",
        "address": {"street": "Av. Naciones Unidas 1040", "city": "Quito", "province": "Pichincha", "country": "Ecuador"},
        "contacts": [{"name": "Carlos Méndez", "email": "cmendez@techsol.ec", "phone": "+593 99 123 4567", "role": "CFO"}],
        "phone": "+593 2 234 5678",
        "email": "info@techsol.ec",
        "website": "www.techsol.ec",
        "notes": "Cliente premium - soporte 24/7",
        "status": "active",
        "created_at": "2023-01-15T10:00:00Z",
        "updated_at": "2026-06-01T08:00:00Z",
        "last_interaction": "2026-06-28T14:30:00Z",
        "total_billed": 285000.0,
        "outstanding_balance": 0.0,
        "mrr": 25000.0,
        "contracts_count": 3,
        "lifetime_value": 285000.0,
    },
    {
        "id": "cli002",
        "legal_name": "CONSTRUCTORA DEL PACÍFICO CÍA. LTDA.",
        "ruc": "1792345678001",
        "trade_name": "ConstrPacifico",
        "segment": "enterprise",
        "industry": "construction",
        "address": {"street": "Av. 9 de Octubre 2200", "city": "Guayaquil", "province": "Guayas", "country": "Ecuador"},
        "contacts": [{"name": "María Fernanda López", "email": "mflopez@constrpac.ec", "phone": "+593 4 345 6789", "role": "Gerente Financiera"}],
        "phone": "+593 4 345 6789",
        "email": "contacto@constrpac.ec",
        "website": "www.constrpac.ec",
        "notes": "",
        "status": "active",
        "created_at": "2023-03-01T09:00:00Z",
        "updated_at": "2026-05-15T11:00:00Z",
        "last_interaction": "2026-06-25T10:00:00Z",
        "total_billed": 198000.0,
        "outstanding_balance": 4500.0,
        "mrr": 18000.0,
        "contracts_count": 2,
        "lifetime_value": 198000.0,
    },
    {
        "id": "cli003",
        "legal_name": "COMERCIALIZADORA ANDINA S.A.",
        "ruc": "1793456789001",
        "trade_name": "ComAndina",
        "segment": "medium",
        "industry": "commerce",
        "address": {"street": "Av. Amazonas 3456", "city": "Quito", "province": "Pichincha", "country": "Ecuador"},
        "contacts": [{"name": "Pedro Jiménez", "email": "pjimenez@comandina.ec", "phone": "+593 2 456 7890", "role": "Gerente General"}],
        "phone": "+593 2 456 7890",
        "email": "ventas@comandina.ec",
        "website": "www.comandina.ec",
        "notes": "Cliente recurrente desde 2023",
        "status": "active",
        "created_at": "2023-06-10T08:30:00Z",
        "updated_at": "2026-06-20T09:00:00Z",
        "last_interaction": "2026-06-20T09:00:00Z",
        "total_billed": 96000.0,
        "outstanding_balance": 0.0,
        "mrr": 5500.0,
        "contracts_count": 2,
        "lifetime_value": 96000.0,
    },
    {
        "id": "cli004",
        "legal_name": "AGROINDUSTRIAL DEL SUR S.A.",
        "ruc": "0194567890001",
        "trade_name": "AgroSur",
        "segment": "medium",
        "industry": "agriculture",
        "address": {"street": "Calle Larga 12-34", "city": "Cuenca", "province": "Azuay", "country": "Ecuador"},
        "contacts": [{"name": "Ana Lucía Torres", "email": "altorres@agrosur.ec", "phone": "+593 7 567 8901", "role": "Contadora"}],
        "phone": "+593 7 567 8901",
        "email": "info@agrosur.ec",
        "website": "www.agrosur.ec",
        "notes": "",
        "status": "active",
        "created_at": "2023-09-20T11:00:00Z",
        "updated_at": "2026-05-10T16:00:00Z",
        "last_interaction": "2026-06-15T08:00:00Z",
        "total_billed": 72000.0,
        "outstanding_balance": 3200.0,
        "mrr": 4500.0,
        "contracts_count": 2,
        "lifetime_value": 72000.0,
    },
    {
        "id": "cli005",
        "legal_name": "MANUFACTURAS UNIDAS CÍA. LTDA.",
        "ruc": "1395678901001",
        "trade_name": "ManuUnidas",
        "segment": "medium",
        "industry": "manufacturing",
        "address": {"street": "Av. La Prensa 567", "city": "Manta", "province": "Manabí", "country": "Ecuador"},
        "contacts": [{"name": "Roberto Sánchez", "email": "rsanchez@manuunidas.ec", "phone": "+593 5 678 9012", "role": "Gerente de Operaciones"}],
        "phone": "+593 5 678 9012",
        "email": "info@manuunidas.ec",
        "website": "www.manuunidas.ec",
        "notes": "Requiere facturación electrónica prioritaria",
        "status": "active",
        "created_at": "2024-01-10T07:00:00Z",
        "updated_at": "2026-06-10T14:00:00Z",
        "last_interaction": "2026-06-10T14:00:00Z",
        "total_billed": 54000.0,
        "outstanding_balance": 0.0,
        "mrr": 4000.0,
        "contracts_count": 2,
        "lifetime_value": 54000.0,
    },
    {
        "id": "cli006",
        "legal_name": "SERVICIOS EMPRESARIALES DEL ECUADOR S.A.",
        "ruc": "1796789012001",
        "trade_name": "ServEmp EC",
        "segment": "medium",
        "industry": "services",
        "address": {"street": "Av. De Los Shyris 789", "city": "Quito", "province": "Pichincha", "country": "Ecuador"},
        "contacts": [{"name": "Diana Castillo", "email": "dcastillo@servemp.ec", "phone": "+593 2 789 0123", "role": "Gerente Administrativa"}],
        "phone": "+593 2 789 0123",
        "email": "servicios@servemp.ec",
        "website": "www.servemp.ec",
        "notes": "",
        "status": "active",
        "created_at": "2024-03-15T10:30:00Z",
        "updated_at": "2026-06-18T12:00:00Z",
        "last_interaction": "2026-06-18T12:00:00Z",
        "total_billed": 38000.0,
        "outstanding_balance": 1800.0,
        "mrr": 3500.0,
        "contracts_count": 1,
        "lifetime_value": 38000.0,
    },
    {
        "id": "cli007",
        "legal_name": "CONSULTORES ASOCIADOS S.A.",
        "ruc": "1797890123001",
        "trade_name": "ConAsociados",
        "segment": "small",
        "industry": "consulting",
        "address": {"street": "Calle La Rábida 345", "city": "Quito", "province": "Pichincha", "country": "Ecuador"},
        "contacts": [{"name": "Fernando Vega", "email": "fvega@conasociados.ec", "phone": "+593 2 890 1234", "role": "Socio"}],
        "phone": "+593 2 890 1234",
        "email": "info@conasociados.ec",
        "website": "www.conasociados.ec",
        "notes": "Contrato de honorarios mensuales",
        "status": "active",
        "created_at": "2024-06-01T09:00:00Z",
        "updated_at": "2026-06-22T15:00:00Z",
        "last_interaction": "2026-06-22T15:00:00Z",
        "total_billed": 24000.0,
        "outstanding_balance": 0.0,
        "mrr": 1200.0,
        "contracts_count": 1,
        "lifetime_value": 24000.0,
    },
    {
        "id": "cli008",
        "legal_name": "NEGOCIOS Y TECNOLOGÍA CÍA. LTDA.",
        "ruc": "1898901234001",
        "trade_name": "NegTech",
        "segment": "small",
        "industry": "technology",
        "address": {"street": "Av. Cevallos 789", "city": "Ambato", "province": "Tungurahua", "country": "Ecuador"},
        "contacts": [{"name": "Luis Morales", "email": "lmorales@negtech.ec", "phone": "+593 3 901 2345", "role": "Gerente"}],
        "phone": "+593 3 901 2345",
        "email": "contacto@negtech.ec",
        "website": "www.negtech.ec",
        "notes": "",
        "status": "active",
        "created_at": "2024-08-10T08:00:00Z",
        "updated_at": "2026-05-20T10:00:00Z",
        "last_interaction": "2026-05-20T10:00:00Z",
        "total_billed": 18000.0,
        "outstanding_balance": 0.0,
        "mrr": 1000.0,
        "contracts_count": 1,
        "lifetime_value": 18000.0,
    },
    {
        "id": "cli009",
        "legal_name": "COMERCIAL LOJA S.A.",
        "ruc": "1199012345001",
        "trade_name": "ComLoja",
        "segment": "small",
        "industry": "commerce",
        "address": {"street": "Calle 10 de Agosto 456", "city": "Loja", "province": "Loja", "country": "Ecuador"},
        "contacts": [{"name": "Sofía Guamán", "email": "sguaman@comloja.ec", "phone": "+593 7 012 3456", "role": "Contadora"}],
        "phone": "+593 7 012 3456",
        "email": "info@comloja.ec",
        "website": "www.comloja.ec",
        "notes": "Nuevo cliente - prospección",
        "status": "prospect",
        "created_at": "2026-05-10T11:00:00Z",
        "updated_at": "2026-06-01T09:00:00Z",
        "last_interaction": "2026-06-01T09:00:00Z",
        "total_billed": 0.0,
        "outstanding_balance": 0.0,
        "mrr": 0.0,
        "contracts_count": 0,
        "lifetime_value": 0.0,
    },
    {
        "id": "cli010",
        "legal_name": "INNOVA TECHNOLOGY GROUP S.A.",
        "ruc": "1790123456001",
        "trade_name": "InnovaTech",
        "segment": "enterprise",
        "industry": "technology",
        "address": {"street": "Av. Orellana 1500", "city": "Guayaquil", "province": "Guayas", "country": "Ecuador"},
        "contacts": [{"name": "Andrés Rivera", "email": "arivera@innovatech.ec", "phone": "+593 4 123 4567", "role": "CEO"}],
        "phone": "+593 4 123 4567",
        "email": "info@innovatech.ec",
        "website": "www.innovatech.ec",
        "notes": "Cliente estratégico - consultoría TI",
        "status": "active",
        "created_at": "2023-11-01T10:00:00Z",
        "updated_at": "2026-06-25T16:00:00Z",
        "last_interaction": "2026-06-25T16:00:00Z",
        "total_billed": 350000.0,
        "outstanding_balance": 0.0,
        "mrr": 35000.0,
        "contracts_count": 2,
        "lifetime_value": 350000.0,
    },
    {
        "id": "cli011",
        "legal_name": "TRANSPORTES RÁPIDOS CÍA. LTDA.",
        "ruc": "1791234567002",
        "trade_name": "TransRápidos",
        "segment": "medium",
        "industry": "services",
        "address": {"street": "Av. Maldonado 567", "city": "Quito", "province": "Pichincha", "country": "Ecuador"},
        "contacts": [{"name": "Jorge Medina", "email": "jmedina@transrapidos.ec", "phone": "+593 2 234 5679", "role": "Gerente"}],
        "phone": "+593 2 234 5679",
        "email": "info@transrapidos.ec",
        "website": "www.transrapidos.ec",
        "notes": "Cliente inactivo - no renovó contrato",
        "status": "inactive",
        "created_at": "2023-05-15T08:00:00Z",
        "updated_at": "2025-12-01T17:00:00Z",
        "last_interaction": "2025-12-01T17:00:00Z",
        "total_billed": 60000.0,
        "outstanding_balance": 2500.0,
        "mrr": 0.0,
        "contracts_count": 1,
        "lifetime_value": 60000.0,
    },
    {
        "id": "cli012",
        "legal_name": "MINERÍA DEL NORTE S.A.",
        "ruc": "1098765432001",
        "trade_name": "Minera Norte",
        "segment": "medium",
        "industry": "manufacturing",
        "address": {"street": "Calle Bolívar 234", "city": "Ibarra", "province": "Imbabura", "country": "Ecuador"},
        "contacts": [{"name": "Patricia Ortiz", "email": "portiz@mineranorte.ec", "phone": "+593 6 345 6780", "role": "CFO"}],
        "phone": "+593 6 345 6780",
        "email": "info@mineranorte.ec",
        "website": "www.mineranorte.ec",
        "notes": "Contrato de consultoría ambiental",
        "status": "active",
        "created_at": "2025-01-20T09:30:00Z",
        "updated_at": "2026-06-12T11:00:00Z",
        "last_interaction": "2026-06-12T11:00:00Z",
        "total_billed": 32000.0,
        "outstanding_balance": 0.0,
        "mrr": 3000.0,
        "contracts_count": 1,
        "lifetime_value": 32000.0,
    },
    {
        "id": "cli013",
        "legal_name": "DISTRIBUIDORA DEL VALLE S.A.",
        "ruc": "1390123456001",
        "trade_name": "DistriValle",
        "segment": "small",
        "industry": "commerce",
        "address": {"street": "Av. del Ejército 890", "city": "Manta", "province": "Manabí", "country": "Ecuador"},
        "contacts": [{"name": "Mónica Vera", "email": "mvera@distrivalle.ec", "phone": "+593 5 456 7891", "role": "Gerente"}],
        "phone": "+593 5 456 7891",
        "email": "ventas@distrivalle.ec",
        "website": "www.distrivalle.ec",
        "notes": "",
        "status": "active",
        "created_at": "2025-06-01T08:00:00Z",
        "updated_at": "2026-06-05T10:00:00Z",
        "last_interaction": "2026-06-05T10:00:00Z",
        "total_billed": 8000.0,
        "outstanding_balance": 600.0,
        "mrr": 800.0,
        "contracts_count": 1,
        "lifetime_value": 8000.0,
    },
    {
        "id": "cli014",
        "legal_name": "ESTUDIO JURÍDICO MONTENEGRO & ASOCIADOS",
        "ruc": "1792345678002",
        "trade_name": "Montenegro Abogados",
        "segment": "small",
        "industry": "services",
        "address": {"street": "Av. 12 de Octubre 543", "city": "Quito", "province": "Pichincha", "country": "Ecuador"},
        "contacts": [{"name": "Dr. Ricardo Montenegro", "email": "rmontenegro@estudiojur.ec", "phone": "+593 2 567 8902", "role": "Socio Fundador"}],
        "phone": "+593 2 567 8902",
        "email": "contacto@estudiojur.ec",
        "website": "www.estudiojur.ec",
        "notes": "Campaña de captación - prospecto calificado",
        "status": "prospect",
        "created_at": "2026-05-25T10:00:00Z",
        "updated_at": "2026-06-15T14:00:00Z",
        "last_interaction": "2026-06-15T14:00:00Z",
        "total_billed": 0.0,
        "outstanding_balance": 0.0,
        "mrr": 0.0,
        "contracts_count": 0,
        "lifetime_value": 0.0,
    },
    {
        "id": "cli015",
        "legal_name": "HOTELERA NACIONAL S.A.",
        "ruc": "1793456789002",
        "trade_name": "Hotelera Nacional",
        "segment": "medium",
        "industry": "services",
        "address": {"street": "Av. de la Prensa 1234", "city": "Quito", "province": "Pichincha", "country": "Ecuador"},
        "contacts": [{"name": "Gabriela Ruiz", "email": "gruiz@hoteleranac.ec", "phone": "+593 2 678 9013", "role": "Gerente Financiera"}],
        "phone": "+593 2 678 9013",
        "email": "info@hoteleranac.ec",
        "website": "www.hoteleranac.ec",
        "notes": "Cliente churn - canceló servicios en 2025",
        "status": "churned",
        "created_at": "2023-08-01T09:00:00Z",
        "updated_at": "2025-06-30T18:00:00Z",
        "last_interaction": "2025-06-30T18:00:00Z",
        "total_billed": 45000.0,
        "outstanding_balance": 0.0,
        "mrr": 0.0,
        "contracts_count": 1,
        "lifetime_value": 45000.0,
    },
]

INITIAL_CONTRACTS = [
    {"id": "ctr001", "client_id": "cli001", "title": "Consultoría TI integral", "type": "recurrente", "start_date": "2023-01-15", "end_date": "2027-01-15", "monthly_value": 15000.0, "setup_fee": 5000.0, "status": "active", "terms": "Soporte técnico 24/7, mantenimiento infraestructura", "signed_at": "2023-01-10T10:00:00Z", "renewal_auto": True},
    {"id": "ctr002", "client_id": "cli001", "title": "Desarrollo plataforma e-commerce", "type": "proyecto", "start_date": "2024-06-01", "end_date": "2025-03-01", "monthly_value": 8000.0, "setup_fee": 15000.0, "status": "completed", "terms": "Desarrollo full-stack, integración pasarela de pagos", "signed_at": "2024-05-20T09:00:00Z", "renewal_auto": False},
    {"id": "ctr003", "client_id": "cli001", "title": "Mantenimiento preventivo servidores", "type": "recurrente", "start_date": "2025-04-01", "end_date": None, "monthly_value": 2000.0, "setup_fee": 0.0, "status": "active", "terms": "Monitoreo 24/7, backups diarios", "signed_at": "2025-03-25T11:00:00Z", "renewal_auto": True},
    {"id": "ctr004", "client_id": "cli002", "title": "Consultoría financiera proyectos", "type": "recurrente", "start_date": "2023-03-01", "end_date": "2026-12-31", "monthly_value": 12000.0, "setup_fee": 3000.0, "status": "active", "terms": "Gestión financiera proyectos construcción", "signed_at": "2023-02-25T08:00:00Z", "renewal_auto": True},
    {"id": "ctr005", "client_id": "cli002", "title": "Auditoría externa 2025", "type": "proyecto", "start_date": "2025-01-01", "end_date": "2025-06-30", "monthly_value": 6000.0, "setup_fee": 2000.0, "status": "completed", "terms": "Auditoría completa estados financieros", "signed_at": "2024-12-15T10:00:00Z", "renewal_auto": False},
    {"id": "ctr006", "client_id": "cli003", "title": "Asesoría tributaria mensual", "type": "recurrente", "start_date": "2023-06-10", "end_date": None, "monthly_value": 3500.0, "setup_fee": 1000.0, "status": "active", "terms": "Declaraciones mensuales IVA, Retenciones, ATS", "signed_at": "2023-06-05T09:00:00Z", "renewal_auto": True},
    {"id": "ctr007", "client_id": "cli003", "title": "Implementación sistema contable", "type": "proyecto", "start_date": "2024-02-01", "end_date": "2024-08-01", "monthly_value": 2000.0, "setup_fee": 8000.0, "status": "completed", "terms": "Implementación SAP B1", "signed_at": "2024-01-20T11:00:00Z", "renewal_auto": False},
    {"id": "ctr008", "client_id": "cli004", "title": "Consultoría agrícola sostenible", "type": "recurrente", "start_date": "2023-09-20", "end_date": "2026-12-31", "monthly_value": 3000.0, "setup_fee": 1500.0, "status": "active", "terms": "Asesoría técnicas sostenibles, certificaciones", "signed_at": "2023-09-15T10:00:00Z", "renewal_auto": True},
    {"id": "ctr009", "client_id": "cli004", "title": "Estudio de impacto ambiental", "type": "proyecto", "start_date": "2025-03-01", "end_date": "2025-09-01", "monthly_value": 1500.0, "setup_fee": 5000.0, "status": "completed", "terms": "Estudio completo impacto ambiental", "signed_at": "2025-02-15T09:00:00Z", "renewal_auto": False},
    {"id": "ctr010", "client_id": "cli005", "title": "Optimización procesos manufactureros", "type": "recurrente", "start_date": "2024-01-10", "end_date": None, "monthly_value": 4000.0, "setup_fee": 2500.0, "status": "active", "terms": "Mejora continua procesos, Lean manufacturing", "signed_at": "2024-01-05T10:00:00Z", "renewal_auto": True},
    {"id": "ctr011", "client_id": "cli005", "title": "Certificación ISO 9001", "type": "proyecto", "start_date": "2025-06-01", "end_date": "2026-02-28", "monthly_value": 0.0, "setup_fee": 12000.0, "status": "completed", "terms": "Implementación y certificación ISO 9001:2025", "signed_at": "2025-05-15T11:00:00Z", "renewal_auto": False},
    {"id": "ctr012", "client_id": "cli006", "title": "Tercerización nómina", "type": "recurrente", "start_date": "2024-03-15", "end_date": None, "monthly_value": 3500.0, "setup_fee": 2000.0, "status": "active", "terms": "Gestión completa nómina, roles de pago, IESS", "signed_at": "2024-03-10T09:00:00Z", "renewal_auto": True},
    {"id": "ctr013", "client_id": "cli007", "title": "Honorarios consultoría fiscal", "type": "honorarios", "start_date": "2024-06-01", "end_date": None, "monthly_value": 1200.0, "setup_fee": 0.0, "status": "active", "terms": "Asesoría fiscal mensual, planificación tributaria", "signed_at": "2024-05-28T10:00:00Z", "renewal_auto": False},
    {"id": "ctr014", "client_id": "cli008", "title": "Desarrollo app gestión inventarios", "type": "proyecto", "start_date": "2024-08-10", "end_date": "2025-04-10", "monthly_value": 1000.0, "setup_fee": 6000.0, "status": "completed", "terms": "App web gestión inventarios en tiempo real", "signed_at": "2024-08-05T09:00:00Z", "renewal_auto": False},
    {"id": "ctr015", "client_id": "cli010", "title": "Consultoría transformación digital", "type": "recurrente", "start_date": "2023-11-01", "end_date": "2027-11-01", "monthly_value": 25000.0, "setup_fee": 10000.0, "status": "active", "terms": "Transformación digital integral, cloud, ciberseguridad", "signed_at": "2023-10-25T10:00:00Z", "renewal_auto": True},
    {"id": "ctr016", "client_id": "cli010", "title": "Soporte infraestructura cloud", "type": "recurrente", "start_date": "2024-01-01", "end_date": None, "monthly_value": 10000.0, "setup_fee": 0.0, "status": "active", "terms": "Soporte AWS/Azure, migración cloud", "signed_at": "2023-12-20T11:00:00Z", "renewal_auto": True},
    {"id": "ctr017", "client_id": "cli011", "title": "Gestión flota vehicular", "type": "recurrente", "start_date": "2023-05-15", "end_date": "2025-11-30", "monthly_value": 5000.0, "setup_fee": 2000.0, "status": "cancelled", "terms": "Sistema gestión flota, GPS, mantenimiento", "signed_at": "2023-05-10T09:00:00Z", "renewal_auto": True},
    {"id": "ctr018", "client_id": "cli012", "title": "Consultoría ambiental minería", "type": "recurrente", "start_date": "2025-01-20", "end_date": "2027-01-20", "monthly_value": 3000.0, "setup_fee": 2500.0, "status": "active", "terms": "Cumplimiento ambiental, monitoreo, reportes", "signed_at": "2025-01-15T10:00:00Z", "renewal_auto": True},
    {"id": "ctr019", "client_id": "cli013", "title": "Asesoría tributaria básica", "type": "fijo", "start_date": "2025-06-01", "end_date": "2026-12-31", "monthly_value": 800.0, "setup_fee": 500.0, "status": "active", "terms": "Declaraciones IVA mensuales", "signed_at": "2025-05-25T09:00:00Z", "renewal_auto": False},
    {"id": "ctr020", "client_id": "cli015", "title": "Consultoría hotelera integral", "type": "recurrente", "start_date": "2023-08-01", "end_date": "2025-06-30", "monthly_value": 4500.0, "setup_fee": 3000.0, "status": "cancelled", "terms": "Gestión operativa hotelera, revenue management", "signed_at": "2023-07-25T10:00:00Z", "renewal_auto": True},
    {"id": "ctr021", "client_id": "cli001", "title": "Migración datos legacy", "type": "proyecto", "start_date": "2026-02-01", "end_date": "2026-08-01", "monthly_value": 5000.0, "setup_fee": 8000.0, "status": "draft", "terms": "Migración sistemas legacy a cloud", "signed_at": None, "renewal_auto": False},
    {"id": "ctr022", "client_id": "cli002", "title": "Reestructuración financiera", "type": "proyecto", "start_date": "2026-04-01", "end_date": "2026-10-01", "monthly_value": 6000.0, "setup_fee": 5000.0, "status": "active", "terms": "Reestructuración deuda, optimización flujo caja", "signed_at": "2026-03-25T10:00:00Z", "renewal_auto": False},
    {"id": "ctr023", "client_id": "cli006", "title": "Facturación electrónica masiva", "type": "fijo", "start_date": "2025-01-01", "end_date": "2026-12-31", "monthly_value": 500.0, "setup_fee": 1500.0, "status": "completed", "terms": "Emisión facturas electrónicas SRI", "signed_at": "2024-12-20T09:00:00Z", "renewal_auto": False},
]


INITIAL_INVOICES = [
    {"id": "inv001", "client_id": "cli001", "contract_id": "ctr001", "number": "001-001-000000001", "issue_date": "2024-01-15", "due_date": "2024-02-14", "subtotal": 15000.0, "iva_rate": 0.15, "iva_amount": 2250.0, "total": 17250.0, "status": "pagada", "paid_at": "2024-01-30T10:00:00Z", "paid_amount": 17250.0, "items": [{"description": "Consultoría TI integral - Enero 2024", "quantity": 1, "unit_price": 15000.0}]},
    {"id": "inv002", "client_id": "cli001", "contract_id": "ctr001", "number": "001-001-000000002", "issue_date": "2024-02-15", "due_date": "2024-03-15", "subtotal": 15000.0, "iva_rate": 0.15, "iva_amount": 2250.0, "total": 17250.0, "status": "pagada", "paid_at": "2024-03-01T09:00:00Z", "paid_amount": 17250.0, "items": [{"description": "Consultoría TI integral - Febrero 2024", "quantity": 1, "unit_price": 15000.0}]},
    {"id": "inv003", "client_id": "cli001", "contract_id": "ctr002", "number": "001-001-000000003", "issue_date": "2024-06-01", "due_date": "2024-07-01", "subtotal": 8000.0, "iva_rate": 0.15, "iva_amount": 1200.0, "total": 9200.0, "status": "pagada", "paid_at": "2024-06-20T11:00:00Z", "paid_amount": 9200.0, "items": [{"description": "Desarrollo e-commerce - Cuota 1", "quantity": 1, "unit_price": 8000.0}]},
    {"id": "inv004", "client_id": "cli002", "contract_id": "ctr004", "number": "001-001-000000004", "issue_date": "2024-01-01", "due_date": "2024-01-31", "subtotal": 12000.0, "iva_rate": 0.15, "iva_amount": 1800.0, "total": 13800.0, "status": "pagada", "paid_at": "2024-01-25T10:00:00Z", "paid_amount": 13800.0, "items": [{"description": "Consultoría financiera - Enero 2024", "quantity": 1, "unit_price": 12000.0}]},
    {"id": "inv005", "client_id": "cli002", "contract_id": "ctr004", "number": "001-001-000000005", "issue_date": "2024-02-01", "due_date": "2024-02-29", "subtotal": 12000.0, "iva_rate": 0.15, "iva_amount": 1800.0, "total": 13800.0, "status": "pagada", "paid_at": "2024-02-20T09:00:00Z", "paid_amount": 13800.0, "items": [{"description": "Consultoría financiera - Febrero 2024", "quantity": 1, "unit_price": 12000.0}]},
    {"id": "inv006", "client_id": "cli003", "contract_id": "ctr006", "number": "001-001-000000006", "issue_date": "2024-01-10", "due_date": "2024-02-09", "subtotal": 3500.0, "iva_rate": 0.15, "iva_amount": 525.0, "total": 4025.0, "status": "pagada", "paid_at": "2024-01-31T10:00:00Z", "paid_amount": 4025.0, "items": [{"description": "Asesoría tributaria - Enero 2024", "quantity": 1, "unit_price": 3500.0}]},
    {"id": "inv007", "client_id": "cli003", "contract_id": "ctr006", "number": "001-001-000000007", "issue_date": "2024-02-10", "due_date": "2024-03-11", "subtotal": 3500.0, "iva_rate": 0.15, "iva_amount": 525.0, "total": 4025.0, "status": "pagada", "paid_at": "2024-03-01T11:00:00Z", "paid_amount": 4025.0, "items": [{"description": "Asesoría tributaria - Febrero 2024", "quantity": 1, "unit_price": 3500.0}]},
    {"id": "inv008", "client_id": "cli001", "contract_id": "ctr003", "number": "001-001-000000008", "issue_date": "2025-04-01", "due_date": "2025-05-01", "subtotal": 2000.0, "iva_rate": 0.15, "iva_amount": 300.0, "total": 2300.0, "status": "pagada", "paid_at": "2025-04-25T10:00:00Z", "paid_amount": 2300.0, "items": [{"description": "Mantenimiento servidores - Abril 2025", "quantity": 1, "unit_price": 2000.0}]},
    {"id": "inv009", "client_id": "cli001", "contract_id": "ctr001", "number": "001-001-000000009", "issue_date": "2025-01-15", "due_date": "2025-02-14", "subtotal": 15000.0, "iva_rate": 0.15, "iva_amount": 2250.0, "total": 17250.0, "status": "pagada", "paid_at": "2025-02-01T09:00:00Z", "paid_amount": 17250.0, "items": [{"description": "Consultoría TI integral - Enero 2025", "quantity": 1, "unit_price": 15000.0}]},
    {"id": "inv010", "client_id": "cli004", "contract_id": "ctr008", "number": "001-001-000000010", "issue_date": "2024-01-20", "due_date": "2024-02-19", "subtotal": 3000.0, "iva_rate": 0.15, "iva_amount": 450.0, "total": 3450.0, "status": "pagada", "paid_at": "2024-02-10T10:00:00Z", "paid_amount": 3450.0, "items": [{"description": "Consultoría agrícola - Enero 2024", "quantity": 1, "unit_price": 3000.0}]},
    {"id": "inv011", "client_id": "cli004", "contract_id": "ctr008", "number": "001-001-000000011", "issue_date": "2025-06-20", "due_date": "2025-07-20", "subtotal": 3000.0, "iva_rate": 0.15, "iva_amount": 450.0, "total": 3450.0, "status": "vencida", "paid_at": None, "paid_amount": None, "items": [{"description": "Consultoría agrícola - Junio 2025", "quantity": 1, "unit_price": 3000.0}]},
    {"id": "inv012", "client_id": "cli004", "contract_id": "ctr008", "number": "001-001-000000012", "issue_date": "2025-07-20", "due_date": "2025-08-19", "subtotal": 3000.0, "iva_rate": 0.15, "iva_amount": 450.0, "total": 3450.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Consultoría agrícola - Julio 2025", "quantity": 1, "unit_price": 3000.0}]},
    {"id": "inv013", "client_id": "cli005", "contract_id": "ctr010", "number": "001-001-000000013", "issue_date": "2025-01-10", "due_date": "2025-02-09", "subtotal": 4000.0, "iva_rate": 0.15, "iva_amount": 600.0, "total": 4600.0, "status": "pagada", "paid_at": "2025-01-30T11:00:00Z", "paid_amount": 4600.0, "items": [{"description": "Optimización procesos - Enero 2025", "quantity": 1, "unit_price": 4000.0}]},
    {"id": "inv014", "client_id": "cli005", "contract_id": "ctr010", "number": "001-001-000000014", "issue_date": "2026-01-10", "due_date": "2026-02-09", "subtotal": 4000.0, "iva_rate": 0.15, "iva_amount": 600.0, "total": 4600.0, "status": "pagada", "paid_at": "2026-01-28T09:00:00Z", "paid_amount": 4600.0, "items": [{"description": "Optimización procesos - Enero 2026", "quantity": 1, "unit_price": 4000.0}]},
    {"id": "inv015", "client_id": "cli006", "contract_id": "ctr012", "number": "001-001-000000015", "issue_date": "2025-03-15", "due_date": "2025-04-14", "subtotal": 3500.0, "iva_rate": 0.15, "iva_amount": 525.0, "total": 4025.0, "status": "pagada", "paid_at": "2025-04-01T10:00:00Z", "paid_amount": 4025.0, "items": [{"description": "Tercerización nómina - Marzo 2025", "quantity": 1, "unit_price": 3500.0}]},
    {"id": "inv016", "client_id": "cli006", "contract_id": "ctr012", "number": "001-001-000000016", "issue_date": "2026-05-15", "due_date": "2026-06-14", "subtotal": 3500.0, "iva_rate": 0.15, "iva_amount": 525.0, "total": 4025.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Tercerización nómina - Mayo 2026", "quantity": 1, "unit_price": 3500.0}]},
    {"id": "inv017", "client_id": "cli007", "contract_id": "ctr013", "number": "001-001-000000017", "issue_date": "2025-06-01", "due_date": "2025-06-30", "subtotal": 1200.0, "iva_rate": 0.15, "iva_amount": 180.0, "total": 1380.0, "status": "pagada", "paid_at": "2025-06-25T09:00:00Z", "paid_amount": 1380.0, "items": [{"description": "Honorarios consultoría fiscal - Junio 2025", "quantity": 1, "unit_price": 1200.0}]},
    {"id": "inv018", "client_id": "cli008", "contract_id": "ctr014", "number": "001-001-000000018", "issue_date": "2024-08-10", "due_date": "2024-09-09", "subtotal": 1000.0, "iva_rate": 0.15, "iva_amount": 150.0, "total": 1150.0, "status": "pagada", "paid_at": "2024-09-01T10:00:00Z", "paid_amount": 1150.0, "items": [{"description": "Desarrollo app inventarios - Cuota 1", "quantity": 1, "unit_price": 1000.0}]},
    {"id": "inv019", "client_id": "cli010", "contract_id": "ctr015", "number": "001-001-000000019", "issue_date": "2024-01-01", "due_date": "2024-01-31", "subtotal": 25000.0, "iva_rate": 0.15, "iva_amount": 3750.0, "total": 28750.0, "status": "pagada", "paid_at": "2024-01-20T10:00:00Z", "paid_amount": 28750.0, "items": [{"description": "Transformación digital - Enero 2024", "quantity": 1, "unit_price": 25000.0}]},
    {"id": "inv020", "client_id": "cli010", "contract_id": "ctr015", "number": "001-001-000000020", "issue_date": "2025-01-01", "due_date": "2025-01-31", "subtotal": 25000.0, "iva_rate": 0.15, "iva_amount": 3750.0, "total": 28750.0, "status": "pagada", "paid_at": "2025-01-18T09:00:00Z", "paid_amount": 28750.0, "items": [{"description": "Transformación digital - Enero 2025", "quantity": 1, "unit_price": 25000.0}]},
    {"id": "inv021", "client_id": "cli010", "contract_id": "ctr016", "number": "001-001-000000021", "issue_date": "2025-06-01", "due_date": "2025-07-01", "subtotal": 10000.0, "iva_rate": 0.15, "iva_amount": 1500.0, "total": 11500.0, "status": "pagada", "paid_at": "2025-06-25T10:00:00Z", "paid_amount": 11500.0, "items": [{"description": "Soporte cloud - Junio 2025", "quantity": 1, "unit_price": 10000.0}]},
    {"id": "inv022", "client_id": "cli011", "contract_id": "ctr017", "number": "001-001-000000022", "issue_date": "2025-05-15", "due_date": "2025-06-14", "subtotal": 5000.0, "iva_rate": 0.15, "iva_amount": 750.0, "total": 5750.0, "status": "pagada", "paid_at": "2025-06-01T09:00:00Z", "paid_amount": 5750.0, "items": [{"description": "Gestión flota - Mayo 2025", "quantity": 1, "unit_price": 5000.0}]},
    {"id": "inv023", "client_id": "cli012", "contract_id": "ctr018", "number": "001-001-000000023", "issue_date": "2026-01-20", "due_date": "2026-02-19", "subtotal": 3000.0, "iva_rate": 0.15, "iva_amount": 450.0, "total": 3450.0, "status": "pagada", "paid_at": "2026-02-10T10:00:00Z", "paid_amount": 3450.0, "items": [{"description": "Consultoría ambiental - Enero 2026", "quantity": 1, "unit_price": 3000.0}]},
    {"id": "inv024", "client_id": "cli013", "contract_id": "ctr019", "number": "001-001-000000024", "issue_date": "2026-01-01", "due_date": "2026-01-31", "subtotal": 800.0, "iva_rate": 0.15, "iva_amount": 120.0, "total": 920.0, "status": "pagada", "paid_at": "2026-01-25T09:00:00Z", "paid_amount": 920.0, "items": [{"description": "Asesoría tributaria - Enero 2026", "quantity": 1, "unit_price": 800.0}]},
    {"id": "inv025", "client_id": "cli013", "contract_id": "ctr019", "number": "001-001-000000025", "issue_date": "2026-05-01", "due_date": "2026-05-31", "subtotal": 800.0, "iva_rate": 0.15, "iva_amount": 120.0, "total": 920.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Asesoría tributaria - Mayo 2026", "quantity": 1, "unit_price": 800.0}]},
    {"id": "inv026", "client_id": "cli002", "contract_id": "ctr004", "number": "001-001-000000026", "issue_date": "2026-05-01", "due_date": "2026-05-31", "subtotal": 12000.0, "iva_rate": 0.15, "iva_amount": 1800.0, "total": 13800.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Consultoría financiera - Mayo 2026", "quantity": 1, "unit_price": 12000.0}]},
    {"id": "inv027", "client_id": "cli002", "contract_id": "ctr004", "number": "001-001-000000027", "issue_date": "2026-04-01", "due_date": "2026-04-30", "subtotal": 12000.0, "iva_rate": 0.15, "iva_amount": 1800.0, "total": 13800.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Consultoría financiera - Abril 2026", "quantity": 1, "unit_price": 12000.0}]},
    {"id": "inv028", "client_id": "cli003", "contract_id": "ctr006", "number": "001-001-000000028", "issue_date": "2026-05-10", "due_date": "2026-06-09", "subtotal": 3500.0, "iva_rate": 0.15, "iva_amount": 525.0, "total": 4025.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Asesoría tributaria - Mayo 2026", "quantity": 1, "unit_price": 3500.0}]},
    {"id": "inv029", "client_id": "cli005", "contract_id": "ctr010", "number": "001-001-000000029", "issue_date": "2026-05-10", "due_date": "2026-06-09", "subtotal": 4000.0, "iva_rate": 0.15, "iva_amount": 600.0, "total": 4600.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Optimización procesos - Mayo 2026", "quantity": 1, "unit_price": 4000.0}]},
    {"id": "inv030", "client_id": "cli001", "contract_id": "ctr001", "number": "001-001-000000030", "issue_date": "2026-05-15", "due_date": "2026-06-14", "subtotal": 15000.0, "iva_rate": 0.15, "iva_amount": 2250.0, "total": 17250.0, "status": "emitida", "paid_at": None, "paid_amount": None, "items": [{"description": "Consultoría TI integral - Mayo 2026", "quantity": 1, "unit_price": 15000.0}]},
    {"id": "inv031", "client_id": "cli004", "contract_id": "ctr008", "number": "001-001-000000031", "issue_date": "2025-12-20", "due_date": "2026-01-19", "subtotal": 3000.0, "iva_rate": 0.15, "iva_amount": 450.0, "total": 3450.0, "status": "vencida", "paid_at": None, "paid_amount": None, "items": [{"description": "Consultoría agrícola - Diciembre 2025", "quantity": 1, "unit_price": 3000.0}]},
]

INITIAL_PAYMENTS = [
    {"id": "pay001", "client_id": "cli001", "invoice_id": "inv001", "amount": 17250.0, "method": "transferencia", "paid_at": "2024-01-30T10:00:00Z", "reference": "TRF-2024-001", "notes": ""},
    {"id": "pay002", "client_id": "cli001", "invoice_id": "inv002", "amount": 17250.0, "method": "transferencia", "paid_at": "2024-03-01T09:00:00Z", "reference": "TRF-2024-015", "notes": ""},
    {"id": "pay003", "client_id": "cli001", "invoice_id": "inv003", "amount": 9200.0, "method": "transferencia", "paid_at": "2024-06-20T11:00:00Z", "reference": "TRF-2024-042", "notes": "Pago desarrollo e-commerce"},
    {"id": "pay004", "client_id": "cli002", "invoice_id": "inv004", "amount": 13800.0, "method": "cheque", "paid_at": "2024-01-25T10:00:00Z", "reference": "CHE-001234", "notes": ""},
    {"id": "pay005", "client_id": "cli002", "invoice_id": "inv005", "amount": 13800.0, "method": "transferencia", "paid_at": "2024-02-20T09:00:00Z", "reference": "TRF-2024-028", "notes": ""},
    {"id": "pay006", "client_id": "cli003", "invoice_id": "inv006", "amount": 4025.0, "method": "tarjeta", "paid_at": "2024-01-31T10:00:00Z", "reference": "TAR-876543", "notes": ""},
    {"id": "pay007", "client_id": "cli003", "invoice_id": "inv007", "amount": 4025.0, "method": "transferencia", "paid_at": "2024-03-01T11:00:00Z", "reference": "TRF-2024-035", "notes": ""},
    {"id": "pay008", "client_id": "cli001", "invoice_id": "inv008", "amount": 2300.0, "method": "transferencia", "paid_at": "2025-04-25T10:00:00Z", "reference": "TRF-2025-089", "notes": ""},
    {"id": "pay009", "client_id": "cli001", "invoice_id": "inv009", "amount": 17250.0, "method": "transferencia", "paid_at": "2025-02-01T09:00:00Z", "reference": "TRF-2025-022", "notes": ""},
    {"id": "pay010", "client_id": "cli004", "invoice_id": "inv010", "amount": 3450.0, "method": "transferencia", "paid_at": "2024-02-10T10:00:00Z", "reference": "TRF-2024-030", "notes": ""},
    {"id": "pay011", "client_id": "cli005", "invoice_id": "inv013", "amount": 4600.0, "method": "cheque", "paid_at": "2025-01-30T11:00:00Z", "reference": "CHE-004567", "notes": ""},
    {"id": "pay012", "client_id": "cli005", "invoice_id": "inv014", "amount": 4600.0, "method": "transferencia", "paid_at": "2026-01-28T09:00:00Z", "reference": "TRF-2026-008", "notes": ""},
    {"id": "pay013", "client_id": "cli006", "invoice_id": "inv015", "amount": 4025.0, "method": "transferencia", "paid_at": "2025-04-01T10:00:00Z", "reference": "TRF-2025-070", "notes": ""},
    {"id": "pay014", "client_id": "cli007", "invoice_id": "inv017", "amount": 1380.0, "method": "efectivo", "paid_at": "2025-06-25T09:00:00Z", "reference": "EFE-2025-01", "notes": "Pago en efectivo recibido"},
    {"id": "pay015", "client_id": "cli008", "invoice_id": "inv018", "amount": 1150.0, "method": "transferencia", "paid_at": "2024-09-01T10:00:00Z", "reference": "TRF-2024-112", "notes": ""},
    {"id": "pay016", "client_id": "cli010", "invoice_id": "inv019", "amount": 28750.0, "method": "transferencia", "paid_at": "2024-01-20T10:00:00Z", "reference": "TRF-2024-008", "notes": "Pago completo"},
    {"id": "pay017", "client_id": "cli010", "invoice_id": "inv020", "amount": 28750.0, "method": "transferencia", "paid_at": "2025-01-18T09:00:00Z", "reference": "TRF-2025-010", "notes": ""},
    {"id": "pay018", "client_id": "cli010", "invoice_id": "inv021", "amount": 11500.0, "method": "transferencia", "paid_at": "2025-06-25T10:00:00Z", "reference": "TRF-2025-135", "notes": ""},
    {"id": "pay019", "client_id": "cli011", "invoice_id": "inv022", "amount": 5750.0, "method": "transferencia", "paid_at": "2025-06-01T09:00:00Z", "reference": "TRF-2025-098", "notes": ""},
    {"id": "pay020", "client_id": "cli012", "invoice_id": "inv023", "amount": 3450.0, "method": "transferencia", "paid_at": "2026-02-10T10:00:00Z", "reference": "TRF-2026-025", "notes": ""},
    {"id": "pay021", "client_id": "cli013", "invoice_id": "inv024", "amount": 920.0, "method": "tarjeta", "paid_at": "2026-01-25T09:00:00Z", "reference": "TAR-112233", "notes": ""},
    {"id": "pay022", "client_id": "cli002", "invoice_id": "inv026", "amount": 13800.0, "method": "transferencia", "paid_at": "2026-05-28T10:00:00Z", "reference": "TRF-2026-098", "notes": "Pago parcial adelantado"},
    {"id": "pay023", "client_id": "cli003", "invoice_id": "inv028", "amount": 2000.0, "method": "tarjeta", "paid_at": "2026-06-01T09:00:00Z", "reference": "TAR-998877", "notes": "Pago parcial"},
    {"id": "pay024", "client_id": "cli004", "invoice_id": "inv011", "amount": 3450.0, "method": "transferencia", "paid_at": "2026-06-15T10:00:00Z", "reference": "TRF-2026-105", "notes": "Pago factura vencida"},
    {"id": "pay025", "client_id": "cli013", "invoice_id": "inv025", "amount": 500.0, "method": "efectivo", "paid_at": "2026-06-05T11:00:00Z", "reference": "EFE-2026-02", "notes": "Pago parcial"},
]

INITIAL_HISTORY = [
    {"id": "hst001", "client_id": "cli001", "event_type": "created", "description": "Cliente creado", "created_at": "2023-01-15T10:00:00Z", "metadata": {}},
    {"id": "hst002", "client_id": "cli001", "event_type": "contract_signed", "description": "Contrato firmado: Consultoría TI integral", "created_at": "2023-01-10T10:00:00Z", "metadata": {"contract_id": "ctr001"}},
    {"id": "hst003", "client_id": "cli001", "event_type": "invoice_issued", "description": "Factura 001-001-000000001 emitida", "created_at": "2024-01-15T10:00:00Z", "metadata": {"invoice_id": "inv001", "amount": 17250.0}},
    {"id": "hst004", "client_id": "cli001", "event_type": "payment_received", "description": "Pago recibido $17,250.00 - Factura 001-001-000000001", "created_at": "2024-01-30T10:00:00Z", "metadata": {"invoice_id": "inv001", "amount": 17250.0}},
    {"id": "hst005", "client_id": "cli002", "event_type": "created", "description": "Cliente creado", "created_at": "2023-03-01T09:00:00Z", "metadata": {}},
    {"id": "hst006", "client_id": "cli002", "event_type": "contract_signed", "description": "Contrato firmado: Consultoría financiera proyectos", "created_at": "2023-02-25T08:00:00Z", "metadata": {"contract_id": "ctr004"}},
    {"id": "hst007", "client_id": "cli003", "event_type": "created", "description": "Cliente creado", "created_at": "2023-06-10T08:30:00Z", "metadata": {}},
    {"id": "hst008", "client_id": "cli003", "event_type": "contract_signed", "description": "Contrato firmado: Asesoría tributaria mensual", "created_at": "2023-06-05T09:00:00Z", "metadata": {"contract_id": "ctr006"}},
    {"id": "hst009", "client_id": "cli004", "event_type": "created", "description": "Cliente creado", "created_at": "2023-09-20T11:00:00Z", "metadata": {}},
    {"id": "hst010", "client_id": "cli004", "event_type": "contract_signed", "description": "Contrato firmado: Consultoría agrícola sostenible", "created_at": "2023-09-15T10:00:00Z", "metadata": {"contract_id": "ctr008"}},
    {"id": "hst011", "client_id": "cli005", "event_type": "created", "description": "Cliente creado", "created_at": "2024-01-10T07:00:00Z", "metadata": {}},
    {"id": "hst012", "client_id": "cli005", "event_type": "contract_signed", "description": "Contrato firmado: Optimización procesos manufactureros", "created_at": "2024-01-05T10:00:00Z", "metadata": {"contract_id": "ctr010"}},
    {"id": "hst013", "client_id": "cli006", "event_type": "created", "description": "Cliente creado", "created_at": "2024-03-15T10:30:00Z", "metadata": {}},
    {"id": "hst014", "client_id": "cli006", "event_type": "contract_signed", "description": "Contrato firmado: Tercerización nómina", "created_at": "2024-03-10T09:00:00Z", "metadata": {"contract_id": "ctr012"}},
    {"id": "hst015", "client_id": "cli007", "event_type": "created", "description": "Cliente creado", "created_at": "2024-06-01T09:00:00Z", "metadata": {}},
    {"id": "hst016", "client_id": "cli007", "event_type": "contract_signed", "description": "Contrato firmado: Honorarios consultoría fiscal", "created_at": "2024-05-28T10:00:00Z", "metadata": {"contract_id": "ctr013"}},
    {"id": "hst017", "client_id": "cli008", "event_type": "created", "description": "Cliente creado", "created_at": "2024-08-10T08:00:00Z", "metadata": {}},
    {"id": "hst018", "client_id": "cli008", "event_type": "contract_signed", "description": "Contrato firmado: Desarrollo app gestión inventarios", "created_at": "2024-08-05T09:00:00Z", "metadata": {"contract_id": "ctr014"}},
    {"id": "hst019", "client_id": "cli010", "event_type": "created", "description": "Cliente creado", "created_at": "2023-11-01T10:00:00Z", "metadata": {}},
    {"id": "hst020", "client_id": "cli010", "event_type": "contract_signed", "description": "Contrato firmado: Consultoría transformación digital", "created_at": "2023-10-25T10:00:00Z", "metadata": {"contract_id": "ctr015"}},
    {"id": "hst021", "client_id": "cli010", "event_type": "contract_signed", "description": "Contrato firmado: Soporte infraestructura cloud", "created_at": "2023-12-20T11:00:00Z", "metadata": {"contract_id": "ctr016"}},
    {"id": "hst022", "client_id": "cli011", "event_type": "created", "description": "Cliente creado", "created_at": "2023-05-15T08:00:00Z", "metadata": {}},
    {"id": "hst023", "client_id": "cli011", "event_type": "contract_signed", "description": "Contrato firmado: Gestión flota vehicular", "created_at": "2023-05-10T09:00:00Z", "metadata": {"contract_id": "ctr017"}},
    {"id": "hst024", "client_id": "cli011", "event_type": "contract_ended", "description": "Contrato cancelado: Gestión flota vehicular", "created_at": "2025-11-30T17:00:00Z", "metadata": {"contract_id": "ctr017"}},
    {"id": "hst025", "client_id": "cli011", "event_type": "status_change", "description": "Estado cambiado a: inactive", "created_at": "2025-12-01T17:00:00Z", "metadata": {"old_status": "active", "new_status": "inactive"}},
    {"id": "hst026", "client_id": "cli012", "event_type": "created", "description": "Cliente creado", "created_at": "2025-01-20T09:30:00Z", "metadata": {}},
    {"id": "hst027", "client_id": "cli012", "event_type": "contract_signed", "description": "Contrato firmado: Consultoría ambiental minería", "created_at": "2025-01-15T10:00:00Z", "metadata": {"contract_id": "ctr018"}},
    {"id": "hst028", "client_id": "cli013", "event_type": "created", "description": "Cliente creado", "created_at": "2025-06-01T08:00:00Z", "metadata": {}},
    {"id": "hst029", "client_id": "cli013", "event_type": "contract_signed", "description": "Contrato firmado: Asesoría tributaria básica", "created_at": "2025-05-25T09:00:00Z", "metadata": {"contract_id": "ctr019"}},
    {"id": "hst030", "client_id": "cli015", "event_type": "created", "description": "Cliente creado", "created_at": "2023-08-01T09:00:00Z", "metadata": {}},
    {"id": "hst031", "client_id": "cli015", "event_type": "contract_signed", "description": "Contrato firmado: Consultoría hotelera integral", "created_at": "2023-07-25T10:00:00Z", "metadata": {"contract_id": "ctr020"}},
    {"id": "hst032", "client_id": "cli015", "event_type": "contract_ended", "description": "Contrato cancelado: Consultoría hotelera integral", "created_at": "2025-06-30T18:00:00Z", "metadata": {"contract_id": "ctr020"}},
    {"id": "hst033", "client_id": "cli015", "event_type": "status_change", "description": "Estado cambiado a: churned", "created_at": "2025-06-30T18:00:00Z", "metadata": {"old_status": "active", "new_status": "churned"}},
    {"id": "hst034", "client_id": "cli009", "event_type": "created", "description": "Cliente creado", "created_at": "2026-05-10T11:00:00Z", "metadata": {}},
    {"id": "hst035", "client_id": "cli014", "event_type": "created", "description": "Cliente creado", "created_at": "2026-05-25T10:00:00Z", "metadata": {}},
    {"id": "hst036", "client_id": "cli002", "event_type": "invoice_issued", "description": "Factura 001-001-000000026 emitida", "created_at": "2026-05-01T10:00:00Z", "metadata": {"invoice_id": "inv026", "amount": 13800.0}},
    {"id": "hst037", "client_id": "cli002", "event_type": "contract_signed", "description": "Contrato firmado: Reestructuración financiera", "created_at": "2026-03-25T10:00:00Z", "metadata": {"contract_id": "ctr022"}},
    {"id": "hst038", "client_id": "cli001", "event_type": "contract_signed", "description": "Contrato firmado: Migración datos legacy (borrador)", "created_at": "2026-02-01T10:00:00Z", "metadata": {"contract_id": "ctr021"}},
    {"id": "hst039", "client_id": "cli004", "event_type": "payment_received", "description": "Pago recibido $3,450.00 - Factura vencida", "created_at": "2026-06-15T10:00:00Z", "metadata": {"invoice_id": "inv011", "amount": 3450.0}},
    {"id": "hst040", "client_id": "cli006", "event_type": "invoice_issued", "description": "Factura 001-001-000000016 emitida", "created_at": "2026-05-15T10:00:00Z", "metadata": {"invoice_id": "inv016", "amount": 4025.0}},
    {"id": "hst041", "client_id": "cli009", "event_type": "note", "description": "Contacto inicial - presupuesto enviado", "created_at": "2026-05-15T09:00:00Z", "metadata": {}},
    {"id": "hst042", "client_id": "cli014", "event_type": "note", "description": "Reunión comercial - interesado en paquete básico", "created_at": "2026-06-10T11:00:00Z", "metadata": {}},
    {"id": "hst043", "client_id": "cli001", "event_type": "payment_received", "description": "Pago recibido $17,250.00 - Factura 001-001-000000009", "created_at": "2025-02-01T09:00:00Z", "metadata": {"invoice_id": "inv009", "amount": 17250.0}},
    {"id": "hst044", "client_id": "cli010", "event_type": "payment_received", "description": "Pago recibido $28,750.00 - Factura 001-001-000000020", "created_at": "2025-01-18T09:00:00Z", "metadata": {"invoice_id": "inv020", "amount": 28750.0}},
]


class ClientsEngine:
    """In-memory engine for managing clients, contracts, invoices, payments and history."""

    def __init__(self):
        self._clients: dict[str, dict] = {}
        self._contracts: dict[str, dict] = {}
        self._invoices: dict[str, dict] = {}
        self._payments: dict[str, dict] = {}
        self._history: list[dict] = []
        self._next_invoice_seq: int = 32
        self._load_initial_data()

    # ---------- loading ----------

    def _load_initial_data(self):
        for c in INITIAL_CLIENTS:
            self._clients[c["id"]] = dict(c)
        for c in INITIAL_CONTRACTS:
            self._contracts[c["id"]] = dict(c)
        for inv in INITIAL_INVOICES:
            self._invoices[inv["id"]] = dict(inv)
        for p in INITIAL_PAYMENTS:
            self._payments[p["id"]] = dict(p)
        for h in INITIAL_HISTORY:
            self._history.append(dict(h))

    # ---------- helpers ----------

    def _get_invoice_seq(self) -> int:
        seq = self._next_invoice_seq
        self._next_invoice_seq += 1
        return seq

    # ---------- Client CRUD ----------

    def create_client(self, data: ClientCreate) -> dict:
        client_id = _id()
        now = _now_str()
        client = {
            **data.model_dump(),
            "id": client_id,
            "created_at": now,
            "updated_at": now,
            "last_interaction": None,
            "total_billed": 0.0,
            "outstanding_balance": 0.0,
            "mrr": 0.0,
            "contracts_count": 0,
            "lifetime_value": 0.0,
        }
        self._clients[client_id] = client
        self.log_history(client_id, ClientHistory(
            id=_id(),
            client_id=client_id,
            event_type="created",
            description="Cliente creado",
            created_at=now,
            metadata={},
        ))
        return client

    def get_client(self, client_id: str) -> dict | None:
        return self._clients.get(client_id)

    def update_client(self, client_id: str, data: ClientCreate) -> dict | None:
        client = self._clients.get(client_id)
        if client is None:
            return None
        now = _now_str()
        for key, val in data.model_dump(exclude_unset=True).items():
            client[key] = val
        client["updated_at"] = now
        return client

    def delete_client(self, client_id: str) -> bool:
        client = self._clients.get(client_id)
        if client is None:
            return False
        old_status = client["status"]
        client["status"] = "inactive"
        client["updated_at"] = _now_str()
        self.log_history(client_id, ClientHistory(
            id=_id(),
            client_id=client_id,
            event_type="status_change",
            description="Estado cambiado a: inactive",
            created_at=_now_str(),
            metadata={"old_status": old_status, "new_status": "inactive"},
        ))
        return True

    def list_clients(self, search: str = "", status: str = "", segment: str = "", page: int = 1, limit: int = 20) -> tuple[list[dict], int]:
        items = list(self._clients.values())
        if status:
            items = [c for c in items if c["status"] == status]
        if segment:
            items = [c for c in items if c["segment"] == segment]
        if search:
            s = search.lower()
            items = [c for c in items if s in c["legal_name"].lower() or s in c.get("trade_name", "").lower() or s in c.get("ruc", "")]
        total = len(items)
        start = (page - 1) * limit
        end = start + limit
        return items[start:end], total

    # ---------- Contracts ----------

    def add_contract(self, client_id: str, data: Contract) -> dict | None:
        client = self._clients.get(client_id)
        if client is None:
            return None
        contract_id = _id()
        now = _now_str()
        contract = {
            **data.model_dump(),
            "id": contract_id,
            "client_id": client_id,
        }
        self._contracts[contract_id] = contract
        client["contracts_count"] = sum(1 for c in self._contracts.values() if c["client_id"] == client_id)
        self._recalc_client_mrr(client_id)
        self.log_history(client_id, ClientHistory(
            id=_id(),
            client_id=client_id,
            event_type="contract_signed",
            description=f"Contrato firmado: {data.title}",
            created_at=now,
            metadata={"contract_id": contract_id},
        ))
        return contract

    def get_contracts(self, client_id: str) -> list[dict]:
        return [c for c in self._contracts.values() if c["client_id"] == client_id]

    # ---------- Invoices ----------

    def create_invoice(self, client_id: str, data: dict) -> dict | None:
        client = self._clients.get(client_id)
        if client is None:
            return None
        seq = self._get_invoice_seq()
        inv_id = _id()
        now = _now_str()
        subtotal = float(data.get("subtotal", 0))
        iva_rate_val = float(data.get("iva_rate", 0.15))
        iva_amount = round(subtotal * iva_rate_val, 2)
        total = round(subtotal + iva_amount, 2)
        invoice = {
            "id": inv_id,
            "client_id": client_id,
            "contract_id": data.get("contract_id"),
            "number": _make_invoice_number(seq),
            "issue_date": data.get("issue_date", now[:10]),
            "due_date": data.get("due_date", now[:10]),
            "subtotal": subtotal,
            "iva_rate": iva_rate_val,
            "iva_amount": iva_amount,
            "total": total,
            "status": "emitida",
            "paid_at": None,
            "paid_amount": None,
            "items": data.get("items", []),
        }
        self._invoices[inv_id] = invoice
        client["total_billed"] = round(client["total_billed"] + total, 2)
        client["outstanding_balance"] = round(client["outstanding_balance"] + total, 2)
        self.log_history(client_id, ClientHistory(
            id=_id(),
            client_id=client_id,
            event_type="invoice_issued",
            description=f"Factura {invoice['number']} emitida",
            created_at=now,
            metadata={"invoice_id": inv_id, "amount": total},
        ))
        return invoice

    def get_invoices(self, client_id: str, status_filter: str = "") -> list[dict]:
        items = [inv for inv in self._invoices.values() if inv["client_id"] == client_id]
        if status_filter:
            items = [inv for inv in items if inv["status"] == status_filter]
        return items

    # ---------- Payments ----------

    def record_payment(self, client_id: str, invoice_id: str, data: Payment) -> dict | None:
        client = self._clients.get(client_id)
        if client is None:
            return None
        invoice = self._invoices.get(invoice_id)
        if invoice is None or invoice["client_id"] != client_id:
            return None
        pay_id = _id()
        now = _now_str()
        payment = {
            "id": pay_id,
            "client_id": client_id,
            "invoice_id": invoice_id,
            "amount": data.amount,
            "method": data.method,
            "paid_at": data.paid_at or now,
            "reference": data.reference,
            "notes": data.notes,
        }
        self._payments[pay_id] = payment
        invoice["status"] = "pagada"
        invoice["paid_at"] = payment["paid_at"]
        invoice["paid_amount"] = (invoice.get("paid_amount") or 0) + data.amount
        client["outstanding_balance"] = round(max(0, client["outstanding_balance"] - data.amount), 2)
        client["last_interaction"] = now
        self.log_history(client_id, ClientHistory(
            id=_id(),
            client_id=client_id,
            event_type="payment_received",
            description=f"Pago recibido ${data.amount:,.2f} - Factura {invoice['number']}",
            created_at=now,
            metadata={"invoice_id": invoice_id, "amount": data.amount},
        ))
        return payment

    def get_payments(self, client_id: str) -> list[dict]:
        return [p for p in self._payments.values() if p["client_id"] == client_id]

    # ---------- History ----------

    def log_history(self, client_id: str, event: ClientHistory):
        self._history.append(event.model_dump())

    def get_history(self, client_id: str) -> list[dict]:
        return [h for h in self._history if h["client_id"] == client_id]

    # ---------- Summary ----------

    def _recalc_client_mrr(self, client_id: str):
        contracts = self.get_contracts(client_id)
        active = [c for c in contracts if c["status"] == "active"]
        mrr = sum(c["monthly_value"] for c in active)
        client = self._clients.get(client_id)
        if client:
            client["mrr"] = mrr
            client["contracts_count"] = len(contracts)

    def get_client_summary(self, client_id: str) -> dict | None:
        client = self._clients.get(client_id)
        if client is None:
            return None
        contracts = self.get_contracts(client_id)
        invoices = self.get_invoices(client_id)
        payments = self.get_payments(client_id)
        active_contracts = [c for c in contracts if c["status"] == "active"]
        total_billed = sum(inv["total"] for inv in invoices if inv["status"] == "pagada")
        outstanding = sum(inv["total"] for inv in invoices if inv["status"] in ("emitida", "vencida"))
        mrr = sum(c["monthly_value"] for c in active_contracts)
        arpu = mrr / len(active_contracts) if active_contracts else 0
        return {
            "client_id": client_id,
            "legal_name": client["legal_name"],
            "status": client["status"],
            "segment": client["segment"],
            "total_billed": round(total_billed, 2),
            "outstanding_balance": round(outstanding, 2),
            "mrr": round(mrr, 2),
            "arpu": round(arpu, 2),
            "contracts_total": len(contracts),
            "contracts_active": len(active_contracts),
            "invoices_total": len(invoices),
            "payments_total": len(payments),
            "lifetime_value": round(client.get("lifetime_value", total_billed), 2),
        }

    # ---------- Portfolio ----------

    def get_portfolio_summary(self) -> dict:
        clients = list(self._clients.values())
        total = len(clients)
        active = [c for c in clients if c["status"] == "active"]
        prospects = [c for c in clients if c["status"] == "prospect"]
        churned = [c for c in clients if c["status"] == "churned"]
        active_clients = len(active)
        prospects_count = len(prospects)
        churned_count = len(churned)

        all_contracts = list(self._contracts.values())
        active_contracts = [c for c in all_contracts if c["status"] == "active"]
        mrr_total = sum(c["monthly_value"] for c in active_contracts)
        arr_total = mrr_total * 12
        average_arpu = mrr_total / active_clients if active_clients else 0

        total_at_risk = active_clients + churned_count
        churn_rate_monthly = churned_count / total_at_risk if total_at_risk else 0
        churn_rate_annual = 1 - (1 - churn_rate_monthly) ** 12 if churn_rate_monthly else 0
        lifetime_value_avg = average_arpu / churn_rate_monthly if churn_rate_monthly else 0

        all_invoices = list(self._invoices.values())
        outstanding_total = sum(inv["total"] for inv in all_invoices if inv["status"] in ("emitida", "vencida"))
        total_billed_ytd = sum(inv["total"] for inv in all_invoices if inv["status"] == "pagada" and inv.get("issue_date", "") >= "2026-01-01")

        growth_rate = prospects_count / total if total else 0

        return {
            "total_clients": total,
            "active_clients": active_clients,
            "prospects": prospects_count,
            "churned": churned_count,
            "mrr_total": round(mrr_total, 2),
            "arr_total": round(arr_total, 2),
            "average_arpu": round(average_arpu, 2),
            "churn_rate_monthly": round(churn_rate_monthly, 4),
            "churn_rate_annual": round(churn_rate_annual, 4),
            "lifetime_value_avg": round(lifetime_value_avg, 2),
            "outstanding_total": round(outstanding_total, 2),
            "total_billed_ytd": round(total_billed_ytd, 2),
            "client_growth_rate": round(growth_rate, 4),
        }
