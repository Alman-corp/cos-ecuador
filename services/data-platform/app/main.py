"""FastAPI entry point for @cos/data-platform — 12 endpoints across 10 modules."""
from __future__ import annotations
import os
import time
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

from app.shared.schemas import (
    RedactionPolicy, PIIDetectionResult,
    Transaction, CategoryTrainingExample, CategorizedTransaction,
    ReconciliationSpec, ReconciliationResult,
    FXConversion, FXConversionResult,
    InflationAdjustment, InflationResult,
    GAAPConversionRequest, GAAPConversionResult,
    DQScore,
)

SECRET_KEY = os.environ.get("DATA_PLATFORM_SECRET", "dev-secret")

# Lazy-loaded engines
_engines: dict = {}

def get_pii():
    if "pii" not in _engines:
        from app.privacy.pii_detector import PIIDetector
        _engines["pii"] = PIIDetector()
    return _engines["pii"]

def get_classifier():
    if "classifier" not in _engines:
        from app.categorization.transaction_classifier import TransactionClassifier
        _engines["classifier"] = TransactionClassifier()
    return _engines["classifier"]

def get_reconciliation():
    if "reconciliation" not in _engines:
        from app.reconciliation.engine import ReconciliationEngine
        _engines["reconciliation"] = ReconciliationEngine()
    return _engines["reconciliation"]

def get_fx():
    if "fx" not in _engines:
        from app.normalization.currency import FXConverter
        _engines["fx"] = FXConverter()
    return _engines["fx"]

def get_inflation():
    if "inflation" not in _engines:
        from app.normalization.inflation import InflationAdjuster
        _engines["inflation"] = InflationAdjuster()
    return _engines["inflation"]

def get_gaap():
    if "gaap" not in _engines:
        from app.gaap.multi_gaap import GAAPConverter
        _engines["gaap"] = GAAPConverter()
    return _engines["gaap"]

def get_dq():
    if "dq" not in _engines:
        from app.quality.dq_score import DQScoreEngine
        _engines["dq"] = DQScoreEngine()
    return _engines["dq"]

def verify_auth(authorization: str = Header(None, alias="X-Data-Platform-Secret")):
    if authorization is None:
        authorization = os.environ.get("DATA_PLATFORM_SECRET", "")
    if authorization != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _engines
    _engines = {}
    yield

app = FastAPI(
    title="@cos/data-platform",
    description="Enterprise data platform: PII detection, categorization, reconciliation, FX, inflation, GAAP, DQ scoring",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

_start_time = time.time()

@app.get("/api/health", tags=["system"])
async def health():
    import psutil
    return {"status": "ok", "service": "data-platform", "uptime_seconds": int(time.time() - _start_time), "memory_mb": round(psutil.Process().memory_info().rss / 1024 / 1024, 1)}

# --- PII Detection (74) ---
@app.post("/api/pii/detect", tags=["pii"])
async def pii_detect(text: str = Query(...), language: str = Query("es"), score_threshold: float = Query(0.5), auth=Depends(verify_auth)):
    return get_pii().detect(text, language, score_threshold)

@app.post("/api/pii/redact", tags=["pii"])
async def pii_redact(text: str = Query(...), strategy: str = Query("mask"), auth=Depends(verify_auth)):
    policy = RedactionPolicy(strategy=strategy)
    return {"redacted": get_pii().redact(text, policy)}

@app.post("/api/pii/scan-dataframe", tags=["pii"])
async def pii_scan_dataframe(auth=Depends(verify_auth)):
    raise HTTPException(status_code=400, detail="Send DataFrame JSON body. Use /api/pii/detect for text.")

# --- Categorization (75) ---
@app.post("/api/categorization/train", tags=["categorization"])
async def categorization_train(examples: list[CategoryTrainingExample], auth=Depends(verify_auth)):
    try:
        result = get_classifier().train(examples)
        return result
    except (RuntimeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/categorization/predict", tags=["categorization"])
async def categorization_predict(transaction: Transaction, auth=Depends(verify_auth)):
    return get_classifier().predict(transaction)

# --- Reconciliation (76) ---
@app.post("/api/reconciliation/run", tags=["reconciliation"])
async def reconciliation_run(spec: ReconciliationSpec, auth=Depends(verify_auth)):
    return get_reconciliation().reconcile(spec)

# --- FX Conversion (77) ---
@app.post("/api/fx/convert", tags=["fx"])
async def fx_convert(request: FXConversion, auth=Depends(verify_auth)):
    return get_fx().convert(request)

# --- Inflation Adjustment (78) ---
@app.post("/api/inflation/adjust", tags=["inflation"])
async def inflation_adjust(request: InflationAdjustment, auth=Depends(verify_auth)):
    return get_inflation().adjust(request)

# --- GAAP Conversion (79) ---
@app.post("/api/gaap/convert", tags=["gaap"])
async def gaap_convert(request: GAAPConversionRequest, auth=Depends(verify_auth)):
    return get_gaap().convert(request)

@app.get("/api/gaap/available-conversions", tags=["gaap"])
async def gaap_available_conversions(auth=Depends(verify_auth)):
    return {"conversions": get_gaap().available_conversions}

# --- DQ Score (80) ---
@app.post("/api/quality/evaluate", tags=["quality"])
async def quality_evaluate(auth=Depends(verify_auth)):
    raise HTTPException(status_code=400, detail="Send DataFrame via /api/quality/evaluate-dataframe with JSON body")

@app.post("/api/quality/evaluate-dataframe", tags=["quality"])
async def quality_evaluate_dataframe(data: list[dict], entity_id: Optional[str] = Query(None), table_name: Optional[str] = Query(None), auth=Depends(verify_auth)):
    if not data:
        raise HTTPException(status_code=400, detail="Empty dataframe")
    df = pd.DataFrame(data)
    return get_dq().evaluate(df, entity_id=entity_id, table_name=table_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8004, reload=False)
