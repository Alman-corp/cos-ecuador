from typing import List, Optional
from datetime import datetime
import structlog

from app.database import get_prisma

logger = structlog.get_logger()


class SessionManager:
    def __init__(self):
        self.prisma = get_prisma()

    async def create_session(
        self,
        tenant_id: str,
        user_id: str,
        client_id: Optional[str] = None,
        initial_context: Optional[dict] = None,
    ):
        session = await self.prisma.chatsession.create(
            data={
                "companyId": tenant_id,
                "userId": user_id,
                "clientId": client_id,
                "initialContext": initial_context or {},
                "status": "ACTIVE",
            }
        )
        logger.info("session_created", session_id=session.id if hasattr(session, 'id') else None)
        return session

    async def get_session(self, session_id: str, tenant_id: str, user_id: str):
        return await self.prisma.chatsession.find_first(
            where={
                "id": session_id,
                "companyId": tenant_id,
                "userId": user_id,
                "status": {"in": ["ACTIVE", "ARCHIVED"]},
            }
        )

    async def get_session_with_messages(self, session_id: str, tenant_id: str, user_id: str) -> Optional[dict]:
        session = await self.get_session(session_id, tenant_id, user_id)
        if not session:
            return None

        messages = await self.prisma.chatmessage.find_many(
            where={"sessionId": session_id},
            order_by=[{"createdAt": "asc"}],
        )

        return {
            **session.dict(),
            "messages": [m.dict() for m in messages],
        }

    async def add_message(self, session_id: str, tenant_id: str, role: str, content: str, **kwargs):
        message = await self.prisma.chatmessage.create(
            data={
                "companyId": tenant_id,
                "sessionId": session_id,
                "role": role,
                "content": content,
                **kwargs,
            }
        )

        await self.prisma.chatsession.update(
            where={"id": session_id},
            data={"lastMessageAt": datetime.utcnow()},
        )

        return message

    async def get_history(self, session_id: str, limit: int = 20) -> List[dict]:
        messages = await self.prisma.chatmessage.find_many(
            where={"sessionId": session_id},
            order_by=[{"createdAt": "desc"}],
            take=limit,
        )

        messages = sorted(messages, key=lambda m: m.createdAt)

        return [
            {
                "role": m.role.lower(),
                "content": m.content,
            }
            for m in messages
        ]

    async def list_sessions(self, tenant_id: str, user_id: str, limit: int = 50) -> List[dict]:
        sessions = await self.prisma.chatsession.find_many(
            where={
                "companyId": tenant_id,
                "userId": user_id,
                "status": {"in": ["ACTIVE", "ARCHIVED"]},
            },
            order_by=[{"lastMessageAt": "desc"}],
            take=limit,
            include={
                "messages": {
                    "take": 1,
                    "order_by": [{"createdAt": "asc"}],
                }
            },
        )

        return [
            {
                "id": s.id,
                "title": s.title or (s.messages[0].content[:60] + "..." if s.messages else "Nueva sesión"),
                "primary_agent": s.primaryAgent,
                "total_tokens": s.totalTokens,
                "total_cost_usd": float(s.totalCostUsd),
                "created_at": s.createdAt.isoformat(),
                "last_message_at": s.lastMessageAt.isoformat() if s.lastMessageAt else None,
                "message_count": 0,
            }
            for s in sessions if hasattr(s, 'id')
        ]

    async def delete_session(self, session_id: str, tenant_id: str, user_id: str):
        await self.prisma.chatsession.update_many(
            where={"id": session_id, "companyId": tenant_id, "userId": user_id},
            data={"status": "DELETED"},
        )

    async def update_session_stats(
        self,
        session_id: str,
        tokens_delta: int = 0,
        cost_delta: float = 0.0,
        primary_agent: Optional[str] = None,
    ):
        session = await self.prisma.chatsession.find_unique(where={"id": session_id})
        if not session:
            return

        await self.prisma.chatsession.update(
            where={"id": session_id},
            data={
                "totalTokens": session.totalTokens + tokens_delta,
                "totalCostUsd": float(session.totalCostUsd) + cost_delta,
                "primaryAgent": primary_agent or session.primaryAgent,
            },
        )
