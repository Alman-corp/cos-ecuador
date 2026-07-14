"""77: FX Converter with Frankfurter API, in-memory + disk cache, fallback rates."""
from __future__ import annotations
import json
import time
import os
import logging
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional
import numpy as np
from app.shared.schemas import FXConversion, FXConversionResult, CurrencyCode

logger = logging.getLogger(__name__)

_FALLBACK_RATES: dict[str, dict[str, float]] = {
    "USD": {"EUR": 0.92, "MXN": 18.50, "COP": 4100, "PEN": 3.75, "CLP": 950, "BRL": 5.15, "ARS": 880, "USD": 1.0},
    "EUR": {"USD": 1.09, "MXN": 20.10, "COP": 4450, "PEN": 4.08, "CLP": 1030, "BRL": 5.60, "ARS": 950, "EUR": 1.0},
}


class FXConverter:
    def __init__(self, cache_dir: Optional[str] = None, api_base: str = "https://api.frankfurter.dev"):
        self.api_base = api_base
        self._mem_cache: dict[str, tuple[float, float]] = {}
        self._cache_dir = Path(cache_dir or os.environ.get("FX_CACHE_DIR", "cache/fx"))
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        self._last_fetch: dict[str, float] = {}

    def convert(self, request: FXConversion) -> FXConversionResult:
        rate, source = self._get_rate(request.from_currency.value, request.to_currency.value, request.as_of_date)
        converted = round(request.amount * rate, 2)
        vol = self._get_volatility(request.from_currency.value, request.to_currency.value)
        return FXConversionResult(original_amount=request.amount, original_currency=request.from_currency, converted_amount=converted, target_currency=request.to_currency, rate_used=rate, rate_date=request.as_of_date, rate_source=source, historical_volatility_30d=vol)

    def _get_rate(self, from_c: str, to_c: str, as_of: date) -> tuple[float, str]:
        cache_key = f"{from_c}_{to_c}_{as_of.isoformat()}"
        if cache_key in self._mem_cache:
            return self._mem_cache[cache_key][0], "memory_cache"
        rate = self._fetch_api(from_c, to_c, as_of)
        if rate is not None:
            self._mem_cache[cache_key] = (rate, time.time())
            return rate, "frankfurter_api"
        rate = self._load_disk_cache(from_c, to_c, as_of)
        if rate is not None:
            return rate, "disk_cache"
        rate = self._fallback(from_c, to_c)
        if rate is not None:
            return rate, "hardcoded_fallback"
        raise ValueError(f"No rate available for {from_c}→{to_c} on {as_of}")

    def _fetch_api(self, from_c: str, to_c: str, as_of: date) -> Optional[float]:
        try:
            import httpx
            url = f"{self.api_base}/{as_of.isoformat()}?from={from_c}&to={to_c}"
            resp = httpx.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                rate = data["rates"].get(to_c)
                if rate:
                    self._save_disk_cache(from_c, to_c, as_of, rate)
                    return rate
        except Exception as e:
            logger.warning(f"FX API fetch failed: {e}")
        return None

    def _save_disk_cache(self, from_c: str, to_c: str, as_of: date, rate: float):
        try:
            path = self._cache_dir / f"{from_c}_{to_c}.json"
            existing = {}
            if path.exists():
                existing = json.loads(path.read_text())
            existing[as_of.isoformat()] = rate
            path.write_text(json.dumps(existing))
        except Exception as e:
            logger.debug(f"FX cache save failed: {e}")

    def _load_disk_cache(self, from_c: str, to_c: str, as_of: date) -> Optional[float]:
        try:
            path = self._cache_dir / f"{from_c}_{to_c}.json"
            if path.exists():
                data = json.loads(path.read_text())
                return data.get(as_of.isoformat())
        except Exception:
            pass
        return None

    def _fallback(self, from_c: str, to_c: str) -> Optional[float]:
        if from_c in _FALLBACK_RATES and to_c in _FALLBACK_RATES[from_c]:
            return _FALLBACK_RATES[from_c][to_c]
        return None

    def _get_volatility(self, from_c: str, to_c: str, days: int = 30) -> Optional[float]:
        try:
            rates = []
            for i in range(days, 0, -1):
                d = date.today() - timedelta(days=i)
                r, _ = self._get_rate(from_c, to_c, d)
                rates.append(r)
            if len(rates) > 1:
                return round(float(np.std(rates) / np.mean(rates) * 100), 2)
        except Exception:
            pass
        return None

    def get_historical_series(self, from_c: str, to_c: str, start: date, end: date) -> list[dict]:
        results = []
        current = start
        while current <= end:
            try:
                rate, source = self._get_rate(from_c, to_c, current)
                results.append({"date": current.isoformat(), "rate": rate, "source": source})
            except Exception:
                results.append({"date": current.isoformat(), "rate": None, "source": "unavailable"})
            current += timedelta(days=1)
        return results
