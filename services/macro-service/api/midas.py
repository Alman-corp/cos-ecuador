import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date
import statsmodels.api as sm
from sklearn.metrics import mean_squared_error, mean_absolute_percentage_error
from sklearn.preprocessing import StandardScaler
import logging
from engines.macro_data import (
    ECUADOR_INDICATORS,
    MacroDataService,
    aggregate_monthly_to_quarterly,
    get_monthly_series_as_dataframe,
    get_quarterly_series_as_dataframe,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/macro/midas", tags=["macro-midas"])


class MIDASConfig(BaseModel):
    target: str = "gdp"
    predictors: List[str] = Field(
        default=["oil_price", "tax_revenue", "remittances", "interest_rate", "cpi"]
    )
    max_lags: int = 4
    test_size: int = 4
    add_constant: bool = True


class MIDASResult(BaseModel):
    nowcast: float
    lower_ci: float = 0.0
    upper_ci: float = 0.0
    rmse: float = 0.0
    r_squared: float = 0.0
    mape: float = 0.0
    coefficients: Dict[str, float] = {}
    predictions: List[float] = []
    actuals: List[float] = []
    quarters: List[str] = []


def compute_rmse(actual: np.ndarray, predicted: np.ndarray) -> float:
    return float(np.sqrt(mean_squared_error(actual, predicted)))


def compute_mape(actual: np.ndarray, predicted: np.ndarray) -> float:
    mask = np.abs(actual) > 1e-10
    if not np.any(mask):
        return 0.0
    return float(
        np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100
    )


def create_distributed_lags(
    monthly_series: np.ndarray, n_quarters: int, max_lags: int
) -> np.ndarray:
    needed_months = n_quarters * 3
    if len(monthly_series) >= needed_months:
        monthly = monthly_series[:needed_months].copy()
    else:
        monthly = monthly_series.copy()
        n_quarters = len(monthly) // 3
        if n_quarters == 0:
            return np.zeros((1, max_lags))
        needed_months = n_quarters * 3
        monthly = monthly[-needed_months:]

    lag_matrix = np.zeros((n_quarters, max_lags))
    for q in range(n_quarters):
        end = 3 * (q + 1)
        start = max(0, end - max_lags)
        vals = monthly[start:end]
        if len(vals) < max_lags:
            pad_val = float(vals[0]) if len(vals) > 0 else 0.0
            lag_matrix[q] = np.pad(vals, (max_lags - len(vals), 0), 'constant', constant_values=pad_val)
        else:
            lag_matrix[q] = vals
    return lag_matrix


def umidas_almon(
    y_quarterly: np.ndarray,
    x_monthly: np.ndarray,
    max_lags: int = 4,
    add_const: bool = True,
) -> Tuple[sm.regression.linear_model.RegressionResultsWrapper, np.ndarray]:
    X_lags = create_distributed_lags(x_monthly, len(y_quarterly), max_lags)
    n_quarters_eff = min(X_lags.shape[0], len(y_quarterly))
    X_use = X_lags[-n_quarters_eff:]
    y_use = y_quarterly[-n_quarters_eff:]
    if add_const:
        X_exog = sm.add_constant(X_use)
    else:
        X_exog = X_use
    model = sm.OLS(y_use, X_exog)
    results = model.fit()
    return results, X_exog


class MIDASEngine:
    def __init__(
        self,
        target: str = "gdp",
        predictors: Optional[List[str]] = None,
        max_lags: int = 4,
    ):
        self.target = target
        self.predictors = predictors or [
            "oil_price",
            "tax_revenue",
            "remittances",
            "interest_rate",
            "cpi",
        ]
        self.max_lags = max_lags
        self.results: Dict[str, sm.regression.linear_model.RegressionResultsWrapper] = (
            {}
        )
        self.feature_names: List[str] = []
        self.scaler = StandardScaler()
        self.data_service = MacroDataService()
        self._is_fitted = False

    def estimate_umidas(
        self,
        y: np.ndarray,
        X_dict: Dict[str, np.ndarray],
        quarter_labels: Optional[List[str]] = None,
    ) -> MIDASResult:
        predictions_list: List[float] = []
        actuals_list: List[float] = []
        coefficients: Dict[str, float] = {}

        for pred_name in list(X_dict.keys()):
            x_vals = X_dict[pred_name]
            results, _ = umidas_almon(
                y, x_vals, max_lags=self.max_lags, add_const=True
            )
            self.results[pred_name] = results
            y_pred = results.predict()
            n_obs = len(y_pred)
            y_actual = y[-n_obs:] if n_obs <= len(y) else y
            predictions_list.extend(y_pred.tolist())
            actuals_list.extend(y_actual.tolist())
            coef_names = (
                ["const"] + [f"lag_{i+1}" for i in range(self.max_lags)]
                if results.params.shape[0] > self.max_lags
                else [f"lag_{i+1}" for i in range(results.params.shape[0])]
            )
            for i, c in enumerate(results.params):
                idx = results.params.index[i] if hasattr(results.params, 'index') else i
                cname = coef_names[i] if i < len(coef_names) else f"coef_{i}"
                coefficients[f"{pred_name}_{cname}"] = float(c)

        y_pred_all = np.array(predictions_list[: len(y)])
        y_actual_all = y[: len(y_pred_all)]

        rmse = compute_rmse(y_actual_all, y_pred_all) if len(y_actual_all) > 0 else 0.0
        mape = compute_mape(y_actual_all, y_pred_all) if len(y_actual_all) > 0 else 0.0

        ss_res = np.sum((y_actual_all - y_pred_all) ** 2)
        ss_tot = np.sum((y_actual_all - np.mean(y_actual_all)) ** 2)
        r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

        nowcast_val = float(y_pred_all[-1]) if len(y_pred_all) > 0 else 0.0

        residuals = y_actual_all - y_pred_all
        se = np.std(residuals) if len(residuals) > 1 else 0.0
        lower_ci = nowcast_val - 1.96 * se
        upper_ci = nowcast_val + 1.96 * se

        self._is_fitted = True

        return MIDASResult(
            nowcast=nowcast_val,
            lower_ci=lower_ci,
            upper_ci=upper_ci,
            rmse=rmse,
            r_squared=r_squared,
            mape=mape,
            coefficients=coefficients,
            predictions=predictions_list,
            actuals=actuals_list,
            quarters=quarter_labels or [],
        )

    def nowcast(
        self,
        latest_monthly: Optional[Dict[str, Dict[str, float]]] = None,
    ) -> MIDASResult:
        if not self._is_fitted:
            svc = MacroDataService()
            gdp_data = svc.get_indicator(self.target)
            y_vals = np.array(list(gdp_data.values()))
            quarter_labels = list(gdp_data.keys())

            X_dict: Dict[str, np.ndarray] = {}
            for p in self.predictors:
                monthly_data = svc.get_indicator(p)
                x_vals = np.array(list(monthly_data.values()))
                X_dict[p] = x_vals

            return self.estimate_umidas(y_vals, X_dict, quarter_labels)

        svc = MacroDataService()
        preds = []
        for p in self.predictors:
            if p in self.results:
                pred = self.results[p].predict()
                if len(pred) > 0:
                    preds.append(pred[-1])
        nowcast_val = float(np.mean(preds)) if preds else 0.0

        residuals = []
        for p in self.predictors:
            if p in self.results:
                residuals.extend(self.results[p].resid.tolist())

        se = float(np.std(residuals)) if residuals else 0.0
        lower_ci = nowcast_val - 1.96 * se
        upper_ci = nowcast_val + 1.96 * se

        coeffs = {}
        for p, res in self.results.items():
            for i, c in enumerate(res.params):
                coeffs[f"{p}_coef_{i}"] = float(c)

        return MIDASResult(
            nowcast=nowcast_val,
            lower_ci=lower_ci,
            upper_ci=upper_ci,
            rmse=0.0,
            r_squared=0.0,
            mape=0.0,
            coefficients=coeffs,
        )

    def _backtest_expanding_window(
        self,
        y: np.ndarray,
        X_dict: Dict[str, np.ndarray],
        initial_window: int = 8,
        step: int = 1,
    ) -> MIDASResult:
        n = len(y)
        all_preds: List[float] = []
        all_actuals: List[float] = []
        quarter_labels: List[str] = []

        for end in range(initial_window, n + 1, step):
            y_train = y[:end]
            running_X: Dict[str, np.ndarray] = {}
            for p, xv in X_dict.items():
                x_len = min(len(xv), end * 3)
                running_X[p] = xv[-x_len:] if x_len < len(xv) else xv

            for p in list(X_dict.keys()):
                x_vals = running_X.get(p, X_dict[p])
                results, _ = umidas_almon(
                    y_train, x_vals, max_lags=self.max_lags, add_const=True
                )
                self.results[p] = results

            y_pred = np.mean(
                [
                    self.results[p].predict()[-1]
                    for p in self.predictors
                    if p in self.results
                ]
            )
            if end < n:
                y_actual = y[end]
                all_preds.append(float(y_pred))
                all_actuals.append(float(y_actual))

        y_pred_a = np.array(all_preds)
        y_act_a = np.array(all_actuals)
        rmse = compute_rmse(y_act_a, y_pred_a) if len(y_act_a) > 0 else 0.0
        mape = compute_mape(y_act_a, y_pred_a) if len(y_act_a) > 0 else 0.0

        ss_res = np.sum((y_act_a - y_pred_a) ** 2)
        ss_tot = np.sum((y_act_a - np.mean(y_act_a)) ** 2)
        r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

        nowcast_val = float(all_preds[-1]) if all_preds else 0.0
        residuals = y_act_a - y_pred_a
        se = float(np.std(residuals)) if len(residuals) > 1 else 0.0
        lower_ci = nowcast_val - 1.96 * se
        upper_ci = nowcast_val + 1.96 * se

        return MIDASResult(
            nowcast=nowcast_val,
            lower_ci=lower_ci,
            upper_ci=upper_ci,
            rmse=rmse,
            r_squared=r_squared,
            mape=mape,
            coefficients={},
            predictions=all_preds,
            actuals=all_actuals,
            quarters=quarter_labels,
        )

    def get_feature_importance(
        self, y: np.ndarray, X_dict: Dict[str, np.ndarray]
    ) -> Dict[str, float]:
        importance: Dict[str, float] = {}
        for p in self.predictors:
            if p in X_dict:
                xv = X_dict[p]
                n_quarters = min(len(y), len(xv) // 3)
                if n_quarters < 2:
                    importance[p] = 0.0
                    continue
                x_trimmed = xv[:n_quarters * 3]
                x_q = np.array([np.mean(x_trimmed[i*3:(i+1)*3]) for i in range(n_quarters)])
                y_trimmed = y[-n_quarters:]
                X_simple = sm.add_constant(x_q)
                model = sm.OLS(y_trimmed, X_simple).fit()
                coef_val = float(model.params[1]) if len(model.params) > 1 else 0.0
                std_x = float(np.std(x_q)) if np.std(x_q) > 0 else 1.0
                std_y = float(np.std(y_trimmed)) if np.std(y_trimmed) > 0 else 1.0
                beta_std = coef_val * (std_x / std_y)
                importance[p] = abs(beta_std)
        total = sum(v for v in importance.values()) or 1.0
        for k in importance:
            importance[k] = importance[k] / total
        return importance


@router.get("/nowcast/gdp")
async def nowcast_gdp():
    engine = MIDASEngine()
    svc = MacroDataService()
    gdp_data = svc.get_indicator("gdp")
    y_vals = np.array(list(gdp_data.values()))
    quarter_labels = list(gdp_data.keys())

    X_dict: Dict[str, np.ndarray] = {}
    for p in engine.predictors:
        monthly_data = svc.get_indicator(p)
        x_vals = np.array(list(monthly_data.values()))
        X_dict[p] = x_vals

    result = engine.estimate_umidas(y_vals, X_dict, quarter_labels)
    return {
        "model": "U-MIDAS",
        "target": "gdp",
        "nowcast_usd_millions": round(result.nowcast, 2),
        "confidence_interval": {
            "lower": round(result.lower_ci, 2),
            "upper": round(result.upper_ci, 2),
        },
        "rmse": round(result.rmse, 2),
        "r_squared": round(result.r_squared, 4),
        "mape_percent": round(result.mape, 2),
        "n_quarters": len(result.quarters),
        "last_updated": datetime.now().isoformat(),
    }


@router.get("/indicators")
async def get_indicators():
    svc = MacroDataService()
    return {"indicators": svc.get_all_indicators()}


@router.post("/estimate")
async def estimate(config: MIDASConfig):
    engine = MIDASEngine(
        target=config.target,
        predictors=config.predictors,
        max_lags=config.max_lags,
    )
    svc = MacroDataService()
    y_data = svc.get_indicator(config.target)
    y_vals = np.array(list(y_data.values()))
    quarter_labels = list(y_data.keys())

    X_dict: Dict[str, np.ndarray] = {}
    for p in config.predictors:
        monthly_data = svc.get_indicator(p)
        x_vals = np.array(list(monthly_data.values()))
        X_dict[p] = x_vals

    result = engine.estimate_umidas(y_vals, X_dict, quarter_labels)
    return {
        "status": "success",
        "config": config.model_dump(),
        "result": result.model_dump(),
        "feature_importance": engine.get_feature_importance(y_vals, X_dict),
    }


@router.post("/backtest")
async def backtest(
    initial_window: int = Query(8, ge=4),
    step: int = Query(1, ge=1),
):
    engine = MIDASEngine()
    svc = MacroDataService()
    gdp_data = svc.get_indicator("gdp")
    y_vals = np.array(list(gdp_data.values()))

    X_dict: Dict[str, np.ndarray] = {}
    for p in engine.predictors:
        monthly_data = svc.get_indicator(p)
        x_vals = np.array(list(monthly_data.values()))
        X_dict[p] = x_vals

    result = engine._backtest_expanding_window(y_vals, X_dict, initial_window, step)
    return {
        "status": "success",
        "method": "expanding_window",
        "initial_window": initial_window,
        "step": step,
        "result": result.model_dump(),
    }
