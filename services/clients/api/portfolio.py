"""API endpoints for portfolio analysis — summary, segments, retention, geography, growth."""

from fastapi import APIRouter

from engines.clients_engine import ClientsEngine
from engines.portfolio_engine import PortfolioEngine

router = APIRouter(prefix="/api/v1/clients", tags=["Portfolio"])
_engine = ClientsEngine()
_portfolio = PortfolioEngine(_engine)


@router.get("/portfolio/summary", summary="Portfolio overview")
async def portfolio_summary():
    return _engine.get_portfolio_summary()


@router.get("/portfolio/segments", summary="Clients by segment")
async def portfolio_segments():
    return {"data": _portfolio.get_segments()}


@router.get("/portfolio/retention", summary="Retention analysis")
async def portfolio_retention():
    return {"data": _portfolio.get_retention()}


@router.get("/portfolio/geography", summary="Clients by location")
async def portfolio_geography():
    return {"data": _portfolio.get_geography()}


@router.get("/portfolio/growth", summary="Client acquisition over time")
async def portfolio_growth():
    return {"data": _portfolio.get_growth()}
