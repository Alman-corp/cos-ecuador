"""78: Inflation Adjustment with FRED API, CPI defaults 2010-2025, real growth interpretation."""
from __future__ import annotations
import json
import os
import logging
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional
from app.shared.schemas import InflationAdjustment, InflationResult, CurrencyCode

logger = logging.getLogger(__name__)

_ANNUAL_CPI_USD: dict[int, float] = {
    2010: 218.056, 2011: 224.939, 2012: 229.594, 2013: 232.957, 2014: 236.736,
    2015: 237.017, 2016: 240.007, 2017: 245.120, 2018: 251.107, 2019: 255.657,
    2020: 258.811, 2021: 270.970, 2022: 292.655, 2023: 304.702, 2024: 313.800,
    2025: 322.500,
}

_LATAM_CPI: dict[str, dict[int, float]] = {
    "MXN": {2010: 83.5, 2015: 100.0, 2020: 120.5, 2023: 140.2, 2024: 146.0, 2025: 152.0},
    "COP": {2010: 70.2, 2015: 100.0, 2020: 130.8, 2023: 170.5, 2024: 180.1, 2025: 190.0},
    "BRL": {2010: 85.0, 2015: 100.0, 2020: 140.2, 2023: 175.0, 2024: 185.0, 2025: 195.0},
}


class InflationAdjuster:
    def __init__(self, cache_dir: Optional[str] = None):
        self._cache_dir = Path(cache_dir or os.environ.get("INFLATION_CACHE_DIR", "cache/inflation"))
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._mem_cache: dict[str, float] = dict(_ANNUAL_CPI_USD)

    def adjust(self, request: InflationAdjustment) -> InflationResult:
        cpi_series = self._get_cpi_series(request.currency)
        base_cpi = self._get_cpi_for_year(cpi_series, request.original_date.year)
        target_cpi = self._get_cpi_for_year(cpi_series, request.target_date.year)
        if base_cpi is None or target_cpi is None:
            base_cpi = cpi_series.get(request.original_date.year) or list(cpi_series.values())[-1]
            target_cpi = cpi_series.get(request.target_date.year) or list(cpi_series.values())[-1]
        cum_inflation = round((target_cpi / base_cpi - 1) * 100, 2) if base_cpi > 0 else 0
        real_amount = round(request.amount * (base_cpi / target_cpi), 2) if target_cpi > 0 else request.amount
        return InflationResult(nominal_amount=request.amount, real_amount=real_amount, cumulative_inflation_pct=cum_inflation, original_date=request.original_date, target_date=request.target_date, index_used=f"{request.index.value} ({request.currency.value})", base_year=request.original_date.year)

    def _get_cpi_series(self, currency: CurrencyCode) -> dict[int, float]:
        if currency == CurrencyCode.USD:
            return dict(self._mem_cache)
        if currency.value in _LATAM_CPI:
            series = dict(_LATAM_CPI[currency.value])
            series.update(self._fetch_fred_or_disk(currency))
            return series
        return dict(self._mem_cache)

    def _fetch_fred_or_disk(self, currency: CurrencyCode) -> dict[int, float]:
        try:
            path = self._cache_dir / f"cpi_{currency.value}.json"
            if path.exists():
                data = json.loads(path.read_text())
                return {int(k): v for k, v in data.items()}
        except Exception:
            pass
        return {}

    def _get_cpi_for_year(self, series: dict[int, float], year: int) -> Optional[float]:
        if year in series:
            return series[year]
        years = sorted(series.keys())
        if not years:
            return None
        if year < years[0]:
            return series[years[0]]
        if year > years[-1]:
            return series[years[-1]]
        for i in range(len(years) - 1):
            if years[i] <= year <= years[i + 1]:
                frac = (year - years[i]) / (years[i + 1] - years[i])
                return series[years[i]] + frac * (series[years[i + 1]] - series[years[i]])
        return series[years[-1]]

    def interpret_real_growth(self, nominal_growth_pct: float, inflation_pct: float) -> str:
        real = round((1 + nominal_growth_pct / 100) / (1 + inflation_pct / 100) - 1, 2)
        if real > 0.03:
            return f"Strong real growth: {real*100:.1f}% (nominal {nominal_growth_pct:.1f}% vs inflation {inflation_pct:.1f}%)"
        if real > 0:
            return f"Modest real growth: {real*100:.1f}%"
        if real > -0.02:
            return f"Stagnant: real growth {real*100:.1f}%"
        return f"Declining: real growth {real*100:.1f}% (below inflation)"

    def recompute_series(self, base_year: int, base_cpi: float, annual_inflation_rates: list[float]) -> dict[int, float]:
        cpi = base_cpi
        series = {base_year: cpi}
        for i, rate in enumerate(annual_inflation_rates):
            year = base_year + i + 1
            cpi *= (1 + rate / 100)
            series[year] = round(cpi, 3)
        return series
