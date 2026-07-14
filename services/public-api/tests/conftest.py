import sys
from pathlib import Path
from copy import deepcopy

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from fastapi.testclient import TestClient
from engines.api_engine import (
    APIEngine, APICreateKeyRequest, APIKey, APIUsage,
    WebhookRegistration, RateLimitStatus, DEFAULT_TENANT,
    API_KEYS_DATA, API_USAGE_DATA, WEBHOOKS_DATA, RATE_LIMIT_STATUS_DATA,
)
import api.public
import main


@pytest.fixture
def engine():
    eng = APIEngine()
    eng.keys = deepcopy(API_KEYS_DATA)
    eng.usage = deepcopy(API_USAGE_DATA)
    eng.webhooks = deepcopy(WEBHOOKS_DATA)
    eng.rate_limit = deepcopy(RATE_LIMIT_STATUS_DATA)
    return eng


@pytest.fixture
def client(engine):
    original = api.public.engine
    api.public.engine = engine
    client = TestClient(main.app)
    yield client
    api.public.engine = original
