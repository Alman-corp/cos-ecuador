from fastapi import Header, HTTPException
from app.config import settings


async def get_current_tenant(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    return authorization.replace("Bearer ", "")


async def get_current_tenant_from_query(tenant_id: str = None):
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Missing tenant_id")
    return tenant_id
