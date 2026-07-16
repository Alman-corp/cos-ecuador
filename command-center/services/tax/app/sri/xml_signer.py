import base64
import hashlib
from datetime import datetime, timezone
from typing import Optional
from dataclasses import dataclass
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.x509 import load_der_x509_certificate
from cryptography.hazmat.backends import default_backend
from lxml import etree
import structlog

logger = structlog.get_logger()

DS_NAMESPACE = "http://www.w3.org/2000/09/xmldsig#"
XADES_NAMESPACE = "http://uri.etsi.org/01903/v1.3.2#"
NSMAP = {"ds": DS_NAMESPACE, "xades": XADES_NAMESPACE}


@dataclass
class CertificateData:
    private_key: rsa.RSAPrivateKey
    certificate_der: bytes
    certificate_pem: str
    serial_number: str
    subject: str
    issuer: str
    valid_from: datetime
    valid_to: datetime

    @property
    def issuer_name(self) -> str:
        return load_der_x509_certificate(self.certificate_der, default_backend()).issuer.rfc4514_string()

    @property
    def subject_name(self) -> str:
        return load_der_x509_certificate(self.certificate_der, default_backend()).subject.rfc4514_string()


class XAdESBESSigner:
    def __init__(self, p12_bytes: bytes, passphrase: str):
        try:
            private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(p12_bytes, passphrase.encode("utf-8"), default_backend())
            if not private_key or not certificate:
                raise ValueError("Certificado .p12 invalido")
            self.private_key = private_key
            self.certificate = certificate
            self.cert_data = CertificateData(
                private_key=private_key,
                certificate_der=certificate.public_bytes(serialization.Encoding.DER),
                certificate_pem=certificate.public_bytes(serialization.Encoding.PEM).decode("utf-8"),
                serial_number=format(certificate.serial_number, 'X'),
                subject=certificate.subject.rfc4514_string(),
                issuer=certificate.issuer.rfc4514_string(),
                valid_from=certificate.not_valid_before_utc,
                valid_to=certificate.not_valid_after_utc,
            )
            logger.info("sri.signer_initialized", subject=self.cert_data.subject, serial=self.cert_data.serial_number)
        except Exception as e:
            logger.error("sri.signer_init_failed", error=str(e))
            raise ValueError(f"No se pudo cargar el certificado .p12: {e}")

    def _digest_sha256(self, data: bytes) -> str:
        return base64.b64encode(hashlib.sha256(data).digest()).decode("utf-8")

    def _canonicalize(self, element: etree._Element) -> bytes:
        return etree.tostring(element, method="c14n", exclusive=False)

    def sign_xml(self, xml_bytes: bytes, reference_uri: str = "", signature_id: str = "Signature-1") -> bytes:
        try:
            parser = etree.XMLParser(remove_blank_text=False, strip_cdata=False)
            root = etree.fromstring(xml_bytes, parser=parser)
            canonicalized_doc = self._canonicalize(root)
            doc_digest = self._digest_sha256(canonicalized_doc)

            signature = etree.Element(f"{{{DS_NAMESPACE}}}Signature", Id=signature_id, nsmap=NSMAP)
            signed_info = etree.SubElement(signature, f"{{{DS_NAMESPACE}}}SignedInfo")
            etree.SubElement(signed_info, f"{{{DS_NAMESPACE}}}CanonicalizationMethod", Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315")
            etree.SubElement(signed_info, f"{{{DS_NAMESPACE}}}SignatureMethod", Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256")
            reference = etree.SubElement(signed_info, f"{{{DS_NAMESPACE}}}Reference", URI="" if not reference_uri else f"#{reference_uri}")
            transforms = etree.SubElement(reference, f"{{{DS_NAMESPACE}}}Transforms")
            etree.SubElement(transforms, f"{{{DS_NAMESPACE}}}Transform", Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature")
            etree.SubElement(reference, f"{{{DS_NAMESPACE}}}DigestMethod", Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
            digest_value_elem = etree.SubElement(reference, f"{{{DS_NAMESPACE}}}DigestValue")
            digest_value_elem.text = doc_digest

            signature_value = etree.SubElement(signature, f"{{{DS_NAMESPACE}}}SignatureValue", Id=f"{signature_id}-SigValue")
            key_info = etree.SubElement(signature, f"{{{DS_NAMESPACE}}}KeyInfo")
            x509_data = etree.SubElement(key_info, f"{{{DS_NAMESPACE}}}X509Data")
            x509_cert = etree.SubElement(x509_data, f"{{{DS_NAMESPACE}}}X509Certificate")
            x509_cert.text = base64.b64encode(self.cert_data.certificate_der).decode("utf-8")

            key_value = etree.SubElement(key_info, f"{{{DS_NAMESPACE}}}KeyValue")
            rsa_key_value = etree.SubElement(key_value, f"{{{DS_NAMESPACE}}}RSAKeyValue")
            modulus = etree.SubElement(rsa_key_value, f"{{{DS_NAMESPACE}}}Modulus")
            exponent = etree.SubElement(rsa_key_value, f"{{{DS_NAMESPACE}}}Exponent")
            pub_numbers = self.private_key.public_key().public_numbers()
            modulus.text = base64.b64encode(pub_numbers.n.to_bytes((pub_numbers.n.bit_length() + 7) // 8, 'big')).decode("utf-8")
            exponent.text = base64.b64encode(pub_numbers.e.to_bytes((pub_numbers.e.bit_length() + 7) // 8, 'big')).decode("utf-8")

            xades_object = etree.SubElement(signature, f"{{{DS_NAMESPACE}}}Object")
            qualifying_properties = etree.SubElement(xades_object, f"{{{XADES_NAMESPACE}}}QualifyingProperties", Target=f"#{signature_id}")
            signed_properties = etree.SubElement(qualifying_properties, f"{{{XADES_NAMESPACE}}}SignedProperties", Id=f"{signature_id}-SignedProperties")
            signing_cert = etree.SubElement(signed_properties, f"{{{XADES_NAMESPACE}}}SigningCertificate")
            cert_elem = etree.SubElement(signing_cert, f"{{{XADES_NAMESPACE}}}Cert")
            cert_digest = etree.SubElement(cert_elem, f"{{{XADES_NAMESPACE}}}CertDigest")
            etree.SubElement(cert_digest, f"{{{DS_NAMESPACE}}}DigestMethod", Algorithm="http://www.w3.org/2001/04/xmlenc#sha256")
            digest_val = etree.SubElement(cert_digest, f"{{{DS_NAMESPACE}}}DigestValue")
            digest_val.text = self._digest_sha256(self.cert_data.certificate_der)
            issuer_serial = etree.SubElement(cert_elem, f"{{{XADES_NAMESPACE}}}IssuerSerial")
            etree.SubElement(issuer_serial, f"{{{DS_NAMESPACE}}}X509IssuerName").text = self.cert_data.issuer_name
            etree.SubElement(issuer_serial, f"{{{DS_NAMESPACE}}}X509SerialNumber").text = str(self.certificate.serial_number)
            etree.SubElement(signed_properties, f"{{{XADES_NAMESPACE}}}SigningTime").text = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            signed_info_canon = self._canonicalize(signed_info)
            signature_bytes = self.private_key.sign(signed_info_canon, padding.PKCS1v15(), hashes.SHA256())
            signature_value.text = base64.b64encode(signature_bytes).decode("utf-8")
            root.append(signature)
            signed_xml = etree.tostring(root, xml_declaration=True, encoding="UTF-8", pretty_print=False)
            logger.info("sri.xml_signed", signature_id=signature_id, size_bytes=len(signed_xml))
            return signed_xml
        except Exception as e:
            logger.exception("sri.sign_failed")
            raise RuntimeError(f"Fallo al firmar XML: {e}")


class CertificateManager:
    def __init__(self, vault_client, storage_client):
        self.vault = vault_client
        self.storage = storage_client

    async def upload_certificate(self, tenant_id: str, client_id: str, p12_bytes: bytes, passphrase: str, alias: str) -> CertificateData:
        signer = XAdESBESSigner(p12_bytes, passphrase)
        cert_data = signer.cert_data
        if cert_data.valid_to < datetime.now(timezone.utc):
            raise ValueError(f"Certificado expirado el {cert_data.valid_to.isoformat()}")
        days_remaining = (cert_data.valid_to - datetime.now(timezone.utc)).days
        if days_remaining < 30:
            logger.warning("sri.certificate_expiring_soon", days=days_remaining, tenant_id=tenant_id)
        vault_key = f"tax/certificates/{tenant_id}/{client_id}/{cert_data.serial_number}"
        await self.vault.write_secret(path=vault_key, data={"passphrase": passphrase, "serial_number": cert_data.serial_number, "subject": cert_data.subject, "uploaded_at": datetime.now(timezone.utc).isoformat()})
        storage_path = f"certificates/{tenant_id}/{client_id}/{cert_data.serial_number}.p12"
        await self.storage.upload(key=storage_path, body=p12_bytes, content_type="application/x-pkcs12")
        logger.info("sri.certificate_uploaded", tenant_id=tenant_id, client_id=client_id, serial=cert_data.serial_number)
        return cert_data

    async def get_certificate(self, tenant_id: str, storage_path: str, vault_key: str) -> XAdESBESSigner:
        secret = await self.vault.read_secret(vault_key)
        passphrase = secret["passphrase"]
        p12_bytes = await self.storage.download(storage_path)
        return XAdESBESSigner(p12_bytes, passphrase)
