"""Validador XSD para esquemas XML del SRI.
Valida documentos electrónicos contra esquemas XSD oficiales.
"""

from typing import Optional, List, Tuple
from lxml import etree
from pydantic import BaseModel


class XSDValidationError(BaseModel):
    """Error de validación XSD."""
    line: int
    column: int
    message: str


class XSDValidationResult(BaseModel):
    """Resultado de validación XSD."""
    is_valid: bool
    errors: List[XSDValidationError] = []
    warnings: List[str] = []


class XSDValidator:
    """Validador de XML contra esquemas XSD del SRI."""

    def validate(
        self,
        xml_string: str,
        xsd_schema: Optional[str] = None,
    ) -> XSDValidationResult:
        """Valida un XML contra un esquema XSD.
        Args:
            xml_string: XML a validar
            xsd_schema: Schema XSD como string. Si es None, solo valida que sea XML bien formado.
        Returns:
            Resultado de validación
        """
        try:
            xml_doc = etree.fromstring(xml_string.encode("utf-8"))
        except etree.XMLSyntaxError as e:
            error_msg = str(e)
            line = 0
            col = 0
            if hasattr(e, 'position') and e.position:
                line, col = e.position
            return XSDValidationResult(
                is_valid=False,
                errors=[XSDValidationError(
                    line=line, column=col, message=f"XML mal formado: {error_msg}"
                )]
            )

        if xsd_schema is None:
            # Solo validación de XML bien formado
            return XSDValidationResult(is_valid=True)

        try:
            schema_doc = etree.fromstring(xsd_schema.encode("utf-8"))
            schema = etree.XMLSchema(schema_doc)
            is_valid = schema.validate(xml_doc)

            errors: List[XSDValidationError] = []
            if not is_valid:
                for error in schema.error_log:
                    errors.append(XSDValidationError(
                        line=error.line,
                        column=error.column,
                        message=error.message,
                    ))

            return XSDValidationResult(
                is_valid=is_valid,
                errors=errors,
            )
        except etree.XMLSyntaxError as e:
            return XSDValidationResult(
                is_valid=False,
                errors=[XSDValidationError(
                    line=0, column=0, message=f"Schema XSD mal formado: {str(e)}"
                )]
            )
        except etree.XMLSchemaParseError as e:
            return XSDValidationResult(
                is_valid=False,
                errors=[XSDValidationError(
                    line=0, column=0, message=f"Error de parseo del schema XSD: {str(e)}"
                )]
            )

    def validate_against_sri_schema(
        self,
        xml_string: str,
        tipo_comprobante: str,
    ) -> XSDValidationResult:
        """Valida un XML contra el esquema XSD oficial del SRI para un tipo de comprobante.
        Args:
            xml_string: XML del comprobante
            tipo_comprobante: 'factura', 'retencion', 'ats', 'nota_credito', etc.
        """
        # En producción, cargaría el XSD desde archivos locales
        # Aquí validamos que el XML sea bien formado y tenga los elementos mínimos
        ns_map = {
            "factura": "{http://www.sri.gob.ec/factura}factura",
            "retencion": "{http://www.sri.gob.ec/comprobanteRetencion}comprobanteRetencion",
            "ats": "{http://www.sri.gob.ec/ats}ATS",
        }

        try:
            xml_doc = etree.fromstring(xml_string.encode("utf-8"))
        except etree.XMLSyntaxError as e:
            return XSDValidationResult(
                is_valid=False,
                errors=[XSDValidationError(line=0, column=0, message=str(e))]
            )

        expected_tag = ns_map.get(tipo_comprobante)
        if expected_tag:
            tag = xml_doc.tag
            if tag != expected_tag:
                return XSDValidationResult(
                    is_valid=False,
                    errors=[XSDValidationError(
                        line=0, column=0,
                        message=f"Tag root esperado '{expected_tag}', se encontró '{tag}'"
                    )]
                )

        warnings = ["Validación estructural básica superada. En producción cargar XSD oficial."]
        return XSDValidationResult(is_valid=True, warnings=warnings)
