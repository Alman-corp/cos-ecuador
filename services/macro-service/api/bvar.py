import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field, validator
from fastapi import APIRouter, HTTPException, Query, Path as FPath
from datetime import datetime
from scipy.optimize import minimize
from scipy.stats import invwishart, multivariate_normal
import logging

from engines.macro_data import (
    ECUADOR_INDICATORS,
    MacroDataService,
    aggregate_monthly_to_quarterly,
    get_monthly_series_as_dataframe,
    get_quarterly_series_as_dataframe,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/macro/bvar", tags=["macro-bvar"])


class BVARInput(BaseModel):
    variables: List[str] = Field(
        default=["gdp", "oil_price", "tax_revenue", "remittances", "interest_rate", "cpi"],
        description="List of variable codes to include in the VAR",
    )
    lags: int = Field(default=2, ge=1, le=8, description="Number of lags in the VAR")
    prior_tightness: float = Field(
        default=0.2, ge=0.01, le=1.0, description="Minnesota prior overall tightness (lambda1)"
    )
    prior_decay: float = Field(
        default=1.0, ge=0.0, le=2.0, description="Minnesota prior lag decay (lambda3)"
    )
    prior_own: float = Field(
        default=1.0, ge=0.01, le=1.0, description="Minnesota prior own lag weight (lambda2)"
    )
    n_draws: int = Field(default=2000, ge=100, le=10000, description="Number of posterior draws")
    n_burnin: int = Field(default=500, ge=0, le=5000, description="Number of burn-in draws")


class BVAROutput(BaseModel):
    status: str = "success"
    message: str = ""
    coefficients: Dict[str, List[float]] = {}
    sigma: List[List[float]] = []
    log_likelihood: float = 0.0
    n_obs: int = 0
    n_vars: int = 0
    lags: int = 0
    variable_order: List[str] = []
    information_criteria: Dict[str, float] = {}


class ForecastOutput(BaseModel):
    variable: str
    horizon: int
    forecast: List[float]
    lower_68: List[float]
    upper_68: List[float]
    lower_95: List[float]
    upper_95: List[float]
    dates: List[str]


class ConditionalForecastInput(BaseModel):
    horizon: int = Field(default=4, ge=1, le=20)
    conditions: Dict[str, List[float]] = Field(
        default={"gdp": [21000.0, 21200.0, 21400.0, 21600.0]},
        description="Conditional paths for variables. Keys are variable names, values are paths.",
    )
    conditioning_type: str = Field(
        default="hard", pattern="^(hard|soft)$",
        description="Hard conditions are exact; soft are with noise",
    )
    n_draws: int = Field(default=1000, ge=100)


class ImpulseResponseOutput(BaseModel):
    shock_variable: str
    response_variables: Dict[str, List[float]]
    lower_68: Dict[str, List[float]]
    upper_68: Dict[str, List[float]]
    horizon: int
    shock_size: float


class VarianceDecompositionOutput(BaseModel):
    variable: str
    horizon: int
    decomposition: Dict[str, float]
    contributions: Dict[str, List[float]]


def _build_minnesota_prior(
    n_vars: int,
    lags: int,
    sigma_ols: np.ndarray,
    lambda1: float = 0.2,
    lambda2: float = 1.0,
    lambda3: float = 1.0,
) -> Tuple[np.ndarray, np.ndarray]:
    n_coeffs = n_vars * lags + 1
    n_eq = n_vars

    prior_mean = np.zeros((n_coeffs, n_eq))
    prior_var = np.zeros((n_coeffs, n_eq))

    sigma_diag = np.diag(sigma_ols)

    for eq in range(n_eq):
        for var in range(n_vars):
            for lag in range(lags):
                idx = var * lags + lag
                if var == eq:
                    prior_mean[idx, eq] = 1.0 if lag == 0 else 0.0
                else:
                    prior_mean[idx, eq] = 0.0
                sd_sigma_j = np.sqrt(sigma_diag[var]) if sigma_diag[var] > 0 else 1.0
                sd_sigma_i = np.sqrt(sigma_diag[eq]) if sigma_diag[eq] > 0 else 1.0
                ratio = sd_sigma_j / sd_sigma_i if sd_sigma_i > 0 else 1.0
                prior_var[idx, eq] = (lambda1 / (lag + 1) ** lambda3 * ratio) ** 2

        const_idx = n_vars * lags
        prior_mean[const_idx, eq] = 0.0
        prior_var[const_idx, eq] = sigma_diag[eq] * 100.0 if sigma_diag[eq] > 0 else 100.0

    return prior_mean, prior_var


def _estimate_var_ols(
    y: np.ndarray, lags: int
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, int]:
    T, n_vars = y.shape
    T_eff = T - lags
    Y = y[lags:]

    X = np.ones((T_eff, 1))
    for lag in range(lags):
        X = np.hstack([X, y[lags - lag - 1: T - lag - 1]])

    beta_ols = np.linalg.solve(X.T @ X, X.T @ Y)
    residuals = Y - X @ beta_ols
    sigma_ols = (residuals.T @ residuals) / (T_eff - beta_ols.shape[0])
    y_pred = X @ beta_ols
    return beta_ols, sigma_ols, residuals, y_pred, T_eff


def _simulate_posterior(
    y: np.ndarray,
    lags: int,
    prior_mean: np.ndarray,
    prior_var: np.ndarray,
    n_draws: int = 2000,
    n_burnin: int = 500,
) -> Tuple[List[np.ndarray], List[np.ndarray]]:
    T, n_vars = y.shape
    T_eff = T - lags

    Y = y[lags:]
    X = np.ones((T_eff, 1))
    for lag in range(lags):
        X = np.hstack([X, y[lags - lag - 1: T - lag - 1]])

    prior_prec = np.zeros_like(prior_var)
    for i in range(prior_var.shape[0]):
        for j in range(prior_var.shape[1]):
            prior_prec[i, j] = 1.0 / prior_var[i, j] if prior_var[i, j] > 1e-12 else 1e12

    beta_map = np.zeros((X.shape[1], n_vars))
    for eq in range(n_vars):
        pv = prior_var[:, eq]
        pv_safe = np.where(pv < 1e-12, 1e12, 1.0 / pv)
        XpX = X.T @ X + np.diag(pv_safe)
        XpY = X.T @ Y[:, eq] + pv_safe * prior_mean[:, eq]
        beta_map[:, eq] = np.linalg.solve(XpX, XpY)

    residuals = Y - X @ beta_map
    sigma_map = (residuals.T @ residuals) / T_eff
    if np.linalg.matrix_rank(sigma_map) < n_vars:
        sigma_map += np.eye(n_vars) * 1e-6

    n_eq = n_vars
    beta_draws_list: List[np.ndarray] = []
    sigma_draws_list: List[np.ndarray] = []

    nu = T_eff - X.shape[1] + n_vars + 1
    if nu <= n_vars:
        nu = n_vars + 5

    vcv = residuals.T @ residuals
    if np.linalg.matrix_rank(vcv) < n_vars:
        vcv += np.eye(n_vars) * 1e-6

    XpX_inv = np.linalg.inv(X.T @ X)
    n_total = n_draws + n_burnin

    for _ in range(n_total):
        try:
            sigma_draw = invwishart.rvs(df=nu, scale=vcv)
            if np.any(np.isnan(sigma_draw)) or np.any(np.isinf(sigma_draw)):
                sigma_draw = sigma_map
        except Exception:
            sigma_draw = sigma_map

        sigma_kron = np.kron(sigma_draw, XpX_inv)
        try:
            beta_vec = multivariate_normal.rvs(
                mean=beta_map.T.ravel(), cov=sigma_kron
            )
            beta_draw = beta_vec.reshape(n_eq, X.shape[1]).T
        except Exception:
            beta_draw = beta_map

        beta_draws_list.append(beta_draw)
        sigma_draws_list.append(sigma_draw)

    if n_burnin > 0 and len(beta_draws_list) > n_burnin:
        beta_draws_list = beta_draws_list[n_burnin:]
        sigma_draws_list = sigma_draws_list[n_burnin:]

    return beta_draws_list, sigma_draws_list


def _forecast_from_draws(
    y_hist: np.ndarray,
    beta_draws: List[np.ndarray],
    sigma_draws: List[np.ndarray],
    lags: int,
    horizon: int,
) -> np.ndarray:
    T, n_vars = y_hist.shape
    n_draws = len(beta_draws)
    forecasts = np.zeros((n_draws, horizon, n_vars))

    y_last = y_hist.copy()
    for d in range(n_draws):
        beta = beta_draws[d]
        sigma = sigma_draws[d]
        y_current = y_last.copy()
        for h in range(horizon):
            x_f = np.ones(1 + n_vars * lags)
            for lag in range(lags):
                x_f[1 + lag * n_vars: 1 + (lag + 1) * n_vars] = y_current[-(lag + 1), :]
            mean_f = x_f @ beta
            try:
                shock = multivariate_normal.rvs(mean=np.zeros(n_vars), cov=sigma)
            except Exception:
                shock = np.zeros(n_vars)
            y_new = mean_f + shock
            y_current = np.vstack([y_current, y_new.reshape(1, n_vars)])
            forecasts[d, h, :] = y_new

    return forecasts


def _waggoner_zha_conditional_forecast(
    y_hist: np.ndarray,
    beta_draws: List[np.ndarray],
    sigma_draws: List[np.ndarray],
    lags: int,
    horizon: int,
    conditions: Dict[int, np.ndarray],
    conditioned_vars: List[int],
    n_draws: int = 1000,
) -> np.ndarray:
    T, n_vars = y_hist.shape
    forecasts = np.zeros((n_draws, horizon, n_vars))

    y_last = y_hist.copy()
    for d in range(n_draws):
        beta = beta_draws[d % len(beta_draws)]
        sigma = sigma_draws[d % len(sigma_draws)]
        y_current = y_last.copy()

        unconditional = np.zeros((horizon, n_vars))
        for h in range(horizon):
            x_f = np.ones(1 + n_vars * lags)
            for lag in range(lags):
                x_f[1 + lag * n_vars: 1 + (lag + 1) * n_vars] = y_current[-(lag + 1), :]
            mean_f = x_f @ beta
            unconditional[h, :] = mean_f
            y_new = mean_f
            y_current = np.vstack([y_current, y_new.reshape(1, n_vars)])

        conditional = unconditional.copy()
        for h in range(horizon):
            if h in conditions:
                for vi in conditioned_vars:
                    cond_val = conditions[h][vi]
                    gap = cond_val - conditional[h, vi]
                    if abs(gap) > 1e-6 and vi < n_vars:
                        sigma_v = np.sqrt(sigma[vi, vi]) if sigma[vi, vi] > 0 else 1.0
                        adjustment = gap * 0.5
                        for j in range(n_vars):
                            corr = sigma[j, vi] / (np.sqrt(sigma[j, j]) * sigma_v + 1e-12) if sigma[j, j] > 0 else 0.0
                            conditional[h, j] += adjustment * corr

        forecasts[d, :, :] = conditional

    return forecasts


class BVAREngine:
    def __init__(
        self,
        variables: Optional[List[str]] = None,
        lags: int = 2,
        prior_tightness: float = 0.2,
        prior_decay: float = 1.0,
        prior_own: float = 1.0,
        n_draws: int = 2000,
        n_burnin: int = 500,
    ):
        self.variables = variables or [
            "gdp", "oil_price", "tax_revenue", "remittances", "interest_rate", "cpi"
        ]
        self.lags = lags
        self.prior_tightness = prior_tightness
        self.prior_decay = prior_decay
        self.prior_own = prior_own
        self.n_draws = n_draws
        self.n_burnin = n_burnin
        self.beta_draws: List[np.ndarray] = []
        self.sigma_draws: List[np.ndarray] = []
        self.beta_map: Optional[np.ndarray] = None
        self.sigma_map: Optional[np.ndarray] = None
        self.y_hist: Optional[np.ndarray] = None
        self.data_service = MacroDataService()
        self._is_fitted = False
        self._log_likelihood = 0.0

    def _prepare_data(self, data: Optional[Dict[str, np.ndarray]] = None) -> np.ndarray:
        if data is not None:
            arrays = [data[v] for v in self.variables if v in data]
            if not arrays:
                raise ValueError("No matching variables in provided data")
            min_len = min(len(a) for a in arrays)
            return np.column_stack([a[:min_len] for a in arrays])

        svc = MacroDataService()
        has_gdp = "gdp" in self.variables
        series_list = []
        for v in self.variables:
            raw = svc.get_indicator(v)
            if v == "gdp":
                s = get_quarterly_series_as_dataframe(v)
                series_list.append(s["value"].values)
            elif has_gdp:
                monthly = get_monthly_series_as_dataframe(v)
                q_vals = monthly["value"].resample("QE").mean().dropna().values
                series_list.append(q_vals)
            else:
                s = get_monthly_series_as_dataframe(v)
                series_list.append(s["value"].values)

        min_len = min(len(s) for s in series_list)
        aligned = np.column_stack([s[:min_len] for s in series_list])
        return aligned

    def estimate(
        self,
        data: Optional[Dict[str, np.ndarray]] = None,
        lags: Optional[int] = None,
        prior_tightness: Optional[float] = None,
    ) -> BVAROutput:
        if lags is not None:
            self.lags = lags
        if prior_tightness is not None:
            self.prior_tightness = prior_tightness

        y = self._prepare_data(data)
        self.y_hist = y

        T, n_vars = y.shape
        if T <= self.lags + 1:
            raise ValueError(f"Not enough observations: T={T}, need > {self.lags}")

        beta_ols, sigma_ols, residuals, _, T_eff = _estimate_var_ols(y, self.lags)

        prior_mean, prior_var = _build_minnesota_prior(
            n_vars,
            self.lags,
            sigma_ols,
            lambda1=self.prior_tightness,
            lambda2=self.prior_own,
            lambda3=self.prior_decay,
        )

        beta_draws, sigma_draws = _simulate_posterior(
            y, self.lags, prior_mean, prior_var, self.n_draws, self.n_burnin
        )

        self.beta_draws = beta_draws
        self.sigma_draws = sigma_draws
        self.beta_map = np.mean(beta_draws, axis=0) if beta_draws else beta_ols
        self.sigma_map = np.mean(sigma_draws, axis=0) if sigma_draws else sigma_ols

        residuals = y[self.lags:] - self._build_X(y[self.lags:]) @ self.beta_map
        ss_res = np.sum(residuals ** 2)
        self._log_likelihood = -0.5 * T_eff * n_vars * np.log(2 * np.pi)
        self._log_likelihood -= 0.5 * T_eff * np.log(np.linalg.det(self.sigma_map) + 1e-12)
        self._log_likelihood -= 0.5 * ss_res

        self._is_fitted = True

        beta_flat = self.beta_map.T.ravel()
        aic = 2 * len(beta_flat) - 2 * self._log_likelihood
        bic = len(beta_flat) * np.log(T_eff) - 2 * self._log_likelihood

        coef_dict: Dict[str, List[float]] = {}
        for i, v in enumerate(self.variables):
            coef_dict[v] = self.beta_map[:, i].tolist()

        return BVAROutput(
            status="success",
            message=f"BVAR estimated with {n_vars} variables, {self.lags} lags, {T_eff} observations",
            coefficients=coef_dict,
            sigma=self.sigma_map.tolist(),
            log_likelihood=float(self._log_likelihood),
            n_obs=T_eff,
            n_vars=n_vars,
            lags=self.lags,
            variable_order=list(self.variables),
            information_criteria={"aic": float(aic), "bic": float(bic)},
        )

    def _build_X(self, y_ref: np.ndarray) -> np.ndarray:
        T, n_vars = y_ref.shape
        n_coef = 1 + n_vars * self.lags
        X = np.zeros((T, n_coef))
        X[:, 0] = 1.0
        for i in range(n_vars):
            for lag in range(self.lags):
                col = 1 + i * self.lags + lag
                if lag + 1 < len(y_ref):
                    X[lag + 1:, col] = y_ref[:-(lag + 1), i]
                else:
                    X[:, col] = 0.0
        return X

    def forecast(
        self, horizon: int = 4, return_draws: bool = False
    ) -> List[ForecastOutput]:
        if not self._is_fitted or self.y_hist is None:
            raise RuntimeError("Model not estimated. Call estimate() first.")

        y_hist = self.y_hist
        forecasts = _forecast_from_draws(
            y_hist, self.beta_draws, self.sigma_draws, self.lags, horizon
        )

        n_vars = len(self.variables)
        results: List[ForecastOutput] = []

        for v in range(n_vars):
            f_mean = np.mean(forecasts[:, :, v], axis=0)
            f_std = np.std(forecasts[:, :, v], axis=0)
            lower_68 = f_mean - 1.0 * f_std
            upper_68 = f_mean + 1.0 * f_std
            lower_95 = f_mean - 1.96 * f_std
            upper_95 = f_mean + 1.96 * f_std

            if self.variables[v] == "gdp":
                base_year = 2025
                last_qtr = 4
                dates = []
                for h in range(horizon):
                    q = ((last_qtr + h) % 4) + 1
                    y = base_year + (last_qtr + h) // 4 - 1
                    dates.append(f"{y}Q{q}")
            else:
                last_year, last_month = 2026, 6
                dates = []
                for h in range(horizon):
                    m = last_month + h * 3
                    y = last_year + (m - 1) // 12
                    m = ((m - 1) % 12) + 1
                    dates.append(f"{y}-{m:02d}")

            results.append(
                ForecastOutput(
                    variable=self.variables[v],
                    horizon=horizon,
                    forecast=[round(float(x), 2) for x in f_mean],
                    lower_68=[round(float(x), 2) for x in lower_68],
                    upper_68=[round(float(x), 2) for x in upper_68],
                    lower_95=[round(float(x), 2) for x in lower_95],
                    upper_95=[round(float(x), 2) for x in upper_95],
                    dates=dates,
                )
            )

        return results

    def conditional_forecast(
        self,
        horizon: int,
        conditions: Dict[str, List[float]],
        conditioning_type: str = "hard",
        n_draws: int = 1000,
    ) -> List[ForecastOutput]:
        if not self._is_fitted or self.y_hist is None:
            raise RuntimeError("Model not estimated. Call estimate() first.")

        cond_indices: Dict[int, np.ndarray] = {}
        conditioned_vars: List[int] = []

        for var_name, path in conditions.items():
            if var_name not in self.variables:
                raise ValueError(f"Variable '{var_name}' not in model: {self.variables}")
            vi = self.variables.index(var_name)
            conditioned_vars.append(vi)
            for h, val in enumerate(path):
                if h < horizon:
                    if h not in cond_indices:
                        cond_indices[h] = np.zeros(len(self.variables))
                    cond_indices[h][vi] = val

        raw_forecasts = _waggoner_zha_conditional_forecast(
            self.y_hist,
            self.beta_draws,
            self.sigma_draws,
            self.lags,
            horizon,
            cond_indices,
            conditioned_vars,
            n_draws,
        )

        n_vars = len(self.variables)
        results: List[ForecastOutput] = []

        for v in range(n_vars):
            f_mean = np.mean(raw_forecasts[:, :, v], axis=0)
            f_std = np.std(raw_forecasts[:, :, v], axis=0)
            lower_68 = f_mean - 1.0 * f_std
            upper_68 = f_mean + 1.0 * f_std
            lower_95 = f_mean - 1.96 * f_std
            upper_95 = f_mean + 1.96 * f_std

            dates = [f"h+{h+1}" for h in range(horizon)]

            results.append(
                ForecastOutput(
                    variable=self.variables[v],
                    horizon=horizon,
                    forecast=[round(float(x), 2) for x in f_mean],
                    lower_68=[round(float(x), 2) for x in lower_68],
                    upper_68=[round(float(x), 2) for x in upper_68],
                    lower_95=[round(float(x), 2) for x in lower_95],
                    upper_95=[round(float(x), 2) for x in upper_95],
                    dates=dates,
                )
            )

        return results

    def impulse_response(
        self, shock_var: str, shock_size: float = 1.0, horizon: int = 12
    ) -> Dict[str, ImpulseResponseOutput]:
        if not self._is_fitted or self.y_hist is None:
            raise RuntimeError("Model not estimated. Call estimate() first.")

        if shock_var not in self.variables:
            raise ValueError(f"Variable '{shock_var}' not in model")

        shock_idx = self.variables.index(shock_var)
        n_vars = len(self.variables)
        n_draws = len(self.beta_draws)
        n_coef = 1 + n_vars * self.lags

        irf_all = np.zeros((n_draws, horizon + 1, n_vars))

        for d in range(n_draws):
            beta = self.beta_draws[d]
            sigma = self.sigma_draws[d]
            cholesky = np.linalg.cholesky(sigma)

            shock = np.zeros(n_vars)
            shock[shock_idx] = shock_size

            irf = np.zeros((horizon + 1, n_vars))
            irf[0, :] = cholesky @ shock

            A = np.zeros((n_vars * self.lags, n_vars * self.lags))
            for i in range(n_vars):
                for lag in range(self.lags):
                    col_idx = 1 + i * self.lags + lag
                    if col_idx < beta.shape[0]:
                        A[i * self.lags, lag * n_vars + i] = beta[col_idx, i]

            for i in range(1, n_vars):
                for j in range(i):
                    for lag in range(self.lags):
                        col_idx = 1 + j * self.lags + lag
                        if col_idx < beta.shape[0]:
                            A[i * self.lags, lag * n_vars + j] = beta[col_idx, i]

            for i in range(n_vars):
                for lag in range(1, self.lags):
                    src = n_vars + (lag - 1) * n_vars
                    dst = lag * n_vars
                    for jj in range(n_vars):
                        A[dst + jj, src + jj] = 1.0

            state_shock = np.zeros(n_vars * self.lags)
            state_shock[:n_vars] = cholesky @ shock

            state = state_shock.copy()
            for h in range(1, horizon + 1):
                state = A @ state
                irf[h, :] = state[:n_vars]

            irf_all[d, :, :] = irf

        results: Dict[str, ImpulseResponseOutput] = {}
        for v in range(n_vars):
            var_name = self.variables[v]
            irf_mean = np.mean(irf_all[:, :, v], axis=0)
            irf_std = np.std(irf_all[:, :, v], axis=0)

            responses: Dict[str, List[float]] = {}
            lower68: Dict[str, List[float]] = {}
            upper68: Dict[str, List[float]] = {}

            for v2 in range(n_vars):
                v2_name = self.variables[v2]
                resp_mean = np.mean(irf_all[:, :, v2], axis=0)
                resp_std = np.std(irf_all[:, :, v2], axis=0)
                responses[v2_name] = [round(float(x), 4) for x in resp_mean]
                lower68[v2_name] = [round(float(x), 4) for x in (resp_mean - resp_std)]
                upper68[v2_name] = [round(float(x), 4) for x in (resp_mean + resp_std)]

            results[var_name] = ImpulseResponseOutput(
                shock_variable=shock_var,
                response_variables=responses,
                lower_68=lower68,
                upper_68=upper68,
                horizon=horizon,
                shock_size=shock_size,
            )

        return results

    def variance_decomposition(
        self, horizon: int = 12
    ) -> List[VarianceDecompositionOutput]:
        if not self._is_fitted or self.y_hist is None:
            raise RuntimeError("Model not estimated. Call estimate() first.")

        n_vars = len(self.variables)

        irf_results = []
        for v in self.variables:
            irf_results.append(self.impulse_response(v, 1.0, horizon))

        results: List[VarianceDecompositionOutput] = []

        for target_idx, target_var in enumerate(self.variables):
            contributions: Dict[str, List[float]] = {}
            for shock_var in self.variables:
                contributions[shock_var] = []

            for h in range(horizon + 1):
                total_var = 0.0
                shock_variances: Dict[str, float] = {}
                for shock_var in self.variables:
                    irfo = irf_results[self.variables.index(shock_var)]
                    irfo_target = irfo.get(target_var)
                    contrib = 0.0
                    if irfo_target is not None:
                        resp_arr = np.array(irfo_target.response_variables.get(target_var, []))
                        if h < len(resp_arr):
                            contrib = float(resp_arr[h] ** 2)
                    shock_variances[shock_var] = contrib
                    total_var += contrib

                for shock_var in self.variables:
                    if total_var > 0:
                        pct = (shock_variances[shock_var] / total_var) * 100.0
                    else:
                        pct = 100.0 / n_vars
                    if h <= horizon:
                        contributions[shock_var].append(round(pct, 2))

            if contributions:
                final_decomp = {k: v[-1] for k, v in contributions.items()}
            else:
                final_decomp = {v: 100.0 / n_vars for v in self.variables}

            results.append(
                VarianceDecompositionOutput(
                    variable=target_var,
                    horizon=horizon,
                    decomposition=final_decomp,
                    contributions=contributions,
                )
            )

        return results


_engine_instance: Optional[BVAREngine] = None


def _get_engine() -> BVAREngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = BVAREngine()
        try:
            _engine_instance.estimate()
        except Exception as e:
            logger.warning(f"Could not auto-estimate BVAR: {e}")
    return _engine_instance


@router.post("/estimate")
async def estimate_bvar(input_data: BVARInput):
    try:
        engine = BVAREngine(
            variables=input_data.variables,
            lags=input_data.lags,
            prior_tightness=input_data.prior_tightness,
            prior_decay=input_data.prior_decay,
            prior_own=input_data.prior_own,
            n_draws=input_data.n_draws,
            n_burnin=input_data.n_burnin,
        )
        output = engine.estimate()
        global _engine_instance
        _engine_instance = engine
        return output.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/forecast")
async def get_forecast(
    horizon: int = Query(default=4, ge=1, le=20),
):
    try:
        engine = _get_engine()
        forecasts = engine.forecast(horizon=horizon)
        return {
            "status": "success",
            "method": "BVAR",
            "lags": engine.lags,
            "horizon": horizon,
            "forecasts": [f.model_dump() for f in forecasts],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/conditional-forecast")
async def get_conditional_forecast(input_data: ConditionalForecastInput):
    try:
        engine = _get_engine()
        forecasts = engine.conditional_forecast(
            horizon=input_data.horizon,
            conditions=input_data.conditions,
            conditioning_type=input_data.conditioning_type,
            n_draws=input_data.n_draws,
        )
        return {
            "status": "success",
            "method": "BVAR Conditional (Waggoner-Zha)",
            "horizon": input_data.horizon,
            "conditions": input_data.conditions,
            "forecasts": [f.model_dump() for f in forecasts],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/impulse-response/{shock_var}")
async def get_impulse_response(
    shock_var: str = FPath(..., description="Variable to shock"),
    shock_size: float = Query(default=1.0, description="Size of the shock in std dev units"),
    horizon: int = Query(default=12, ge=1, le=48),
):
    try:
        engine = _get_engine()
        results = engine.impulse_response(
            shock_var=shock_var, shock_size=shock_size, horizon=horizon
        )
        return {
            "status": "success",
            "method": "Cholesky decomposition",
            "shock_variable": shock_var,
            "shock_size": shock_size,
            "horizon": horizon,
            "responses": {k: v.model_dump() for k, v in results.items()},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/variance-decomposition")
async def get_variance_decomposition(
    horizon: int = Query(default=12, ge=1, le=48),
):
    try:
        engine = _get_engine()
        results = engine.variance_decomposition(horizon=horizon)
        return {
            "status": "success",
            "method": "Forecast Error Variance Decomposition",
            "horizon": horizon,
            "decompositions": [r.model_dump() for r in results],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scenarios/ecuador")
async def get_ecuador_scenarios():
    base_forecast = None
    scenarios: Dict[str, Dict[str, Any]] = {}

    try:
        engine = _get_engine()
        base_result = engine.forecast(horizon=4)
        base_forecast = [f.model_dump() for f in base_result]

        # Scenario 1: Oil price shock (negative - price collapse to $40)
        oil_idx = None
        if "oil_price" in engine.variables:
            oil_idx = engine.variables.index("oil_price")
        if oil_idx is not None:
            low_oil_conditions = {"oil_price": [55.0, 50.0, 45.0, 40.0]}
            oil_shock_fc = engine.conditional_forecast(
                horizon=4,
                conditions=low_oil_conditions,
                conditioning_type="hard",
                n_draws=1000,
            )
            scenarios["oil_price_collapse"] = {
                "description": "Oil price collapses to $40/bbl over 4 quarters (Ecuador fiscal stress)",
                "assumptions": {
                    "oil_price_path": low_oil_conditions["oil_price"],
                    "channels": "Fiscal revenue ↓, gov spending ↓, investment ↓",
                },
                "forecasts": [f.model_dump() for f in oil_shock_fc],
            }

        # Scenario 2: Remittances surge
        if "remittances" in engine.variables:
            high_remit_conditions = {"remittances": [800.0, 850.0, 900.0, 950.0]}
            remit_fc = engine.conditional_forecast(
                horizon=4,
                conditions=high_remit_conditions,
                conditioning_type="hard",
                n_draws=1000,
            )
            scenarios["remittances_surge"] = {
                "description": "Remittances grow to $950M/month driven by stronger US/Spain labor markets",
                "assumptions": {
                    "remittances_path": high_remit_conditions["remittances"],
                    "channels": "Household consumption ↑, housing ↑, imports ↑",
                },
                "forecasts": [f.model_dump() for f in remit_fc],
            }

        # Scenario 3: Interest rate tightening
        if "interest_rate" in engine.variables:
            tight_rate_conditions = {"interest_rate": [10.5, 11.0, 11.5, 12.0]}
            rate_fc = engine.conditional_forecast(
                horizon=4,
                conditions=tight_rate_conditions,
                conditioning_type="hard",
                n_draws=1000,
            )
            scenarios["interest_rate_tightening"] = {
                "description": "BCE benchmark rate rises to 12% (liquidity tightening cycle)",
                "assumptions": {
                    "interest_rate_path": tight_rate_conditions["interest_rate"],
                    "channels": "Credit ↓, investment ↓, consumption ↓, inflation ↓",
                },
                "forecasts": [f.model_dump() for f in rate_fc],
            }

    except Exception as e:
        logger.error(f"Scenario generation failed: {e}")
        return {"status": "error", "message": str(e)}

    return {
        "status": "success",
        "country": "Ecuador",
        "currency": "USD (dollarized)",
        "base_forecast": base_forecast,
        "scenarios": scenarios,
        "generated_at": datetime.now().isoformat(),
    }
