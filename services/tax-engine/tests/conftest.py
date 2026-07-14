import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from decimal import Decimal
import pytest
from engines.formularios import (
    Formulario104, TipoDeclaracion, TipoContribuyente,
)
from engines.retenciones_engine import (
    RetencionCalculationInput, TipoRetencion,
)
from engines.renta_engine import (
    PersonalRentaInput, CorporateRentaInput, GastosPersonalesInput,
)
from engines.ice_engine import (
    ICECalculationInput, CategoriaICE,
)
from engines.iva_engine import IVACalculationInput
from generators.xml_ats import (
    VentasATS, ComprasATS, RetencionATS, ATSConfig,
    TipoComprobanteATS, TipoIdentificacion,
)
from generators.xml_retencion import (
    EmisorRetencion, ReceptorRetencion, ImpuestoRetencion,
    RetencionElectronicaConfig,
)
from generators.xml_factura import (
    EmisorFactura, ReceptorFactura, DetalleFactura, FacturaConfig,
    TarifaIVA,
)
from decimal import Decimal, ROUND_HALF_UP


RUC_VALIDO = "1799999999001"
RUC_RECEPTOR = "1712345678001"


def digito_verificador_ruc(ruc: str) -> int:
    """Calcula el dígito verificador del RUC (módulo 11)."""
    coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2]
    if len(ruc) < 10:
        return 0
    suma = sum(int(ruc[i]) * coeficientes[i] for i in range(9))
    residuo = suma % 11
    if residuo == 0:
        return 0
    return 11 - residuo


def assert_decimal_approx(value: Decimal, expected: Decimal, delta: Decimal = Decimal("0.01")):
    """Compara dos Decimales con tolerancia."""
    assert abs(value - expected) <= delta, f"{value} != {expected} (delta {delta})"


@pytest.fixture
def sample_ventas_data():
    return [
        VentasATS(
            codigo_comprobante="01",
            tipo_comprobante=TipoComprobanteATS.FACTURA,
            numero_serie="001-001",
            numero_documento="000000001",
            fecha_emision="15/01/2026",
            identificacion_comprador=RUC_RECEPTOR,
            tipo_identificacion=TipoIdentificacion.RUC,
            base_imponible=Decimal("1000"),
            monto_iva=Decimal("120"),
        ),
        VentasATS(
            codigo_comprobante="01",
            tipo_comprobante=TipoComprobanteATS.FACTURA,
            numero_serie="001-001",
            numero_documento="000000002",
            fecha_emision="20/01/2026",
            identificacion_comprador=RUC_RECEPTOR,
            tipo_identificacion=TipoIdentificacion.RUC,
            base_imponible=Decimal("500"),
            base_imponible_no_iva=Decimal("200"),
            monto_iva=Decimal("60"),
        ),
    ]


@pytest.fixture
def sample_compras_data():
    return [
        ComprasATS(
            codigo_comprobante="01",
            tipo_comprobante=TipoComprobanteATS.FACTURA,
            numero_serie="001-001",
            numero_documento="000000100",
            fecha_emision="10/01/2026",
            identificacion_proveedor=RUC_VALIDO,
            tipo_identificacion=TipoIdentificacion.RUC,
            base_imponible=Decimal("2000"),
            monto_iva=Decimal("240"),
            retencion_iva=Decimal("72"),
            retencion_fuente=Decimal("20"),
        ),
    ]


@pytest.fixture
def sample_retencion_data():
    return [
        RetencionATS(
            codigo_comprobante="07",
            tipo_comprobante=TipoComprobanteATS.COMPROBANTE_RETENCION,
            numero_serie="001-001",
            numero_documento="000000050",
            fecha_emision="15/01/2026",
            identificacion_retenido=RUC_RECEPTOR,
            tipo_identificacion=TipoIdentificacion.RUC,
            base_imponible=Decimal("1000"),
            porcentaje_retencion=Decimal("2"),
            codigo_retencion="304",
            valor_retenido=Decimal("20"),
        ),
    ]


@pytest.fixture
def sample_iva_input():
    return IVACalculationInput(
        ventas_tarifa_12=Decimal("2000"),
        compras_tarifa_12=Decimal("500"),
    )


@pytest.fixture
def sample_form104():
    return Formulario104(
        ruc=RUC_VALIDO,
        razon_social="CONSULTORIA TEST S.A.",
        periodo_fiscal="01-2026",
        tipo_declaracion=TipoDeclaracion.MENSUAL,
        tipo_contribuyente=TipoContribuyente.SOCIEDAD,
        ventas_tarifa_12=Decimal("2000"),
        compras_tarifa_12=Decimal("500"),
    )


@pytest.fixture
def sample_ats_config():
    return ATSConfig(
        ruc=RUC_VALIDO,
        razon_social="CONSULTORIA TEST S.A.",
        periodo="01-2026",
        anio=2026,
        mes=1,
    )
