from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)


class CurrentUser:
    def __init__(
        self,
        id: str,
        tenant_id: str,
        email: str,
        role: str,
    ):
        self.id = id
        self.tenant_id = tenant_id
        self.email = email
        self.role = role


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> CurrentUser:
    if not credentials:
        raise HTTPException(401, "No autorizado")

    token = credentials.credentials
    try:
        import jwt
        payload = jwt.decode(
            token,
            options={"verify_signature": False},
            algorithms=["HS256"],
        )
        return CurrentUser(
            id=payload.get("sub", ""),
            tenant_id=payload.get("tenant_id", ""),
            email=payload.get("email", ""),
            role=payload.get("role", "user"),
        )
    except Exception:
        raise HTTPException(401, "Token inválido")
