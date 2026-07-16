"""
Adaptador que convierte el StateGraph de LangGraph en un stream de eventos SSE.
"""
from typing import AsyncGenerator, Optional, List
import time
import asyncio
import structlog

from langchain_core.messages import HumanMessage
from langchain_core.callbacks import AsyncCallbackHandler

from app.agents.tax_agent import TaxAgent
from app.agents.financial_agent import FinancialAgent
from app.agents.legal_agent import LegalAgent
from app.agents.commercial_agent import CommercialAgent
from app.agents.router import RouterAgent
from app.session_manager import SessionManager

logger = structlog.get_logger()


class StreamingCallbackHandler(AsyncCallbackHandler):
    def __init__(self, event_queue: asyncio.Queue):
        self.queue = event_queue
        self.current_tool = None
        self.tool_start_time = None

    async def on_llm_new_token(self, token: str, **kwargs):
        await self.queue.put({
            "type": "chunk",
            "content": token,
        })

    async def on_llm_start(self, serialized, prompts, **kwargs):
        model_name = serialized.get("kwargs", {}).get("model", "unknown")
        await self.queue.put({
            "type": "model_info",
            "model": model_name,
        })

    async def on_tool_start(self, serialized, input_str, **kwargs):
        self.current_tool = serialized.get("name", "unknown")
        self.tool_start_time = time.time()
        await self.queue.put({
            "type": "tool_call",
            "tool_name": self.current_tool,
            "input": str(input_str)[:2000],
        })

    async def on_tool_end(self, output, **kwargs):
        duration_ms = int((time.time() - self.tool_start_time) * 1000) if self.tool_start_time else 0
        await self.queue.put({
            "type": "tool_result",
            "tool_name": self.current_tool,
            "output": str(output)[:2000],
            "success": True,
            "duration_ms": duration_ms,
        })
        self.current_tool = None

    async def on_tool_error(self, error, **kwargs):
        duration_ms = int((time.time() - self.tool_start_time) * 1000) if self.tool_start_time else 0
        await self.queue.put({
            "type": "tool_result",
            "tool_name": self.current_tool,
            "output": None,
            "success": False,
            "error_message": str(error),
            "duration_ms": duration_ms,
        })

    async def on_chain_start(self, serialized, inputs, **kwargs):
        agent_name = serialized.get("name", "unknown")
        await self.queue.put({
            "type": "thinking",
            "agent": agent_name,
            "content": f"Analizando tu pregunta...",
        })


class StreamingOrchestrator:
    def __init__(self):
        self.router = RouterAgent()
        self.agents = {
            "financial": FinancialAgent(),
            "tax": TaxAgent(),
            "legal": LegalAgent(),
            "commercial": CommercialAgent(),
        }
        self.session_mgr = SessionManager()

    async def stream(
        self,
        query: str,
        session_id: str,
        tenant_id: str,
        user_id: str,
        client_id: Optional[str] = None,
        agent_hint: Optional[str] = None,
        document_ids: Optional[List[str]] = None,
    ) -> AsyncGenerator[dict, None]:
        event_queue: asyncio.Queue = asyncio.Queue()
        callback = StreamingCallbackHandler(event_queue)

        history = await self.session_mgr.get_history(session_id, limit=10)

        # Router: clasificar intención
        yield {
            "type": "thinking",
            "agent": "Router",
            "content": "Clasificando tu pregunta...",
        }

        intent_result = await self.router.classify(
            query=query, history=history, hint=agent_hint,
        )
        agent_type = intent_result["agent"]
        confidence = intent_result["confidence"]
        reasoning = intent_result.get("reasoning", "")

        if agent_type == "general":
            agent_type = agent_hint or "tax"

        yield {
            "type": "thinking",
            "agent": "Router",
            "content": f"Ruta: **{agent_type}** (confianza: {confidence:.0%})",
        }

        agent = self.agents.get(agent_type)
        if not agent:
            yield {
                "type": "error",
                "message": f"Agente '{agent_type}' no disponible",
                "code": "AGENT_NOT_FOUND",
            }
            return

        yield {
            "type": "thinking",
            "agent": agent_type,
            "content": f"Procesando con agente {agent_type}...",
        }

        context = {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "client_id": client_id,
            "session_id": session_id,
            "document_ids": document_ids or [],
            "history": history,
        }

        task = asyncio.create_task(
            self._run_agent_with_callbacks(agent, query, context, callback)
        )

        while not task.done() or not event_queue.empty():
            try:
                event = await asyncio.wait_for(event_queue.get(), timeout=0.1)
                yield event
            except asyncio.TimeoutError:
                if task.done():
                    break
                continue

        try:
            result = await task
        except Exception as e:
            logger.exception("agent_execution_failed", agent=agent_type)
            yield {
                "type": "error",
                "message": f"Error en agente {agent_type}: {str(e)}",
                "code": "AGENT_ERROR",
            }
            return

        if result.get("sources"):
            yield {
                "type": "sources",
                "sources": result["sources"],
            }

        yield {
            "type": "model_info",
            "model": result.get("model", "gpt-4o"),
            "tokens": result.get("total_tokens", 0),
            "agent_used": agent_type,
        }

    async def _run_agent_with_callbacks(self, agent, query: str, context: dict, callback) -> dict:
        try:
            result = await agent.invoke(
                query=query,
                tenant_id=context.get("tenant_id", ""),
                client_id=context.get("client_id", ""),
            )
            return {
                "content": result.get("answer", ""),
                "sources": result.get("sources", []),
                "model": "gpt-4o",
                "total_tokens": self._estimate_tokens(result.get("answer", "")),
            }
        except Exception as e:
            logger.exception("agent_run_failed")
            raise

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4
