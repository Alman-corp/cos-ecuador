"""Autenticación con SRI - manejo de tokens y contraseñas de firma digital."""

from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import base64
import hashlib


class SRIAuthCredentials(BaseModel):
    """Credenciales de autenticación SRI."""
    ruc: str
    razon_social: str
    token: Optional[str] = None
    token_expiry: Optional[datetime] = None
    ambiente: int = 2  # 1=PROD, 2=TEST


class SRIAuthResponse(BaseModel):
    """Respuesta de autenticación SRI."""
    success: bool
    token: Optional[str] = None
    message: str
    expires_at: Optional[datetime] = None


class SRIAuth:
    """Manejo de autenticación para servicios web SRI.
    En producción, esto se integra con el servicio de SRI para obtener tokens.
    """

    def __init__(self, ruc: str, razon_social: str):
        self.ruc = ruc
        self.razon_social = razon_social
        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None

    def authenticate(
        self,
        password_firma: str,
        ambiente: int = 2
    ) -> SRIAuthResponse:
        """Autentica contra el SRI usando RUC y contraseña de firma electrónica.
        En entorno real, esto consume el servicio de seguridad de SRI.
        """
        if not password_firma or len(password_firma) < 6:
            return SRIAuthResponse(
                success=False,
                message="Contraseña de firma electrónica inválida. Mínimo 6 caracteres.",
            )

        token_raw = f"{self.ruc}:{password_firma}:{datetime.utcnow().isoformat()}"
        token = base64.b64encode(
            hashlib.sha256(token_raw.encode()).digest()
        ).decode()
        expiry = datetime.utcnow() + timedelta(hours=8)

        self._token = token
        self._token_expiry = expiry

        return SRIAuthResponse(
            success=True,
            token=token,
            message="Autenticación exitosa. Token válido por 8 horas.",
            expires_at=expiry,
        )

    def get_token(self) -> Optional[str]:
        """Retorna el token actual si es válido."""
        if self._token and self._token_expiry:
            if datetime.utcnow() < self._token_expiry:
                return self._token
        return None

    def validate_token(self, token: str) -> bool:
        """Valida que un token sea correcto y no haya expirado."""
        if token == self._token and self._token_expiry:
            if datetime.utcnow() < self._token_expiry:
                return True
        return False

    def refresh_token(self) -> Optional[str]:
        """Refresca el token de autenticación."""
        if self._token and self._token_expiry:
            new_expiry = datetime.utcnow() + timedelta(hours=8)
            self._token_expiry = new_expiry
            return self._token
        return None
