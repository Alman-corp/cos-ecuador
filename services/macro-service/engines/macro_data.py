import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import Dict, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/macro/data", tags=["macro-data"])


class IndicatorMeta(BaseModel):
    code: str
    name_es: str
    name_en: str
    frequency: str
    source: str
    unit: str
    last_updated: Optional[date] = None


INDICATOR_METADATA: Dict[str, IndicatorMeta] = {
    "gdp": IndicatorMeta(
        code="gdp",
        name_es="Producto Interno Bruto (PIB) Trimestral",
        name_en="Gross Domestic Product (GDP) Quarterly",
        frequency="quarterly",
        source="Banco Central del Ecuador (BCE)",
        unit="Millones USD (2018 prices)",
        last_updated=date(2025, 12, 31),
    ),
    "oil_price": IndicatorMeta(
        code="oil_price",
        name_es="Precio del Petróleo WTI",
        name_en="WTI Oil Price",
        frequency="monthly",
        source="U.S. EIA / BCE",
        unit="USD / barril",
        last_updated=date(2026, 6, 30),
    ),
    "tax_revenue": IndicatorMeta(
        code="tax_revenue",
        name_es="Recaudación Tributaria SRI",
        name_en="Tax Revenue SRI",
        frequency="monthly",
        source="Servicio de Rentas Internas (SRI)",
        unit="Millones USD",
        last_updated=date(2026, 6, 30),
    ),
    "remittances": IndicatorMeta(
        code="remittances",
        name_es="Remesas Familiares",
        name_en="Family Remittances",
        frequency="monthly",
        source="Banco Central del Ecuador (BCE)",
        unit="Millones USD",
        last_updated=date(2026, 6, 30),
    ),
    "interest_rate": IndicatorMeta(
        code="interest_rate",
        name_es="Tasa de Interés Activa Referencial",
        name_en="Benchmark Lending rate",
        frequency="monthly",
        source="Banco Central del Ecuador (BCE)",
        unit="Porcentaje (%)",
        last_updated=date(2026, 6, 30),
    ),
    "cpi": IndicatorMeta(
        code="cpi",
        name_es="Índice de Precios al Consumidor (IPC)",
        name_en="Consumer Price Index (CPI)",
        frequency="monthly",
        source="Instituto Nacional de Estadística y Censos (INEC)",
        unit="Índice base 2014=100",
        last_updated=date(2026, 6, 30),
    ),
}


