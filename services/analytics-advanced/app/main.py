from __future__ import annotations
import os
import pandas as pd
from datetime import date, datetime
from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from contextlib import asynccontextmanager

from app.shared import AnalyticsRequest, ForecastSpec, AnomalySpec
from app.orchestrator import AnalyticsOrchestrator


ORCHESTRATOR = AnalyticsOrchestrator()
SECRET_KEY = os.environ.get("ANALYTICS_SECRET", "dev-secret")


def verify_auth(authorization: str = Header(None, alias="X-Analytics-Secret")):
    if authorization is None:
        authorization = os.environ.get("ANALYTICS_SECRET", "")
    if authorization != SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ORCHESTRATOR
    ORCHESTRATOR = AnalyticsOrchestrator()
    yield


app = FastAPI(
    title="@cos/analytics-advanced",
    description="Advanced analytics engine: causal inference, probabilistic forecasting, anomaly detection, scenario simulation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "service": "analytics-advanced", "timestamp": datetime.utcnow().isoformat()}


def _parse_df(data: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(data)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
    return df


@app.post("/api/causal/effect", tags=["causal"])
async def causal_effect(request: AnalyticsRequest, auth=Depends(verify_auth)):
    df = _parse_df(request.payload.get("data", []))
    ORCHESTRATOR.causal = __import__("app.causal", fromlist=["inference"]).inference.CausalInferenceEngine()
    result = ORCHESTRATOR.dispatch(request, df)
    return result


@app.post("/api/causal/counterfactual", tags=["causal"])
async def causal_counterfactual(request: AnalyticsRequest, auth=Depends(verify_auth)):
    df = _parse_df(request.payload.get("historical_data", []))
    result = ORCHESTRATOR.dispatch(request, df)
    return result


@app.post("/api/causal/discover", tags=["causal"])
async def causal_discover(request: AnalyticsRequest, auth=Depends(verify_auth)):
    df = _parse_df(request.payload.get("data", []))
    result = ORCHESTRATOR.dispatch(request, df)
    return result


@app.post("/api/probabilistic/bayesian", tags=["probabilistic"])
async def bayesian_inference(request: AnalyticsRequest, auth=Depends(verify_auth)):
    df = _parse_df(request.payload.get("data", []))
    result = ORCHESTRATOR.dispatch(request, df)
    return result


@app.post("/api/probabilistic/monte-carlo", tags=["probabilistic"])
async def monte_carlo(request: AnalyticsRequest, auth=Depends(verify_auth)):
    df = _parse_df(request.payload.get("data", []))
    result = ORCHESTRATOR.dispatch(request, df)
    return result


@app.post("/api/forecasting/forecast", tags=["forecasting"])
async def forecast(request: AnalyticsRequest, auth=Depends(verify_auth)):
    df = _parse_df(request.payload.get("data", []))
    result = ORCHESTRATOR.dispatch(request, df)
    return result


@app.post("/api/forecasting/ensemble", tags=["forecasting"])
async def ensemble_forecast(request: AnalyticsRequest, auth=Depends(verify_auth)):
    return {"status": "not_implemented", "message": "Ensemble requires model instances. Use /api/forecasting/forecast with multiple models."}


@app.post("/api/anomaly/detect", tags=["anomaly"])
async def anomaly_detect(request: AnalyticsRequest, auth=Depends(verify_auth)):
    df = _parse_df(request.payload.get("data", []))
    result = ORCHESTRATOR.dispatch(request, df)
    return result


@app.get("/api/scenarios/list", tags=["scenarios"])
async def scenarios_list(category: Optional[str] = Query(None), auth=Depends(verify_auth)):
    presets = ORCHESTRATOR.list_scenarios(category=category)
    return {"scenarios": presets}


@app.post("/api/scenarios/simulate", tags=["scenarios"])
async def scenarios_simulate(request: AnalyticsRequest, auth=Depends(verify_auth)):
    result = ORCHESTRATOR.dispatch(request, pd.DataFrame())
    return result


@app.get("/api/backtesting/model-evaluation", tags=["backtesting"])
async def backtesting_evaluation(
    model_name: str = Query(...),
    entity_id: Optional[str] = Query(None),
    variable: Optional[str] = Query(None),
    auth=Depends(verify_auth),
):
    result = ORCHESTRATOR.evaluate_model(model_name=model_name, entity_id=entity_id, variable=variable)
    return result


@app.post("/api/backtesting/register-actual", tags=["backtesting"])
async def backtesting_register_actual(
    entity_id: str = Query(...),
    variable: str = Query(...),
    actual_date: date = Query(...),
    actual_value: float = Query(...),
    auth=Depends(verify_auth),
):
    updated = ORCHESTRATOR.register_backtest_actual(entity_id, variable, actual_date, actual_value)
    return {"updated": updated}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8003, reload=False)
