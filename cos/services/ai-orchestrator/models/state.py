"""LangGraph AgentState for the COS AI Orchestrator."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentState:
    """State passed through the LangGraph state machine.

    Each key is mutated by graph nodes (agents). The orchestrator
    routes documents to specialist agents and collects results.
    """

    # Routing
    tenant_id: str = ""
    session_id: str = ""
    document_type: str = "GENERAL"
    document_text: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    # Orchestrator decision
    routed_agents: list[str] = field(default_factory=list)
    intent: str | None = None

    # Agent results (populated by each specialist node)
    financial_analysis: dict[str, Any] = field(default_factory=dict)
    tax_analysis: dict[str, Any] = field(default_factory=dict)

    # Aggregated output
    final_summary: str = ""
    findings: list[dict] = field(default_factory=list)
    overall_risk: str = "LOW"

    # Error handling
    error: str | None = None
    retry_count: int = 0
    max_retries: int = 3
