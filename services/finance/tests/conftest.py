import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engines.dcf_engine import DCFInput, DCFEngine
from engines.ratios_engine import FinancialStatements, RatiosEngine
from engines.valuation_engine import ValuationEngine, CAPMInput, WACCInput, AmortizationInput
from engines.monte_carlo_engine import MonteCarloInput, MonteCarloEngine
from engines.projections_engine import ProjectionInput, ProjectionsEngine
import pytest
from decimal import Decimal


@pytest.fixture
def sample_dcf_input():
    return DCFInput(
        revenue=[1000.0, 1100.0, 1200.0],
        ebitda=[250.0, 280.0, 310.0],
        capex=[80.0, 85.0, 90.0],
        depreciation=[30.0, 32.0, 35.0],
        nwc_change=[10.0, 12.0, 14.0],
        revenue_growth=[5.0, 5.0, 5.0, 5.0, 5.0],
        ebitda_margin=[0.25, 0.25, 0.25, 0.25, 0.25],
        capex_pct_revenue=[0.08, 0.08, 0.08, 0.08, 0.08],
        nwc_pct_revenue=[0.02, 0.02, 0.02, 0.02, 0.02],
    )


@pytest.fixture
def sample_financials():
    return FinancialStatements(
        current_assets=500000.0,
        current_liabilities=200000.0,
        cash=50000.0,
        total_assets=1000000.0,
        total_equity=600000.0,
        total_liabilities=400000.0,
        ebit=120000.0,
        net_income=80000.0,
        revenue=800000.0,
        ebitda=150000.0,
        inventories=100000.0,
        accounts_receivable=120000.0,
        accounts_payable=80000.0,
        cost_of_goods_sold=480000.0,
        interest_expense=20000.0,
        operating_cashflow=90000.0,
    )


@pytest.fixture
def sample_projection_input():
    return ProjectionInput(
        base_revenue=1000000.0,
        growth_rates=[10.0, 8.0, 6.0, 5.0, 4.0],
    )
