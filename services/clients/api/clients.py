"""API endpoints for client CRUD, contracts, invoices, payments and history."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from engines.clients_engine import (
    ClientsEngine, ClientCreate, Contract, Payment, ClientHistory,
)

router = APIRouter(prefix="/api/v1/clients", tags=["Clients"])
engine = ClientsEngine()


@router.get("/", summary="List all clients")
async def list_clients(
    search: str = Query("", description="Search by name, trade name or RUC"),
    status: str = Query("", description="Filter by status"),
    segment: str = Query("", description="Filter by segment"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    items, total = engine.list_clients(search=search, status=status, segment=segment, page=page, limit=limit)
    return {"data": items, "total": total, "page": page, "limit": limit}


@router.post("/", summary="Create client")
async def create_client(data: ClientCreate):
    client = engine.create_client(data)
    return client


@router.get("/{client_id}", summary="Get client details")
async def get_client(client_id: str):
    client = engine.get_client(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}", summary="Update client")
async def update_client(client_id: str, data: ClientCreate):
    client = engine.update_client(client_id, data)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.delete("/{client_id}", summary="Soft-delete client")
async def delete_client(client_id: str):
    ok = engine.delete_client(client_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"detail": "Client deactivated"}


@router.get("/{client_id}/contracts", summary="List contracts for client")
async def get_contracts(client_id: str):
    if not engine.get_client(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    return {"data": engine.get_contracts(client_id)}


@router.post("/{client_id}/contracts", summary="Add contract to client")
async def add_contract(client_id: str, data: Contract):
    contract = engine.add_contract(client_id, data)
    if not contract:
        raise HTTPException(status_code=404, detail="Client not found")
    return contract


@router.get("/{client_id}/invoices", summary="List invoices for client")
async def get_invoices(client_id: str, status: str = Query("", description="Filter by status")):
    if not engine.get_client(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    return {"data": engine.get_invoices(client_id, status_filter=status)}


@router.post("/{client_id}/invoices", summary="Create invoice for client")
async def create_invoice(client_id: str, data: dict):
    invoice = engine.create_invoice(client_id, data)
    if not invoice:
        raise HTTPException(status_code=404, detail="Client not found")
    return invoice


@router.get("/{client_id}/payments", summary="Payment history")
async def get_payments(client_id: str):
    if not engine.get_client(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    return {"data": engine.get_payments(client_id)}


@router.post("/{client_id}/payments", summary="Record payment")
async def record_payment(client_id: str, invoice_id: str = Query(..., description="Invoice to pay"), data: Payment = None):
    if data is None:
        raise HTTPException(status_code=400, detail="Payment data required")
    payment = engine.record_payment(client_id, invoice_id, data)
    if not payment:
        raise HTTPException(status_code=404, detail="Client or invoice not found")
    return payment


@router.get("/{client_id}/history", summary="Full interaction history")
async def get_history(client_id: str):
    if not engine.get_client(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    return {"data": engine.get_history(client_id)}


@router.get("/{client_id}/summary", summary="Client summary")
async def get_client_summary(client_id: str):
    summary = engine.get_client_summary(client_id)
    if not summary:
        raise HTTPException(status_code=404, detail="Client not found")
    return summary
