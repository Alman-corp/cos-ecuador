import pytest
from engines.marketplace_engine import (
    MarketplaceEngine,
    PluginInstallRequest,
    PluginManifest,
    InstalledPlugin,
    PluginCategory,
    MARKETPLACE_PLUGINS,
    INSTALLED_PLUGINS_DATA,
    CATEGORIES,
)

TENANT = "tenant-001"


class TestListPlugins:

    def test_list_plugins_returns_all(self, engine):
        result = engine.list_plugins()
        assert result["total"] == 12
        assert len(result["items"]) == 10
        assert result["page"] == 1
        assert result["limit"] == 10
        assert result["total_pages"] == 2

    def test_list_plugins_category_filter(self, engine):
        result = engine.list_plugins(category="tributario")
        ids = {p.id for p in result["items"]}
        assert ids == {"sri-automation", "ruc-verifier"}
        assert result["total"] == 2

    def test_list_plugins_search_by_name(self, engine):
        result = engine.list_plugins(search="SRI")
        ids = {p.id for p in result["items"]}
        assert "sri-automation" in ids
        assert "ruc-verifier" in ids

    def test_list_plugins_search_by_description(self, engine):
        result = engine.list_plugins(search="depreciación")
        ids = {p.id for p in result["items"]}
        assert "inventario-activos" in ids

    def test_list_plugins_search_by_tag(self, engine):
        result = engine.list_plugins(search="auditoría")
        ids = {p.id for p in result["items"]}
        assert "auditoria-continua" in ids

    def test_list_plugins_pagination_page_1(self, engine):
        result = engine.list_plugins(page=1, limit=5)
        assert len(result["items"]) == 5
        assert result["page"] == 1
        assert result["total_pages"] == 3

    def test_list_plugins_pagination_page_2(self, engine):
        result = engine.list_plugins(page=2, limit=5)
        assert len(result["items"]) == 5
        assert result["page"] == 2

    def test_list_plugins_pagination_last_page(self, engine):
        result = engine.list_plugins(page=3, limit=5)
        assert len(result["items"]) == 2
        assert result["page"] == 3

    def test_list_plugins_no_results(self, engine):
        result = engine.list_plugins(search="zzznonexistent")
        assert result["total"] == 0
        assert result["items"] == []


class TestGetPlugin:

    def test_get_plugin_returns_manifest(self, engine):
        plugin = engine.get_plugin("sri-automation")
        assert plugin is not None
        assert plugin.id == "sri-automation"
        assert plugin.name == "Automatización SRI"
        assert isinstance(plugin, PluginManifest)

    def test_get_plugin_nonexistent_returns_none(self, engine):
        assert engine.get_plugin("non-existent-plugin") is None


class TestGetCategories:

    def test_returns_eight_categories(self, engine):
        cats = engine.get_categories()
        assert len(cats) == 8
        assert all(isinstance(c, PluginCategory) for c in cats)

    def test_category_ids(self, engine):
        ids = {c.id for c in engine.get_categories()}
        assert ids == {
            "tributario", "legal", "financiero", "crm",
            "rrhh", "analitica", "documentos", "seguridad",
        }


class TestGetFeatured:

    def test_featured_returns_non_empty(self, engine):
        featured = engine.get_featured()
        assert len(featured) > 0
        assert all(p.is_featured for p in featured)
        assert all(isinstance(p, PluginManifest) for p in featured)

    def test_featured_plugins_are_subset(self, engine):
        featured_ids = {p.id for p in engine.get_featured()}
        all_ids = {p.id for p in MARKETPLACE_PLUGINS}
        assert featured_ids.issubset(all_ids)


class TestGetInstalled:

    def test_get_installed_for_default_tenant(self, engine):
        installed = engine.get_installed("tenant-consultora-demo")
        assert len(installed) == 6
        assert all(isinstance(p, InstalledPlugin) for p in installed)

    def test_get_installed_empty_for_unknown_tenant(self, engine):
        installed = engine.get_installed("tenant-unknown")
        assert installed == []


class TestInstall:

    def test_install_plugin(self, engine, install_request):
        req = install_request("legal-draft")
        result = engine.install(TENANT, req)
        assert result.plugin_id == "legal-draft"
        assert result.tenant_id == TENANT
        assert result.status == "active"
        assert result.version == "1.3.0"
        assert result.has_update is False
        installed = engine.get_installed(TENANT)
        assert len(installed) == 1

    def test_install_duplicate_raises_error(self, engine, install_request):
        req = install_request("legal-draft")
        engine.install(TENANT, req)
        with pytest.raises(ValueError, match="ya está instalado"):
            engine.install(TENANT, req)

    def test_install_without_terms_raises_error(self, engine, install_request):
        req = install_request("sri-automation", accept_terms=False)
        with pytest.raises(ValueError, match="Debe aceptar los términos"):
            engine.install(TENANT, req)

    def test_install_invalid_plugin_raises_error(self, engine, install_request):
        req = install_request("no-such-plugin")
        with pytest.raises(ValueError, match="no encontrado"):
            engine.install(TENANT, req)

    def test_install_with_custom_config(self, engine, install_request):
        config = {"key": "value", "enabled": True}
        req = install_request("legal-draft", config=config)
        result = engine.install(TENANT, req)
        assert result.config == config

    def test_install_adds_to_global_list(self, engine, install_request):
        before = len(INSTALLED_PLUGINS_DATA)
        req = install_request("legal-draft")
        engine.install(TENANT, req)
        assert len(INSTALLED_PLUGINS_DATA) == before + 1


