"""Tests for ClientsEngine."""

from engines.clients_engine import (
    ClientsEngine, ClientCreate, Address, ClientContact,
    Contract, Payment, ClientHistory,
)


class TestClientsEngine:
    def test_create_client(self, engine: ClientsEngine):
        data = ClientCreate(legal_name="TEST S.A.", ruc="1799999999001", segment="small", industry="testing")
        client = engine.create_client(data)
        assert client["legal_name"] == "TEST S.A."
        assert client["ruc"] == "1799999999001"
        assert client["segment"] == "small"
        assert client["status"] == "active"

    def test_create_client_generates_id(self, engine: ClientsEngine):
        data = ClientCreate(legal_name="TEST S.A.", ruc="1799999999001")
        client = engine.create_client(data)
        assert len(client["id"]) == 12
        assert client["created_at"] is not None

    def test_get_client_by_id(self, engine: ClientsEngine):
        client = engine.get_client("cli001")
        assert client is not None
        assert client["legal_name"] == "TECHNOLOGY SOLUTIONS ECUADOR S.A."

    def test_get_client_not_found(self, engine: ClientsEngine):
        client = engine.get_client("nonexistent")
        assert client is None

    def test_update_client(self, engine: ClientsEngine):
        data = ClientCreate(legal_name="UPDATED S.A.", ruc="1799999999001", segment="enterprise")
        updated = engine.update_client("cli001", data)
        assert updated is not None
        assert updated["legal_name"] == "UPDATED S.A."
        assert updated["segment"] == "enterprise"

    def test_delete_client_soft_delete(self, engine: ClientsEngine):
        ok = engine.delete_client("cli001")
        assert ok is True
        client = engine.get_client("cli001")
        assert client["status"] == "inactive"

    def test_list_clients_default(self, engine: ClientsEngine):
        items, total = engine.list_clients()
        assert len(items) == 15
        assert total == 15

    def test_list_clients_status_filter(self, engine: ClientsEngine):
        items, total = engine.list_clients(status="prospect")
        assert total == 2
        for c in items:
            assert c["status"] == "prospect"

    def test_list_clients_search(self, engine: ClientsEngine):
        items, total = engine.list_clients(search="Technology")
        assert total >= 1
        assert any("TECHNOLOGY" in c["legal_name"] for c in items)

    def test_list_clients_pagination(self, engine: ClientsEngine):
        items, total = engine.list_clients(page=1, limit=5)
        assert len(items) == 5
        assert total == 15
        items2, _ = engine.list_clients(page=2, limit=5)
        assert len(items2) == 5
        assert items[0]["id"] != items2[0]["id"]

    def test_add_contract(self, engine: ClientsEngine):
        data = Contract(
            title="Test Contract",
            type="recurrente",
            start_date="2026-01-01",
            monthly_value=1000.0,
            status="active",
        )
        contract = engine.add_contract("cli001", data)
        assert contract is not None
        assert contract["client_id"] == "cli001"
        assert contract["title"] == "Test Contract"

    def test_get_contracts(self, engine: ClientsEngine):
        contracts = engine.get_contracts("cli001")
        assert len(contracts) >= 3

    def test_get_contracts_empty(self, engine: ClientsEngine):
        contracts = engine.get_contracts("cli014")
        assert contracts == []

    def test_create_invoice(self, engine: ClientsEngine):
        data = {
            "subtotal": 5000.0,
            "items": [{"description": "Test service", "quantity": 1, "unit_price": 5000.0}],
            "issue_date": "2026-07-01",
            "due_date": "2026-07-31",
        }
        invoice = engine.create_invoice("cli001", data)
        assert invoice is not None
        assert invoice["subtotal"] == 5000.0
        assert invoice["iva_rate"] == 0.15
        assert invoice["iva_amount"] == 750.0
        assert invoice["total"] == 5750.0
        assert invoice["status"] == "emitida"

    def test_create_invoice_auto_numbering(self, engine: ClientsEngine):
        data = {"subtotal": 1000.0}
        inv1 = engine.create_invoice("cli001", data)
        inv2 = engine.create_invoice("cli001", data)
        seq1 = int(inv1["number"].split("-")[-1])
        seq2 = int(inv2["number"].split("-")[-1])
        assert seq2 > seq1

    def test_get_invoices(self, engine: ClientsEngine):
        invoices = engine.get_invoices("cli001")
        assert len(invoices) >= 5

    def test_record_payment_updates_invoice(self, engine: ClientsEngine):
        data = Payment(
            amount=5750.0,
            method="transferencia",
            paid_at="2026-07-15T10:00:00Z",
            reference="TRF-TEST",
            notes="",
        )
        inv = engine.create_invoice("cli001", {"subtotal": 5000.0})
        payment = engine.record_payment("cli001", inv["id"], data)
        assert payment is not None
        invoice = engine._invoices[inv["id"]]
        assert invoice["status"] == "pagada"
        assert invoice["paid_amount"] == 5750.0

    def test_record_payment_creates_history(self, engine: ClientsEngine):
        data = Payment(amount=5750.0, method="tarjeta", paid_at="2026-07-15T10:00:00Z", reference="TEST", notes="")
        inv = engine.create_invoice("cli001", {"subtotal": 5000.0})
        engine.record_payment("cli001", inv["id"], data)
        history = engine.get_history("cli001")
        payment_events = [h for h in history if h["event_type"] == "payment_received"]
        assert len(payment_events) >= 1

    def test_get_payments(self, engine: ClientsEngine):
        payments = engine.get_payments("cli001")
        assert len(payments) >= 5

    def test_get_client_summary(self, engine: ClientsEngine):
        summary = engine.get_client_summary("cli001")
        assert summary is not None
        assert summary["legal_name"] == "TECHNOLOGY SOLUTIONS ECUADOR S.A."
        assert summary["contracts_active"] >= 2
        assert summary["mrr"] > 0

    def test_get_client_summary_mrr(self, engine: ClientsEngine):
        summary = engine.get_client_summary("cli010")
        assert summary is not None
        # cli010 has 2 active contracts: 25000 + 10000
        assert summary["mrr"] == 35000.0

    def test_log_history(self, engine: ClientsEngine):
        data = ClientHistory(
            id="test-hst",
            client_id="cli001",
            event_type="note",
            description="Test note",
            created_at="2026-07-01T00:00:00Z",
            metadata={},
        )
        engine.log_history("cli001", data)
        history = engine.get_history("cli001")
        assert any(h["description"] == "Test note" for h in history)

    def test_get_history(self, engine: ClientsEngine):
        history = engine.get_history("cli001")
        assert len(history) >= 5

    def test_portfolio_summary(self, engine: ClientsEngine):
        summary = engine.get_portfolio_summary()
        assert summary["total_clients"] == 15
        assert summary["active_clients"] == 11
        assert summary["prospects"] == 2
        assert summary["churned"] == 1
        assert summary["mrr_total"] > 0
        assert summary["arr_total"] > 0

    def test_portfolio_mrr_calculation(self, engine: ClientsEngine):
        summary = engine.get_portfolio_summary()
        active_contracts = [c for c in engine._contracts.values() if c["status"] == "active"]
        expected_mrr = sum(c["monthly_value"] for c in active_contracts)
        assert summary["mrr_total"] == round(expected_mrr, 2)
