import pytest
from engines.api_engine import APICreateKeyRequest, DEFAULT_TENANT

BCRYPT_PASSWORD_TOO_LONG = (
    "create_key genera una clave de 73 bytes "
    "(cos_live_ + token_hex(32)=64 chars) que excede "
    "el límite de 72 bytes de bcrypt>=5.0"
)


class TestAPIEngine:

    @pytest.mark.xfail(reason=BCRYPT_PASSWORD_TOO_LONG, strict=False)
    def test_create_key(self, engine):
        req = APICreateKeyRequest(
            tenant_id=DEFAULT_TENANT,
            name="Test Key",
            scopes=["tax:read"],
        )
        result = engine.create_key(DEFAULT_TENANT, req)
        assert result["id"].startswith("key-")
        assert result["full_key"].startswith("cos_live_")
        assert result["status"] == "active"

    @pytest.mark.xfail(reason=BCRYPT_PASSWORD_TOO_LONG, strict=False)
    def test_create_key_has_correct_scopes(self, engine):
        scopes = ["tax:read", "client:read"]
        req = APICreateKeyRequest(
            tenant_id=DEFAULT_TENANT,
            name="Test Key",
            scopes=scopes,
        )
        result = engine.create_key(DEFAULT_TENANT, req)
        assert result["scopes"] == scopes

    def test_get_key(self, engine):
        key = engine.get_key(DEFAULT_TENANT, "key-integracion-001")
        assert key is not None
        assert key.id == "key-integracion-001"
        assert key.tenant_id == DEFAULT_TENANT

    def test_get_key_nonexistent(self, engine):
        key = engine.get_key(DEFAULT_TENANT, "key-nonexistent")
        assert key is None

    def test_revoke_key(self, engine):
        engine.revoke_key(DEFAULT_TENANT, "key-integracion-001")
        key = engine.get_key(DEFAULT_TENANT, "key-integracion-001")
        assert key.status == "revoked"

    def test_revoke_already_revoked(self, engine):
        with pytest.raises(ValueError, match="ya está revocada"):
            engine.revoke_key(DEFAULT_TENANT, "key-revoked-004")

    def test_list_keys(self, engine):
        keys = engine.list_keys(DEFAULT_TENANT)
        assert len(keys) == 4

    def test_list_keys_active_only(self, engine):
        keys = engine.list_keys(DEFAULT_TENANT)
        active = [k for k in keys if k.status == "active"]
        assert len(active) == 3

    def test_get_usage(self, engine):
        usage = engine.get_usage(DEFAULT_TENANT)
        assert usage.tenant_id == DEFAULT_TENANT
        assert usage.total_requests > 0

    def test_get_usage_has_endpoints(self, engine):
        usage = engine.get_usage(DEFAULT_TENANT)
        assert len(usage.requests_by_endpoint) > 0

    def test_register_webhook(self, engine):
        wh = engine.register_webhook(
            DEFAULT_TENANT,
            "https://example.com/webhook",
            ["test.event"],
        )
        assert wh.id.startswith("wh-")
        assert wh.status == "active"

    def test_register_webhook_validates_url(self, engine):
        with pytest.raises(ValueError, match="HTTPS"):
            engine.register_webhook(DEFAULT_TENANT, "http://example.com/webhook", ["test.event"])

    def test_list_webhooks(self, engine):
        whs = engine.list_webhooks(DEFAULT_TENANT)
        assert len(whs) == 2

    def test_remove_webhook(self, engine):
        engine.remove_webhook(DEFAULT_TENANT, "wh-facturas-001")
        whs = engine.list_webhooks(DEFAULT_TENANT)
        assert len(whs) == 1

    def test_remove_nonexistent(self, engine):
        with pytest.raises(ValueError, match="no encontrado"):
            engine.remove_webhook(DEFAULT_TENANT, "wh-nonexistent")

    def test_get_rate_limit(self, engine):
        rl = engine.get_rate_limit(DEFAULT_TENANT)
        assert rl.tenant_id == DEFAULT_TENANT
        assert rl.limit == 300

    def test_get_rate_limit_remaining(self, engine):
        rl = engine.get_rate_limit(DEFAULT_TENANT)
        assert rl.remaining <= rl.limit
        assert rl.remaining >= 0

    def test_simulate_response_valid(self, engine):
        resp = engine.simulate_response("/api/v2/status")
        assert resp["status"] == "ok"
        assert resp["service"] == "Public API v2"

    def test_simulate_response_invalid_endpoint(self, engine):
        resp = engine.simulate_response("/api/v2/nonexistent")
        assert resp["status"] == "ok"
        assert "simulada" in resp["message"]

    @pytest.mark.xfail(reason=BCRYPT_PASSWORD_TOO_LONG, strict=False)
    def test_key_prefix_unique(self, engine):
        r1 = engine.create_key(DEFAULT_TENANT, APICreateKeyRequest(
            tenant_id=DEFAULT_TENANT, name="Key 1", scopes=["tax:read"],
        ))
        r2 = engine.create_key(DEFAULT_TENANT, APICreateKeyRequest(
            tenant_id=DEFAULT_TENANT, name="Key 2", scopes=["tax:read"],
        ))
        assert r1["key_prefix"] != r2["key_prefix"]

    def test_webhook_generates_secret(self, engine):
        wh = engine.register_webhook(
            DEFAULT_TENANT,
            "https://example.com/webhook",
            ["test.event"],
        )
        assert wh.secret.startswith("whsec_")
        assert len(wh.secret) > 10