class TestUninstall:

    def test_uninstall_plugin(self, engine, install_request):
        req = install_request("legal-draft")
        engine.install(TENANT, req)
        result = engine.uninstall(TENANT, "legal-draft")
        assert result is True
        assert engine.get_installed(TENANT) == []

    def test_uninstall_not_installed_raises_error(self, engine):
        with pytest.raises(ValueError, match="no está instalado"):
            engine.uninstall(TENANT, "no-such-plugin")

    def test_uninstall_removes_from_global_list(self, engine, install_request):
        req = install_request("legal-draft")
        engine.install(TENANT, req)
        before = len(INSTALLED_PLUGINS_DATA)
        engine.uninstall(TENANT, "legal-draft")
        assert len(INSTALLED_PLUGINS_DATA) == before - 1


class TestConfigure:

    def test_configure_plugin(self, engine, install_request):
        req = install_request("legal-draft")
        engine.install(TENANT, req)
        new_config = {"key": "new_value"}
        updated = engine.configure(TENANT, "legal-draft", new_config)
        assert updated.config == new_config
        assert updated.updated_at is not None

    def test_configure_not_installed_raises_error(self, engine):
        with pytest.raises(ValueError, match="no está instalado"):
            engine.configure(TENANT, "no-such-plugin", {})


class TestCheckUpdates:

    def test_check_updates_returns_all_installed(self, engine):
        results = engine.check_updates("tenant-consultora-demo")
        assert len(results) == 6
        assert all(isinstance(p, InstalledPlugin) for p in results)

    def test_check_updates_detects_outdated_plugins(self, engine):
        results = engine.check_updates("tenant-consultora-demo")
        with_updates = [p for p in results if p.has_update]
        plugin_ids = {p.plugin_id for p in with_updates}
        assert "sri-automation" in plugin_ids
        assert "cashflow-pro" in plugin_ids
        assert "rrhh-integral" in plugin_ids
        assert "firma-digital" in plugin_ids

    def test_check_updates_current_version_no_update(self, engine):
        results = engine.check_updates("tenant-consultora-demo")
        for p in results:
            if p.plugin_id == "client-portal":
                assert p.has_update is False
                assert p.latest_version == "3.0.0"
            if p.plugin_id == "auditoria-continua":
                assert p.has_update is False

    def test_check_updates_returns_latest_versions(self, engine):
        results = engine.check_updates("tenant-consultora-demo")
        for p in results:
            if p.plugin_id == "sri-automation":
                assert p.latest_version == "2.1.0"


class TestUpdatePlugin:

    def test_update_plugin(self, engine):
        result = engine.update_plugin("tenant-consultora-demo", "sri-automation")
        assert result.version == "2.1.0"
        assert result.has_update is False
        assert result.updated_at is not None

    def test_update_plugin_not_installed_raises_error(self, engine):
        with pytest.raises(ValueError, match="no está instalado"):
            engine.update_plugin("tenant-001", "no-such-plugin")

    def test_update_plugin_already_current_raises_error(self, engine):
        with pytest.raises(ValueError, match="ya está en la versión más reciente"):
            engine.update_plugin("tenant-consultora-demo", "client-portal")


class TestManifestIntegrity:

    def test_all_plugins_have_required_fields(self):
        required = {"id", "name", "category", "price_monthly", "price_setup", "latest_version"}
        for plugin in MARKETPLACE_PLUGINS:
            manifest = plugin.model_dump()
            missing = required - manifest.keys()
            assert not missing, f"Plugin {plugin.id} missing fields: {missing}"

    def test_all_plugins_have_at_least_one_version(self):
        for plugin in MARKETPLACE_PLUGINS:
            assert len(plugin.versions) >= 1, f"Plugin {plugin.id} has no versions"

    def test_all_plugins_latest_version_matches_versions(self):
        for plugin in MARKETPLACE_PLUGINS:
            version_ids = {v.version for v in plugin.versions}
            assert plugin.latest_version in version_ids, (
                f"Plugin {plugin.id}: latest_version {plugin.latest_version} "
                f"not found in versions {version_ids}"
            )

    def test_all_categories_have_ids_and_names(self):
        for cat in CATEGORIES:
            assert cat.id
            assert cat.name
            assert cat.description
            assert cat.icon

    def test_installed_plugins_reference_valid_plugins(self):
        marketplace_ids = {p.id for p in MARKETPLACE_PLUGINS}
        for ip in INSTALLED_PLUGINS_DATA:
            assert ip.plugin_id in marketplace_ids, (
                f"Installed plugin {ip.plugin_id} not in marketplace"
            )

    def test_installed_plugin_tracks_version_on_update(self, engine):
        sri = engine.get_installed("tenant-consultora-demo")
        sri_plugin = next(p for p in sri if p.plugin_id == "sri-automation")
        assert sri_plugin.version == "2.0.0"
        engine.update_plugin("tenant-consultora-demo", "sri-automation")
        updated = engine.get_installed("tenant-consultora-demo")
        sri_updated = next(p for p in updated if p.plugin_id == "sri-automation")
        assert sri_updated.version == "2.1.0"
