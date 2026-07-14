import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from engine.registry_engine import RegistryEngine
from engine.health_engine import HealthEngine


@pytest.fixture
def registry_engine():
    return RegistryEngine()


@pytest.fixture
def health_engine():
    return HealthEngine()


@pytest.fixture
def sample_service():
    return {
        "id": "test-service",
        "name": "Test Service",
        "description": "A test service",
        "version": "0.1.0",
        "url": "http://localhost:9999",
        "tags": ["test"],
        "dependencies": [],
        "registered_at": "2025-01-01T00:00:00Z",
        "last_heartbeat": None,
        "endpoints": [
            {"path": "/api/v1/test/hello", "method": "GET", "description": "Test endpoint"},
        ],
    }
