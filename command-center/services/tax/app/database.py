from app.config import settings
import httpx


class CosDB:
    def __init__(self):
        self.base_url = settings.cos_api_url

    async def get_documents(self, tenant_id: str, client_ruc: str, doc_type: str, period: str):
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/documents",
                params={"tenantId": tenant_id, "clientId": client_ruc, "type": doc_type, "period": period},
            )
            return resp.json() if resp.status_code == 200 else []

    async def get_ats(self, tenant_id: str, client_ruc: str, period: str):
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.base_url}/tax/ats",
                params={"tenantId": tenant_id, "clientRuc": client_ruc, "period": period},
            )
            return resp.json() if resp.status_code == 200 else {}


db = CosDB()
