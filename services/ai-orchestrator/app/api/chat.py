"""
Endpoint de chat con streaming vía Server-Sent Events.
Integra LangGraph con el frontend en tiempo real.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, AsyncGenerator
import json
import asyncio
import structlog
import time

from app.auth import get_current_user, CurrentUser
from app.orchestrator.streaming_orchestrator import StreamingOrchestrator
from app.session_manager import SessionManager
from app.cost_tracker import CostTracker
from app.database import get_prisma

logger = structlog.get_logger()
router = APIRouter()


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=10000)
    client_id: Optional[str] = None
    agent_hint: Optional[str] = None
    document_ids: Optional[List[str]] = None


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
):
    orchestrator = StreamingOrchestrator()
    session_mgr = SessionManager()
    cost_tracker = CostTracker()

    if request.session_id:
        session = await session_mgr.get_session(
            request.session_id, user.tenant_id, user.id
        )
        if not session:
            raise HTTPException(404, "Sesión no encontrada")
    else:
        session = await session_mgr.create_session(
            tenant_id=user.tenant_id,
            user_id=user.id,
            client_id=request.client_id,
            initial_context={
                "agent_hint": request.agent_hint,
                "document_ids": request.document_ids,
            },
        )

    user_message = await session_mgr.add_message(
        session_id=session.id,
        tenant_id=user.tenant_id,
        role="USER",
        content=request.message,
    )

    async def event_generator() -> AsyncGenerator[str, None]:
        start_time = time.time()
        first_token_time = None

        try:
            yield _sse_event("session_created", {
                "session_id": session.id,
                "message_id": user_message.id,
            })

            assistant_content = ""
            reasoning_content = ""
            tools_executed = []
            sources = []
            model_used = None
            total_tokens = 0

            async for event in orchestrator.stream(
                query=request.message,
                session_id=session.id,
                tenant_id=user.tenant_id,
                user_id=user.id,
                client_id=request.client_id,
                agent_hint=request.agent_hint,
                document_ids=request.document_ids,
            ):
                event_type = event.get("type")

                if event_type == "chunk" and first_token_time is None:
                    first_token_time = time.time()

                event["elapsed_ms"] = int((time.time() - start_time) * 1000)

                if event_type == "chunk":
                    assistant_content += event.get("content", "")
                elif event_type == "thinking":
                    reasoning_content += event.get("content", "") + "\n"
                elif event_type == "tool_result":
                    tools_executed.append({
                        "name": event.get("tool_name"),
                        "input": event.get("input"),
                        "output": event.get("output"),
                        "duration_ms": event.get("duration_ms"),
                        "success": event.get("success", True),
                    })
                elif event_type == "sources":
                    sources = event.get("sources", [])
                elif event_type == "model_info":
                    model_used = event.get("model")
                    total_tokens = event.get("tokens", 0)

                yield _sse_event(event_type, event)

            end_time = time.time()
            cost = cost_tracker.calculate_cost(model_used, total_tokens)

            assistant_message = await session_mgr.add_message(
                session_id=session.id,
                tenant_id=user.tenant_id,
                role="ASSISTANT",
                content=assistant_content,
                reasoning=reasoning_content or None,
                agent_used=event.get("agent_used"),
                model_used=model_used,
                tools_executed=tools_executed,
                prompt_tokens=total_tokens // 2,
                completion_tokens=total_tokens // 2,
                total_tokens=total_tokens,
                cost_usd=cost,
                latency_ms=int((end_time - start_time) * 1000),
                first_token_ms=int((first_token_time - start_time) * 1000) if first_token_time else None,
                last_token_ms=int((end_time - start_time) * 1000),
                citation_ids=[s.get("citation_id") for s in sources if s.get("citation_id")],
            )

            await session_mgr.update_session_stats(
                session_id=session.id,
                tokens_delta=total_tokens,
                cost_delta=float(cost),
            )

            yield _sse_event("done", {
                "message_id": assistant_message.id,
                "latency_ms": int((end_time - start_time) * 1000),
                "first_token_ms": int((first_token_time - start_time) * 1000) if first_token_time else None,
                "total_tokens": total_tokens,
                "cost_usd": float(cost),
                "tools_used": len(tools_executed),
                "sources_count": len(sources),
            })

        except Exception as e:
            logger.exception("chat_stream_error", session_id=session.id)
            yield _sse_event("error", {
                "message": str(e),
                "code": "STREAM_ERROR",
            })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _sse_event(event_type: str, data: dict) -> str:
    data_json = json.dumps(data, ensure_ascii=False, default=str)
    return f"event: {event_type}\ndata: {data_json}\n\n"


@router.get("/chat/sessions")
async def list_sessions(
    user: CurrentUser = Depends(get_current_user),
    limit: int = 50,
):
    session_mgr = SessionManager()
    sessions = await session_mgr.list_sessions(user.tenant_id, user.id, limit=limit)
    return {"sessions": sessions}


@router.get("/chat/sessions/{session_id}")
async def get_session(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    session_mgr = SessionManager()
    session = await session_mgr.get_session_with_messages(session_id, user.tenant_id, user.id)
    if not session:
        raise HTTPException(404, "Sesión no encontrada")
    return session


@router.delete("/chat/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    session_mgr = SessionManager()
    await session_mgr.delete_session(session_id, user.tenant_id, user.id)
    return {"success": True}


@router.post("/chat/feedback")
async def submit_feedback(
    payload: dict,
    user: CurrentUser = Depends(get_current_user),
):
    prisma = get_prisma()
    rating = payload.get("rating", 1)
    if isinstance(rating, str):
        rating = 1 if rating == "thumbs_up" else 0

    feedback = await prisma.agentfeedback.upsert(
        where={
            "companyId_messageId_userId": {
                "companyId": user.tenant_id,
                "messageId": payload["message_id"],
                "userId": user.id,
            }
        },
        create={
            "companyId": user.tenant_id,
            "sessionId": payload["session_id"],
            "messageId": payload["message_id"],
            "userId": user.id,
            "rating": rating,
            "comment": payload.get("comment"),
            "wasHelpful": payload.get("was_helpful", False),
            "sourcesCorrect": payload.get("sources_correct"),
        },
        update={
            "rating": rating,
            "comment": payload.get("comment"),
            "wasHelpful": payload.get("was_helpful", False),
            "sourcesCorrect": payload.get("sources_correct"),
        },
    )

    return {"feedback_id": feedback.id}