ECUADOR_INDICATORS: Dict[str, Dict[str, float]] = {
    "gdp": {
        "2020Q1": 16752.0,
        "2020Q2": 13580.0,
        "2020Q3": 15025.0,
        "2020Q4": 15920.0,
        "2021Q1": 16300.0,
        "2021Q2": 17150.0,
        "2021Q3": 17480.0,
        "2021Q4": 17900.0,
        "2022Q1": 18250.0,
        "2022Q2": 18720.0,
        "2022Q3": 19010.0,
        "2022Q4": 19280.0,
        "2023Q1": 19450.0,
        "2023Q2": 19600.0,
        "2023Q3": 19780.0,
        "2023Q4": 19850.0,
        "2024Q1": 19980.0,
        "2024Q2": 20150.0,
        "2024Q3": 20320.0,
        "2024Q4": 20400.0,
        "2025Q1": 20550.0,
        "2025Q2": 20700.0,
        "2025Q3": 20850.0,
        "2025Q4": 20950.0,
    },
    "oil_price": {
        "2020-01": 57.52,
        "2020-02": 50.42,
        "2020-03": 30.32,
        "2020-04": 16.55,
        "2020-05": 29.43,
        "2020-06": 38.32,
        "2020-07": 40.73,
        "2020-08": 42.89,
        "2020-09": 39.80,
        "2020-10": 40.21,
        "2020-11": 42.15,
        "2020-12": 47.12,
        "2021-01": 52.11,
        "2021-02": 59.04,
        "2021-03": 62.14,
        "2021-04": 63.58,
        "2021-05": 66.32,
        "2021-06": 71.38,
        "2021-07": 72.62,
        "2021-08": 67.91,
        "2021-09": 72.23,
        "2021-10": 81.30,
        "2021-11": 79.44,
        "2021-12": 72.36,
        "2022-01": 85.14,
        "2022-02": 91.68,
        "2022-03": 108.50,
        "2022-04": 104.69,
        "2022-05": 114.20,
        "2022-06": 118.93,
        "2022-07": 105.41,
        "2022-08": 94.13,
        "2022-09": 87.24,
        "2022-10": 87.32,
        "2022-11": 85.30,
        "2022-12": 80.29,
        "2023-01": 78.22,
        "2023-02": 77.66,
        "2023-03": 73.43,
        "2023-04": 79.14,
        "2023-05": 72.71,
        "2023-06": 71.68,
        "2023-07": 75.93,
        "2023-08": 80.15,
        "2023-09": 88.12,
        "2023-10": 85.32,
        "2023-11": 77.56,
        "2023-12": 72.88,
        "2024-01": 74.39,
        "2024-02": 76.55,
        "2024-03": 80.12,
        "2024-04": 83.47,
        "2024-05": 78.90,
        "2024-06": 81.23,
        "2024-07": 79.67,
        "2024-08": 76.44,
        "2024-09": 71.89,
        "2024-10": 73.55,
        "2024-11": 70.21,
        "2024-12": 72.88,
        "2025-01": 75.10,
        "2025-02": 74.30,
        "2025-03": 71.80,
        "2025-04": 68.50,
        "2025-05": 66.20,
        "2025-06": 64.90,
        "2025-07": 67.40,
        "2025-08": 69.80,
        "2025-09": 72.10,
        "2025-10": 70.50,
        "2025-11": 68.30,
        "2025-12": 69.90,
        "2026-01": 71.20,
        "2026-02": 72.80,
        "2026-03": 70.10,
        "2026-04": 68.90,
        "2026-05": 67.40,
        "2026-06": 69.50,
    },
    "tax_revenue": {
        "2020-01": 1280.5,
        "2020-02": 1120.3,
        "2020-03": 890.2,
        "2020-04": 650.8,
        "2020-05": 720.5,
        "2020-06": 950.4,
        "2020-07": 1020.7,
        "2020-08": 1100.3,
        "2020-09": 1150.9,
        "2020-10": 1080.6,
        "2020-11": 1120.4,
        "2020-12": 1350.2,
        "2021-01": 1320.8,
        "2021-02": 1250.3,
        "2021-03": 1350.5,
        "2021-04": 1280.7,
        "2021-05": 1400.2,
        "2021-06": 1450.6,
        "2021-07": 1380.4,
        "2021-08": 1420.9,
        "2021-09": 1480.3,
        "2021-10": 1520.7,
        "2021-11": 1550.2,
        "2021-12": 1750.8,
        "2022-01": 1600.5,
        "2022-02": 1520.3,
        "2022-03": 1680.7,
        "2022-04": 1580.2,
        "2022-05": 1720.8,
        "2022-06": 1800.4,
        "2022-07": 1700.6,
        "2022-08": 1750.3,
        "2022-09": 1820.9,
        "2022-10": 1780.5,
        "2022-11": 1850.2,
        "2022-12": 2100.7,
        "2023-01": 1750.3,
        "2023-02": 1680.8,
        "2023-03": 1850.4,
        "2023-04": 1720.6,
        "2023-05": 1880.2,
        "2023-06": 1920.9,
        "2023-07": 1820.5,
        "2023-08": 1860.3,
        "2023-09": 1950.7,
        "2023-10": 1900.2,
        "2023-11": 1980.6,
        "2023-12": 2250.4,
        "2024-01": 1820.9,
        "2024-02": 1750.5,
        "2024-03": 1920.3,
        "2024-04": 1850.7,
        "2024-05": 1980.2,
        "2024-06": 2050.8,
        "2024-07": 1950.4,
        "2024-08": 2000.6,
        "2024-09": 2080.3,
        "2024-10": 2020.9,
        "2024-11": 2100.5,
        "2024-12": 2400.2,
        "2025-01": 1950.7,
        "2025-02": 1880.3,
        "2025-03": 2050.8,
        "2025-04": 1980.4,
        "2025-05": 2120.6,
        "2025-06": 2180.2,
        "2025-07": 2080.9,
        "2025-08": 2150.5,
        "2025-09": 2220.3,
        "2025-10": 2180.7,
        "2025-11": 2250.2,
        "2025-12": 2550.8,
        "2026-01": 2100.5,
        "2026-02": 2050.3,
        "2026-03": 2200.8,
        "2026-04": 2150.4,
        "2026-05": 2280.6,
        "2026-06": 2350.2,
    },
    "remittances": {
        "2020-01": 310.2,
        "2020-02": 295.8,
        "2020-03": 210.5,
        "2020-04": 180.3,
        "2020-05": 200.7,
        "2020-06": 240.2,
        "2020-07": 275.6,
        "2020-08": 290.4,
        "2020-09": 305.8,
        "2020-10": 320.3,
        "2020-11": 335.7,
        "2020-12": 380.2,
        "2021-01": 340.5,
        "2021-02": 325.8,
        "2021-03": 360.2,
        "2021-04": 350.7,
        "2021-05": 380.4,
        "2021-06": 395.6,
        "2021-07": 410.3,
        "2021-08": 420.8,
        "2021-09": 435.2,
        "2021-10": 450.6,
        "2021-11": 465.3,
        "2021-12": 510.8,
        "2022-01": 445.2,
        "2022-02": 430.6,
        "2022-03": 470.3,
        "2022-04": 460.8,
        "2022-05": 490.4,
        "2022-06": 505.7,
        "2022-07": 520.2,
        "2022-08": 535.6,
        "2022-09": 550.3,
        "2022-10": 540.8,
        "2022-11": 560.4,
        "2022-12": 610.2,
        "2023-01": 520.6,
        "2023-02": 505.3,
        "2023-03": 545.8,
        "2023-04": 535.2,
        "2023-05": 565.7,
        "2023-06": 580.3,
        "2023-07": 595.6,
        "2023-08": 610.2,
        "2023-09": 625.8,
        "2023-10": 615.3,
        "2023-11": 635.7,
        "2023-12": 690.2,
        "2024-01": 590.4,
        "2024-02": 575.8,
        "2024-03": 615.3,
        "2024-04": 605.7,
        "2024-05": 635.2,
        "2024-06": 650.6,
        "2024-07": 665.3,
        "2024-08": 680.8,
        "2024-09": 695.2,
        "2024-10": 685.6,
        "2024-11": 705.3,
        "2024-12": 760.8,
        "2025-01": 650.5,
        "2025-02": 635.2,
        "2025-03": 680.8,
        "2025-04": 670.3,
        "2025-05": 700.6,
        "2025-06": 715.2,
        "2025-07": 730.8,
        "2025-08": 745.3,
        "2025-09": 760.7,
        "2025-10": 750.2,
        "2025-11": 775.6,
        "2025-12": 830.4,
        "2026-01": 710.3,
        "2026-02": 695.8,
        "2026-03": 735.4,
        "2026-04": 725.6,
        "2026-05": 755.2,
        "2026-06": 770.8,
    },
    "interest_rate": {
        "2020-01": 8.12,
        "2020-02": 8.05,
        "2020-03": 7.85,
        "2020-04": 7.50,
        "2020-05": 7.35,
        "2020-06": 7.20,
        "2020-07": 7.15,
        "2020-08": 7.08,
        "2020-09": 7.00,
        "2020-10": 6.95,
        "2020-11": 6.88,
        "2020-12": 6.80,
        "2021-01": 6.75,
        "2021-02": 6.70,
        "2021-03": 6.65,
        "2021-04": 6.60,
        "2021-05": 6.55,
        "2021-06": 6.50,
        "2021-07": 6.48,
        "2021-08": 6.45,
        "2021-09": 6.42,
        "2021-10": 6.40,
        "2021-11": 6.38,
        "2021-12": 6.35,
        "2022-01": 6.40,
        "2022-02": 6.50,
        "2022-03": 6.70,
        "2022-04": 6.85,
        "2022-05": 7.00,
        "2022-06": 7.20,
        "2022-07": 7.45,
        "2022-08": 7.65,
        "2022-09": 7.90,
        "2022-10": 8.10,
        "2022-11": 8.35,
        "2022-12": 8.55,
        "2023-01": 8.70,
        "2023-02": 8.80,
        "2023-03": 8.95,
        "2023-04": 9.05,
        "2023-05": 9.15,
        "2023-06": 9.20,
        "2023-07": 9.25,
        "2023-08": 9.30,
        "2023-09": 9.35,
        "2023-10": 9.38,
        "2023-11": 9.40,
        "2023-12": 9.42,
        "2024-01": 9.45,
        "2024-02": 9.48,
        "2024-03": 9.50,
        "2024-04": 9.52,
        "2024-05": 9.55,
        "2024-06": 9.58,
        "2024-07": 9.60,
        "2024-08": 9.62,
        "2024-09": 9.65,
        "2024-10": 9.68,
        "2024-11": 9.70,
        "2024-12": 9.72,
        "2025-01": 9.75,
        "2025-02": 9.78,
        "2025-03": 9.80,
        "2025-04": 9.82,
        "2025-05": 9.85,
        "2025-06": 9.88,
        "2025-07": 9.90,
        "2025-08": 9.92,
        "2025-09": 9.95,
        "2025-10": 9.98,
        "2025-11": 10.00,
        "2025-12": 10.02,
        "2026-01": 10.05,
        "2026-02": 10.08,
        "2026-03": 10.10,
        "2026-04": 10.12,
        "2026-05": 10.15,
        "2026-06": 10.18,
    },
    "cpi": {
        "2020-01": 103.45,
        "2020-02": 103.52,
        "2020-03": 103.48,
        "2020-04": 103.12,
        "2020-05": 102.95,
        "2020-06": 102.80,
        "2020-07": 102.75,
        "2020-08": 102.82,
        "2020-09": 102.90,
        "2020-10": 103.05,
        "2020-11": 103.18,
        "2020-12": 103.25,
        "2021-01": 103.35,
        "2021-02": 103.48,
        "2021-03": 103.60,
        "2021-04": 103.72,
        "2021-05": 103.85,
        "2021-06": 104.00,
        "2021-07": 104.15,
        "2021-08": 104.28,
        "2021-09": 104.42,
        "2021-10": 104.55,
        "2021-11": 104.70,
        "2021-12": 104.85,
        "2022-01": 105.10,
        "2022-02": 105.40,
        "2022-03": 105.80,
        "2022-04": 106.15,
        "2022-05": 106.55,
        "2022-06": 106.90,
        "2022-07": 107.20,
        "2022-08": 107.45,
        "2022-09": 107.70,
        "2022-10": 107.95,
        "2022-11": 108.15,
        "2022-12": 108.35,
        "2023-01": 108.60,
        "2023-02": 108.85,
        "2023-03": 109.05,
        "2023-04": 109.20,
        "2023-05": 109.35,
        "2023-06": 109.50,
        "2023-07": 109.60,
        "2023-08": 109.70,
        "2023-09": 109.80,
        "2023-10": 109.90,
        "2023-11": 110.00,
        "2023-12": 110.10,
        "2024-01": 110.25,
        "2024-02": 110.40,
        "2024-03": 110.55,
        "2024-04": 110.70,
        "2024-05": 110.85,
        "2024-06": 111.00,
        "2024-07": 111.12,
        "2024-08": 111.25,
        "2024-09": 111.38,
        "2024-10": 111.50,
        "2024-11": 111.62,
        "2024-12": 111.75,
        "2025-01": 111.90,
        "2025-02": 112.05,
        "2025-03": 112.20,
        "2025-04": 112.35,
        "2025-05": 112.50,
        "2025-06": 112.65,
        "2025-07": 112.80,
        "2025-08": 112.95,
        "2025-09": 113.08,
        "2025-10": 113.22,
        "2025-11": 113.35,
        "2025-12": 113.48,
        "2026-01": 113.65,
        "2026-02": 113.80,
        "2026-03": 113.95,
        "2026-04": 114.10,
        "2026-05": 114.25,
        "2026-06": 114.40,
    },
}


