import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from engines.clients_engine import ClientsEngine
from engines.portfolio_engine import PortfolioEngine


@pytest.fixture
def engine():
    return ClientsEngine()


@pytest.fixture
def portfolio(engine):
    return PortfolioEngine(engine)
