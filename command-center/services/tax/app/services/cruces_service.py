from decimal import Decimal
from typing import List, Dict
from pydantic import BaseModel
import httpx
from app.database import db


class CrucesInput(BaseModel):
    tenant_id: str
    client_ruc: str
    fiscal_period: str


class Inconsistencia(BaseModel):
    tipo: str
    severidad: str
    comprobante: str
    descripcion: str
    sugerencia: str


class CrucesResult(BaseModel):
    total_cruces: int
    inconsistencias: List[Inconsistencia]
    resumen: Dict[str, int]
    compras_no_declaradas: List[str]
    ventas_sin_comprobante: List[str]
    rucs_invalidos: List[str]
    facturas_duplicadas: List[str]


class CrucesService:
    async def execute(self, input_data: CrucesInput) -> CrucesResult:
        inconsistencies: List[Inconsistencia] = []
        rucs_invalidos: List[str] = []
        facturas_duplicadas: List[str] = []

        compras = await db.get_documents(input_data.tenant_id, input_data.client_ruc, "PURCHASE", input_data.fiscal_period)
        ventas = await db.get_documents(input_data.tenant_id, input_data.client_ruc, "SALE", input_data.fiscal_period)
        ats_declarado = await db.get_ats(input_data.tenant_id, input_data.client_ruc, input_data.fiscal_period)

        numeros_vistos = set()
        for c in compras:
            numero = c.get("invoiceNumber", "")
            if numero in numeros_vistos:
                facturas_duplicadas.append(numero)
                inconsistencies.append(Inconsistencia(tipo="DUPLICADA", severidad="ALTA", comprobante=numero, descripcion=f"Factura duplicada: {numero}", sugerencia="Eliminar duplicado."))
            numeros_vistos.add(numero)

        numeros_vistos.clear()
        for v in ventas:
            numero = v.get("invoiceNumber", "")
            if numero in numeros_vistos:
                facturas_duplicadas.append(numero)
                inconsistencies.append(Inconsistencia(tipo="DUPLICADA", severidad="ALTA", comprobante=numero, descripcion=f"Factura venta duplicada: {numero}", sugerencia="Verificar duplicado."))
            numeros_vistos.add(numero)

        for c in compras:
            ruc = c.get("supplierRuc", "")
            if ruc and len(ruc) != 13:
                rucs_invalidos.append(ruc)
                inconsistencies.append(Inconsistencia(tipo="RUC_INEXISTENTE", severidad="ALTA", comprobante=c.get("invoiceNumber", ""), descripcion=f"RUC inválido: {ruc}", sugerencia="Verificar RUC."))

        facturas_ats = set(comp.get("numero") for comp in ats_declarado.get("compras", []))
        facturas_sistema = set(c.get("invoiceNumber") for c in compras)
        compras_no_declaradas = list(facturas_sistema - facturas_ats)
        for numero in compras_no_declaradas[:5]:
            inconsistencies.append(Inconsistencia(tipo="FALTANTE_SRI", severidad="MEDIA", comprobante=numero, descripcion="Compra no declarada en ATS", sugerencia="Incluir en próximo ATS."))

        ventas_sin_comprobante = list(facturas_ats - facturas_sistema)
        for numero in ventas_sin_comprobante[:5]:
            inconsistencies.append(Inconsistencia(tipo="FANTASMA", severidad="ALTA", comprobante=numero, descripcion="Factura en ATS pero no en sistema", sugerencia="Investigar."))

        for c in compras:
            base = Decimal(str(c.get("baseImponible", 0)))
            iva = Decimal(str(c.get("ivaAmount", 0)))
            tarifa = Decimal(str(c.get("ivaRate", 12))) / 100
            iva_esperado = (base * tarifa).quantize(Decimal("0.01"))
            if abs(iva - iva_esperado) > Decimal("0.05"):
                inconsistencies.append(Inconsistencia(tipo="MONTO_INCONSISTENTE", severidad="MEDIA", comprobante=c.get("invoiceNumber", ""), descripcion=f"IVA ({iva}) != base×tarifa ({iva_esperado})", sugerencia="Revisar cálculo IVA."))

        resumen = {
            "total_inconsistencias": len(inconsistencies),
            "alta": sum(1 for i in inconsistencies if i.severidad == "ALTA"),
            "media": sum(1 for i in inconsistencies if i.severidad == "MEDIA"),
            "baja": sum(1 for i in inconsistencies if i.severidad == "BAJA"),
        }

        return CrucesResult(
            total_cruces=len(compras) + len(ventas), inconsistencias=inconsistencies,
            resumen=resumen, compras_no_declaradas=compras_no_declaradas,
            ventas_sin_comprobante=ventas_sin_comprobante, rucs_invalidos=rucs_invalidos,
            facturas_duplicadas=facturas_duplicadas,
        )
