from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestDocumentsAPI:
    def test_health(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["service"] == "documents-service"

    def test_root(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "Documents Service" in data["service"]

    def test_list_documents(self):
        resp = client.get("/api/v1/documents/")
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "total" in data
        assert data["total"] >= 14

    def test_list_documents_filter_type(self):
        resp = client.get("/api/v1/documents/?doc_type=factura")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["data"]) == 3

    def test_list_documents_search(self):
        resp = client.get("/api/v1/documents/?search=due+diligence")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_get_document(self):
        resp = client.get("/api/v1/documents/doc-001")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["id"] == "doc-001"
        assert data["title"] == "Contrato de Servicios Profesionales - Consultoría Tributaria"

    def test_get_document_not_found(self):
        resp = client.get("/api/v1/documents/doc-nonexistent")
        assert resp.status_code == 404

    def test_create_document(self):
        payload = {
            "client_id": "cli-test",
            "title": "API Test Document",
            "description": "Created via API test",
            "doc_type": "informe",
            "created_by": "api-tester",
        }
        resp = client.post("/api/v1/documents/", json=payload)
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["title"] == "API Test Document"
        assert data["status"] == "active"
        assert data["current_version"] == 1

    def test_update_document(self):
        resp = client.put("/api/v1/documents/doc-002", json={"title": "NDA Actualizado"})
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "NDA Actualizado"

    def test_delete_document(self):
        resp = client.delete("/api/v1/documents/doc-015")
        assert resp.status_code == 200
        resp2 = client.get("/api/v1/documents/doc-015")
        assert resp2.status_code == 404

    def test_add_version(self):
        resp = client.post("/api/v1/documents/doc-004/versions", params={"created_by": "tester", "notes": "v4 test"})
        assert resp.status_code == 201
        assert resp.json()["data"]["version_number"] == 4

    def test_list_versions(self):
        resp = client.get("/api/v1/documents/doc-004/versions")
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 3

    def test_get_version(self):
        resp = client.get("/api/v1/documents/doc-004/versions/ver-004-1")
        assert resp.status_code == 200
        assert resp.json()["data"]["version_number"] == 1

    def test_classify(self):
        resp = client.post("/api/v1/documents/doc-005/classify")
        assert resp.status_code == 200
        assert resp.json()["data"]["classified_category"] == "informes financieros"

    def test_ocr(self):
        resp = client.post("/api/v1/documents/doc-006/ocr")
        assert resp.status_code == 200
        assert "FACTURA" in resp.json()["data"]["ocr_text"]

    def test_download(self):
        resp = client.get("/api/v1/documents/doc-001/download")
        assert resp.status_code == 200
        assert "doc-001" in resp.json()["data"]["download_url"]

    def test_audit(self):
        resp = client.get("/api/v1/documents/doc-001/audit")
        assert resp.status_code == 200
        assert isinstance(resp.json()["data"], list)


class TestTemplatesAPI:
    def test_list_templates(self):
        resp = client.get("/api/v1/documents/templates")
        assert resp.status_code == 200
        assert len(resp.json()["data"]) >= 8

    def test_list_templates_by_category(self):
        resp = client.get("/api/v1/documents/templates?category=contratos")
        assert resp.status_code == 200
        assert all(t["category"] == "contratos" for t in resp.json()["data"])

    def test_get_template(self):
        resp = client.get("/api/v1/documents/templates/tpl-001")
        assert resp.status_code == 200
        assert resp.json()["data"]["name"] == "Contrato de Servicios Profesionales"

    def test_get_template_not_found(self):
        resp = client.get("/api/v1/documents/templates/tpl-nonexistent")
        assert resp.status_code == 404

    def test_create_template(self):
        payload = {
            "name": "Template API Test",
            "description": "Test via API",
            "category": "formularios",
            "content": "Test {{var1}}",
            "variables": [{"name": "var1", "type": "string", "required": True}],
        }
        resp = client.post("/api/v1/documents/templates", json=payload)
        assert resp.status_code == 201
        assert resp.json()["data"]["name"] == "Template API Test"

    def test_render_template(self):
        resp = client.post("/api/v1/documents/templates/tpl-001/render", json={"cliente": "API Test"})
        assert resp.status_code == 200
        assert "API Test" in resp.json()["data"]["rendered_content"]
        assert "{{cliente}}" not in resp.json()["data"]["rendered_content"]
