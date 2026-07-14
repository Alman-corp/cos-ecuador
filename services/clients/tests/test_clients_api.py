"""Tests for Clients API endpoints using FastAPI TestClient."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestClientsAPI:
    def test_health(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    def test_root(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "Clients Service" in data["service"]

    def test_list_clients(self):
        resp = client.get("/api/v1/clients/")
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert data["total"] == 15

    def test_list_clients_status_filter(self):
        resp = client.get("/api/v1/clients/?status=prospect")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2

    def test_list_clients_search(self):
        resp = client.get("/api/v1/clients/?search=Technology")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    def test_get_client(self):
        resp = client.get("/api/v1/clients/cli001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["legal_name"] == "TECHNOLOGY SOLUTIONS ECUADOR S.A."

    def test_get_client_not_found(self):
        resp = client.get("/api/v1/clients/nonexistent")
        assert resp.status_code == 404

    def test_create_client(self):
        resp = client.post("/api/v1/clients/", json={
            "legal_name": "API TEST S.A.",
            "ruc": "1712345678001",
            "segment": "small",
            "industry": "testing",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["legal_name"] == "API TEST S.A."
        assert data["id"] is not None

    def test_update_client(self):
        resp = client.put("/api/v1/clients/cli001", json={
            "legal_name": "UPDATED API S.A.",
            "ruc": "1799999999001",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["legal_name"] == "UPDATED API S.A."

    def test_delete_client(self):
        resp = client.delete("/api/v1/clients/cli002")
        assert resp.status_code == 200
        resp2 = client.get("/api/v1/clients/cli002")
        assert resp2.json()["status"] == "inactive"

    def test_get_contracts(self):
        resp = client.get("/api/v1/clients/cli001/contracts")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) >= 3

    def test_add_contract(self):
        resp = client.post("/api/v1/clients/cli003/contracts", json={
            "title": "API Test Contract",
            "type": "recurrente",
            "start_date": "2026-07-01",
            "monthly_value": 2000.0,
            "status": "active",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "API Test Contract"

    def test_get_invoices(self):
        resp = client.get("/api/v1/clients/cli001/invoices")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) >= 5

    def test_create_invoice(self):
        resp = client.post("/api/v1/clients/cli001/invoices", json={
            "subtotal": 3000.0,
            "items": [],
            "issue_date": "2026-07-01",
            "due_date": "2026-07-31",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3450.0

    def test_get_payments(self):
        resp = client.get("/api/v1/clients/cli001/payments")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) >= 5

    def test_get_history(self):
        resp = client.get("/api/v1/clients/cli001/history")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) >= 5

    def test_get_client_summary(self):
        resp = client.get("/api/v1/clients/cli003/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["legal_name"] == "COMERCIALIZADORA ANDINA S.A."

    def test_portfolio_summary(self):
        resp = client.get("/api/v1/clients/portfolio/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_clients"] == 15

    def test_portfolio_segments(self):
        resp = client.get("/api/v1/clients/portfolio/segments")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) == 3

    def test_portfolio_retention(self):
        resp = client.get("/api/v1/clients/portfolio/retention")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) > 0

    def test_portfolio_geography(self):
        resp = client.get("/api/v1/clients/portfolio/geography")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) > 0

    def test_portfolio_growth(self):
        resp = client.get("/api/v1/clients/portfolio/growth")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) > 0