def quarterly_to_period(qtr_str: str) -> tuple:
    year = int(qtr_str[:4])
    q = int(qtr_str[5])
    month = (q - 1) * 3 + 2
    return year, q, month


def period_key(year: int, month: int) -> str:
    return f"{year}-{month:02d}"


def aggregate_monthly_to_quarterly(
    monthly_data: Dict[str, float], agg_func: str = "mean"
) -> Dict[str, float]:
    qdata: Dict[str, list] = {}
    for k, v in monthly_data.items():
        year, month = int(k[:4]), int(k[5:7])
        q = (month - 1) // 3 + 1
        qkey = f"{year}Q{q}"
        qdata.setdefault(qkey, []).append(v)
    result: Dict[str, float] = {}
    for qkey, vals in qdata.items():
        if agg_func == "mean":
            result[qkey] = np.mean(vals)
        elif agg_func == "sum":
            result[qkey] = np.sum(vals)
        elif agg_func == "last":
            result[qkey] = vals[-1]
    return result


def get_monthly_series_as_dataframe(
    series_key: str, start: Optional[str] = None, end: Optional[str] = None
) -> pd.DataFrame:
    raw = ECUADOR_INDICATORS.get(series_key)
    if raw is None:
        raise ValueError(f"Unknown series: {series_key}")
    dates, values = [], []
    for k, v in sorted(raw.items()):
        if start and k < start:
            continue
        if end and k > end:
            continue
        dates.append(k)
        values.append(v)
    df = pd.DataFrame({"period": dates, "value": values})
    df["date"] = pd.to_datetime(df["period"] + "-01")
    df = df.set_index("date").sort_index()
    return df


