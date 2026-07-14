import pytest
import numpy as np
from engines.macro_data import (
    MacroDataService,
    ECUADOR_INDICATORS,
    INDICATOR_METADATA,
    aggregate_monthly_to_quarterly,
)


@pytest.fixture
def svc():
    return MacroDataService()


class TestMacroDataService:
    def test_get_indicator_gdp(self, svc):
        data = svc.get_indicator("gdp")
        assert "2020Q1" in data
        assert "2025Q4" in data
        assert data["2020Q1"] == 16752.0
        assert data["2025Q4"] == 20950.0
        assert len(data) == 24

    def test_get_indicator_oil_price(self, svc):
        data = svc.get_indicator("oil_price")
        assert "2020-01" in data
        assert "2026-06" in data
        assert isinstance(data["2020-01"], float)

    def test_get_indicator_invalid(self, svc):
        with pytest.raises(ValueError, match="not found"):
            svc.get_indicator("nonexistent")

    def test_get_all_indicators(self, svc):
        all_data = svc.get_all_indicators()
        assert len(all_data) == 6
        assert "gdp" in all_data
        assert "oil_price" in all_data
        assert "tax_revenue" in all_data
        assert "remittances" in all_data
        assert "interest_rate" in all_data
        assert "cpi" in all_data

    def test_get_latest_values(self, svc):
        latest = svc.get_latest_values()
        assert len(latest) == 6
        assert latest["gdp"] == 20950.0
        assert latest["oil_price"] == 69.50
        assert latest["cpi"] == 114.40

    def test_aggregate_monthly_to_quarterly(self):
        monthly = {"2020-01": 10.0, "2020-02": 20.0, "2020-03": 30.0}
        qdata = aggregate_monthly_to_quarterly(monthly, agg_func="mean")
        assert "2020Q1" in qdata
        assert qdata["2020Q1"] == 20.0

        qdata_sum = aggregate_monthly_to_quarterly(monthly, agg_func="sum")
        assert qdata_sum["2020Q1"] == 60.0

        qdata_last = aggregate_monthly_to_quarterly(monthly, agg_func="last")
        assert qdata_last["2020Q1"] == 30.0

    def test_indicator_metadata(self):
        assert "gdp" in INDICATOR_METADATA
        assert "cpi" in INDICATOR_METADATA
        meta_gdp = INDICATOR_METADATA["gdp"]
        assert meta_gdp.frequency == "quarterly"
        assert meta_gdp.unit == "Millones USD (2018 prices)"
        meta_oil = INDICATOR_METADATA["oil_price"]
        assert meta_oil.frequency == "monthly"

    def test_get_indicator_as_dataframe(self, svc):
        df = svc.get_indicator("gdp", as_dataframe=True)
        assert "value" in df.columns
        assert "period" in df.columns

    def test_build_midas_dataset(self, svc):
        df = svc.build_midas_dataset(target="gdp", predictors=["oil_price"])
        assert "gdp" in df.columns
        assert "oil_price" in df.columns
        assert len(df) > 0

    def test_indicators_summary(self, svc):
        summary = svc.get_indicators_summary()
        assert len(summary) == 6
        codes = [m.code for m in summary]
        assert "gdp" in codes
        assert "cpi" in codes
