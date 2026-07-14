import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from engines.documents_engine import DocumentsEngine, DocumentCreate


@pytest.fixture
def engine():
    return DocumentsEngine()


@pytest.fixture
def sample_doc_create():
    return DocumentCreate(
        client_id="cli-test-001",
        title="Contrato de Prueba",
        description="Documento de prueba para tests",
        doc_type="contrato",
        category="testing",
        tags=["test", "pytest"],
        created_by="tester",
        file_extension="pdf",
        confidential=False,
        retention_days=365,
    )
