"""FirmaEC - Servicio simulado de firma digital ecuatoriana.
En producción se integra con tokens o HSM del SRI.
"""

from datetime import datetime
from typing import Optional
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.backends import default_backend
from cryptography import x509
from cryptography.x509.oid import NameOID
import base64
import os


class FirmaEC:
    """Simulador de firma digital ecuatoriana (FirmaEC).
    En producción, firmarías con el token PKCS#11 o archivo .p12 del SRI.
    """

    def __init__(self):
        self._private_key: Optional[rsa.RSAPrivateKey] = None
        self._certificate: Optional[x509.Certificate] = None

    def _ensure_key(self):
        """Genera o asegura que exista un par de llaves RSA para firma."""
        if self._private_key is None:
            self._private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            subject = issuer = x509.Name([
                x509.NameAttribute(NameOID.COUNTRY_NAME, "EC"),
                x509.NameAttribute(NameOID.ORGANIZATION_NAME, "SRI Ecuador"),
                x509.NameAttribute(NameOID.COMMON_NAME, "FirmaEC Simulada"),
            ])
            self._certificate = (
                x509.CertificateBuilder()
                .subject_name(subject)
                .issuer_name(issuer)
                .public_key(self._private_key.public_key())
                .serial_number(1000)
                .not_valid_before(datetime.utcnow())
                .not_valid_after(datetime.utcnow().replace(year=datetime.utcnow().year + 5))
                .sign(self._private_key, hashes.SHA256(), backend=default_backend())
            )

    def sign(
        self,
        xml_string: str,
        cert_path: Optional[str] = None,
        password: Optional[str] = None
    ) -> str:
        """Firma digitalmente un XML usando el estándar de SRI.
        Retorna el XML firmado con la envoltura de firma digital.
        """
        self._ensure_key()
        xml_bytes = xml_string.encode("utf-8")

        signature = self._private_key.sign(
            xml_bytes,
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        signature_b64 = base64.b64encode(signature).decode()

        cert_der = self._certificate.public_bytes(serialization.Encoding.DER)
        cert_b64 = base64.b64encode(cert_der).decode()

        signed_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<comprobanteFirmado>
    <xmlOriginal><![CDATA[{xml_string}]]></xmlOriginal>
    <firmaDigital>
        <dsig:Signature xmlns:dsig="http://www.w3.org/2000/09/xmldsig#">
            <dsig:SignedInfo>
                <dsig:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                <dsig:SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"/>
                <dsig:Reference URI="">
                    <dsig:DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"/>
                    <dsig:DigestValue>{base64.b64encode(hashlib.sha256(xml_bytes).digest()).decode()}</dsig:DigestValue>
                </dsig:Reference>
            </dsig:SignedInfo>
            <dsig:SignatureValue>{signature_b64}</dsig:SignatureValue>
            <dsig:KeyInfo>
                <dsig:X509Data>
                    <dsig:X509Certificate>{cert_b64}</dsig:X509Certificate>
                </dsig:X509Data>
            </dsig:KeyInfo>
        </dsig:Signature>
    </firmaDigital>
    <fechaFirma>{datetime.utcnow().isoformat()}</fechaFirma>
</comprobanteFirmado>"""
        return signed_xml

    def validate(self, signed_xml: str) -> bool:
        """Valida la firma digital de un XML firmado."""
        self._ensure_key()
        try:
            import re
            match = re.search(
                r"<xmlOriginal><!\[CDATA\[(.*?)\]\]></xmlOriginal>",
                signed_xml,
                re.DOTALL
            )
            if not match:
                return False

            original_xml = match.group(1).encode("utf-8")
            self._private_key.verify(
                original_xml,
                padding.PKCS1v15(),
                hashes.SHA256(),
            )
            return True
        except Exception:
            return False

    def generate_clave_acceso(
        self,
        ruc: str,
        tipo_comprobante: str = "07",
        serie: str = "001001",
        numero: str = "000000001",
        numero_aleatorio: str = "12345678",
        ambiente: int = 2,
        emision: int = 1
    ) -> str:
        """Genera la clave de acceso de 49 dígitos según normativa SRI.
        Formato: Fecha(8) + TipoComp(2) + RUC(13) + Ambiente(1) + Serie(3)
                 + Numero(9) + Aleatorio(8) + Emision(1) + DigitoVerificador(2) = 47 + DV(2)
        """
        fecha = datetime.utcnow().strftime("%d%m%Y")
        base = (
            f"{fecha}"
            f"{tipo_comprobante}"
            f"{ruc.zfill(13)}"
            f"{ambiente}"
            f"{serie.zfill(3)}"
            f"{numero.zfill(9)}"
            f"{numero_aleatorio.zfill(8)}"
            f"{emision}"
        )
        digito = self._calcular_digito_verificador(base)
        return f"{base}{digito:02d}"

    def _calcular_digito_verificador(self, base: str) -> int:
        """Calcula el dígito verificador usando módulo 11."""
        factores = [2, 3, 4, 5, 6, 7]
        suma = 0
        for i, char in enumerate(reversed(base)):
            digito = int(char)
            factor = factores[i % 6]
            suma += digito * factor
        residuo = suma % 11
        digito_verificador = 11 - residuo
        if digito_verificador == 11:
            return 0
        elif digito_verificador == 10:
            return 1
        return digito_verificador


import hashlib
