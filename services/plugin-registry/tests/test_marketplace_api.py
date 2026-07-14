import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from api.marketplace import router as marketplace_router
from api.plugins import router as plugins_router

app = FastAPI()
app.include_router(marketplace_router)
app.include_router(plugins_router)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "plugin-registry", "version": "1.0.0", "modules": ["marketplace", "plugins"]}


client = TestClient(app)


class TestHealth:

    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "plugin-registry"


class TestListPlugins:

    def test_list_plugins(self):
        response = client.get("/api/v1/marketplace/plugins")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 12
        assert "items" in data
        assert data["page"] == 1

    def test_list_plugins_category_filter(self):
        response = client.get("/api/v1/marketplace/plugins?category=tributario")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        for item in data["items"]:
            assert item["category"] == "tributario"

    def test_list_plugins_search(self):
        response = client.get("/api/v1/marketplace/plugins?search=SRI")
        assert response.status_code == 200
        assert response.json()["total"] >= 2

    def test_list_plugins_pagination(self):
        response = client.get("/api/v1/marketplace/plugins?page=2&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 2
        assert data["limit"] == 5
        assert len(data["items"]) == 5

    def test_list_plugins_invalid_page(self):
        response = client.get("/api/v1/marketplace/plugins?page=0")
        assert response.status_code == 422


class TestGetPluginDetail:

    def test_get_plugin_detail(self):
        response = client.get("/api/v1/marketplace/plugins/sri-automation")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "sri-automation"
        assert data["name"] == "Automatización SRI"
        assert data["category"] == "tributario"

    def test_get_plugin_detail_not_found(self):
        response = client.get("/api/v1/marketplace/plugins/non-existent")
        assert response.status_code == 404
        assert "no encontrado" in response.json()["detail"]


class TestGetCategories:

    def test_get_categories(self):
        response = client.get("/api/v1/marketplace/categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 8
        assert data[0]["id"] == "tributario"


class TestGetFeatured:

    def test_get_featured(self):
        response = client.get("/api/v1/marketplace/featured")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        for item in data:
            assert item["is_featured"] is True


class TestGetInstalled:

    def test_get_installed(self):
        response = client.get("/api/v1/plugins/installed/tenant-consultora-demo")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 6

    def test_get_installed_empty_tenant(self):
        response = client.get("/api/v1/plugins/installed/tenant-empty")
        assert response.status_code == 200
        assert response.json() == []


class TestInstallPlugin:

    TENANT = "tenant-test-install"

    def test_install_plugin(self):
        response = client.post(
            f"/api/v1/plugins/install/{self.TENANT}",
            json={"plugin_id": "legal-draft", "accept_terms": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["plugin_id"] == "legal-draft"
        assert data["tenant_id"] == self.TENANT
        assert data["status"] == "active"

    def test_install_plugin_without_terms(self):
        response = client.post(
            f"/api/v1/plugins/install/{self.TENANT}",
            json={"plugin_id": "legal-draft", "accept_terms": False},
        )
        assert response.status_code == 400
        assert "términos" in response.json()["detail"]

    def test_install_duplicate(self):
        client.post(
            f"/api/v1/plugins/install/{self.TENANT}",
            json={"plugin_id": "legal-draft", "accept_terms": True},
        )
        response = client.post(
            f"/api/v1/plugins/install/{self.TENANT}",
            json={"plugin_id": "legal-draft", "accept_terms": True},
        )
        assert response.status_code == 400
        assert "ya está instalado" in response.json()["detail"]

    def test_install_invalid_plugin(self):
        response = client.post(
            f"/api/v1/plugins/install/{self.TENANT}",
            json={"plugin_id": "no-such-plugin", "accept_terms": True},
        )
        assert response.status_code == 400
        assert "no encontrado" in response.json()["detail"]


class TestUninstallPlugin:

    TENANT = "tenant-test-uninstall"

    def test_uninstall_plugin(self):
        client.post(
            f"/api/v1/plugins/install/{self.TENANT}",
            json={"plugin_id": "legal-draft", "accept_terms": True},
        )
        response = client.post(
            f"/api/v1/plugins/uninstall/{self.TENANT}",
            json={"plugin_id": "legal-draft"},
        )
        assert response.status_code == 200
        assert "desinstalado" in response.json()["message"]

    def test_uninstall_not_installed(self):
        response = client.post(
            f"/api/v1/plugins/uninstall/{self.TENANT}",
            json={"plugin_id": "no-such-plugin"},
        )
        assert response.status_code == 404

    def test_uninstall_missing_plugin_id(self):
        response = client.post(
            f"/api/v1/plugins/uninstall/{self.TENANT}",
            json={},
        )
        assert response.status_code == 400
        assert "plugin_id es requerido" in response.json()["detail"]


class TestConfigurePlugin:

    TENANT = "tenant-test-configure"

    def test_configure_plugin(self):
        client.post(
            f"/api/v1/plugins/install/{self.TENANT}",
            json={"plugin_id": "legal-draft", "accept_terms": True},
        )
        response = client.post(
            f"/api/v1/plugins/configure/{self.TENANT}/legal-draft",
            json={"key": "value", "enabled": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["config"] == {"key": "value", "enabled": True}

    def test_configure_not_installed(self):
        response = client.post(
            f"/api/v1/plugins/configure/{self.TENANT}/no-such-plugin",
            json={"key": "value"},
        )
        assert response.status_code == 404


class TestCheckUpdates:

    def test_check_updates(self):
        response = client.get("/api/v1/plugins/updates/tenant-consultora-demo")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 6
        with_updates = [p for p in data if p["has_update"]]
        assert len(with_updates) > 0

    def test_check_updates_empty_tenant(self):
        response = client.get("/api/v1/plugins/updates/tenant-no-plugins")
        assert response.status_code == 200
        assert response.json() == []


class TestUpdatePlugin:

    def test_update_plugin(self):
        response = client.post(
            "/api/v1/plugins/update/tenant-consultora-demo/sri-automation",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "2.1.0"
        assert data["has_update"] is False

    def test_update_not_installed(self):
        response = client.post(
            "/api/v1/plugins/update/tenant-no-such/no-such-plugin",
        )
        assert response.status_code == 400