def get_quarterly_series_as_dataframe(
    series_key: str, start: Optional[str] = None, end: Optional[str] = None
) -> pd.DataFrame:
    raw = ECUADOR_INDICATORS.get(series_key)
    if raw is None:
        raise ValueError(f"Unknown series: {series_key}")
    dates, values = [], []
    for k, v in sorted(raw.items()):
        if start and k < start:
            continue
        if end and k > end:
            continue
        dates.append(k)
        values.append(v)
    df = pd.DataFrame({"period": dates, "value": values})
    df["date"] = pd.PeriodIndex(dates, freq="Q").to_timestamp()
    df = df.set_index("date").sort_index()
    return df


class MacroDataService:
    BCE_URL = "https://www.bce.fin.ec"
    SRI_URL = "https://www.sri.gob.ec"
    INEC_URL = "https://www.ecuadorencifras.gob.ec"

    def __init__(self):
        self.indicators = ECUADOR_INDICATORS
        self.metadata = INDICATOR_METADATA

    def get_indicator(
        self, code: str, as_dataframe: bool = False
    ) -> Dict[str, float]:
        data = self.indicators.get(code)
        if data is None:
            raise ValueError(f"Indicator '{code}' not found. Available: {list(self.indicators.keys())}")
        if as_dataframe:
            if code == "gdp":
                return get_quarterly_series_as_dataframe(code)
            return get_monthly_series_as_dataframe(code)
        return data

    def get_all_indicators(self) -> Dict[str, Dict[str, float]]:
        return dict(self.indicators)

    def get_metadata(self, code: str) -> IndicatorMeta:
        meta = self.metadata.get(code)
        if meta is None:
            raise ValueError(f"Metadata not found for '{code}'")
        return meta

    def get_indicators_summary(self) -> List[IndicatorMeta]:
        return list(self.metadata.values())

    def build_midas_dataset(
        self,
        target: str = "gdp",
        predictors: Optional[List[str]] = None,
        max_lags: int = 4,
    ) -> pd.DataFrame:
        if predictors is None:
            predictors = ["oil_price", "tax_revenue", "remittances", "interest_rate", "cpi"]

        gdp_data = self.get_indicator(target, as_dataframe=True)
        gdp_col = gdp_data["value"].rename("gdp")

        monthly_dfs = []
        for p in predictors:
            mdf = self.get_indicator(p, as_dataframe=True)
            qdf = mdf["value"].resample("QS").mean()
            qdf.name = p
            monthly_dfs.append(qdf)

        df = pd.DataFrame({"gdp": gdp_col})
        for mdf in monthly_dfs:
            df = df.join(mdf, how="inner")

        df = df.dropna()
        return df

    def get_latest_values(self) -> Dict[str, float]:
        latest = {}
        for code, data in self.indicators.items():
            sorted_keys = sorted(data.keys())
            if sorted_keys:
                latest[code] = data[sorted_keys[-1]]
        return latest


@router.get("/indicators")
async def list_indicators():
    svc = MacroDataService()
    return {"indicators": [m.model_dump() for m in svc.get_indicators_summary()]}


@router.get("/indicators/{code}")
async def get_indicator(
    code: str,
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    format: str = Query("json"),
):
    svc = MacroDataService()
    try:
        meta = svc.get_metadata(code)
        data = svc.get_indicator(code)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    filtered = data
    if start:
        filtered = {k: v for k, v in filtered.items() if k >= start}
    if end:
        filtered = {k: v for k, v in filtered.items() if k <= end}
    return {"metadata": meta.model_dump(), "data": filtered, "count": len(filtered)}


@router.get("/latest")
async def get_latest():
    svc = MacroDataService()
    return {"latest": svc.get_latest_values()}
