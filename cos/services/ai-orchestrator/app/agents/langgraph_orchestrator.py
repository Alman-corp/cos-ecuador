"""Orquestador LangGraph con 7 agentes especialistas."""
from typing import Literal, TypedDict, Any
from langgraph.graph import StateGraph, END

from app.agents.financial_agent import financial_agent_node
from app.agents.tax_agent import tax_agent_node
from app.agents.commercial_agent import commercial_agent_node
from app.agents.legal_agent import legal_agent_node
from app.agents.hr_agent import hr_agent_node
from app.agents.risk_agent import risk_agent_node
from app.agents.strategy_agent import strategy_agent_node
from app.agents.router_node import router_node


class AgentState(TypedDict):
    messages: list[Any]
    active_agent: str
    intent: str
    client_context: str


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("router", router_node)
    graph.add_node("financial", financial_agent_node)
    graph.add_node("tax", tax_agent_node)
    graph.add_node("commercial", commercial_agent_node)
    graph.add_node("legal", legal_agent_node)
    graph.add_node("hr", hr_agent_node)
    graph.add_node("risk", risk_agent_node)
    graph.add_node("strategy", strategy_agent_node)

    graph.set_entry_point("router")
    graph.add_conditional_edges(
        "router",
        route_by_intent,
        {a: a for a in ["financial", "tax", "commercial", "legal", "hr", "risk", "strategy"]},
    )

    for agent in ["financial", "tax", "commercial", "legal", "hr", "risk", "strategy"]:
        graph.add_edge(agent, END)

    return graph.compile()


def route_by_intent(state: AgentState) -> Literal["financial", "tax", "commercial", "legal", "hr", "risk", "strategy"]:
    intent = state.get("active_agent", "strategy")
    valid = {"financial", "tax", "commercial", "legal", "hr", "risk", "strategy"}
    return intent if intent in valid else "strategy"


