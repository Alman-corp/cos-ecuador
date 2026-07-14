import sys
import copy
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
import engines.marketplace_engine as me


@pytest.fixture(autouse=True)
def reset_installed_plugins():
    saved = copy.deepcopy(me.INSTALLED_PLUGINS_DATA)
    yield
    me.INSTALLED_PLUGINS_DATA.clear()
    me.INSTALLED_PLUGINS_DATA.extend(saved)


@pytest.fixture
def engine():
    return me.MarketplaceEngine()


@pytest.fixture
def install_request():
    return lambda plugin_id, accept_terms=True, config=None: me.PluginInstallRequest(
        plugin_id=plugin_id,
        accept_terms=accept_terms,
        config=config or {},
    )
