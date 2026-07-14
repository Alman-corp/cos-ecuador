from __future__ import annotations
import numpy as np
from typing import Optional, Protocol
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.linear_model import Ridge
import logging

logger = logging.getLogger(__name__)


class ForecastingModel(Protocol):
    def fit(self, df, target: str, covariates: list[str]): ...
    def predict(self, horizon: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]: ...
    def name(self) -> str: ...


class EnsembleForecaster:
    def __init__(self, models: list[ForecastingModel], strategy: str = "stacking"):
        self.models = models
        self.strategy = strategy
        self.weights_: Optional[np.ndarray] = None
        self.meta_model_ = None
        self.cv_scores_: dict[str, dict] = {}

    def fit(self, df, target: str, covariates: Optional[list[str]] = None, n_splits: int = 5):
        covariates = covariates or []
        tscv = TimeSeriesSplit(n_splits=n_splits)
        scores = {m.name(): [] for m in self.models}
        preds_all = {m.name(): [] for m in self.models}

        for train_idx, val_idx in tscv.split(df):
            train_df, val_df = df.iloc[train_idx], df.iloc[val_idx]
            for model in self.models:
                try:
                    mc = self._clone(model)
                    mc.fit(train_df, target, covariates)
                    p, _, _ = mc.predict(len(val_idx))
                    actuals = val_df[target].values[:len(p)]
                    scores[model.name()].append(mean_absolute_error(actuals[:len(p)], p[:len(actuals)]))
                    preds_all[model.name()].append(p)
                except Exception as e:
                    scores[model.name()].append(np.inf)

        self.cv_scores_ = {n: {"mean_mae": float(np.mean([s for s in ss if s != np.inf]) or np.inf)}
                           for n, ss in scores.items()}

        if self.strategy == "simple_average":
            self.weights_ = np.ones(len(self.models)) / len(self.models)
        elif self.strategy == "inverse_variance":
            variances = [max(self.cv_scores_.get(m.name(), {}).get("mean_mae", np.inf), 1e-6) for m in self.models]
            inv = [1.0 / v for v in variances]
            total = sum(inv)
            self.weights_ = np.array([w / total for w in inv])
        elif self.strategy == "stacking":
            self._fit_stacking(df, target, covariates)
        else:
            self.weights_ = np.ones(len(self.models)) / len(self.models)

        for m in self.models:
            try:
                m.fit(df, target, covariates)
            except Exception as e:
                logger.error(f"Final fit failed for {m.name()}: {e}")
        return self

    def predict(self, horizon: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        forecasts, stds = [], []
        for model in self.models:
            try:
                p, l, u = model.predict(horizon)
                forecasts.append(p)
                stds.append((u - l) / (2 * 1.96))
            except Exception:
                continue
        if not forecasts:
            raise RuntimeError("All models failed")
        f_arr = np.array(forecasts)
        s_arr = np.array(stds)
        w = self.weights_[:len(f_arr)] if self.weights_ is not None else np.ones(len(f_arr)) / len(f_arr)
        w = w / w.sum()

        if self.strategy == "stacking" and self.meta_model_ is not None:
            ensemble = self.meta_model_.predict(f_arr.T)
        else:
            ensemble = np.average(f_arr, axis=0, weights=w)

        var_w = np.average(s_arr ** 2, axis=0, weights=w)
        var_b = np.average((f_arr - ensemble) ** 2, axis=0, weights=w)
        ensemble_std = np.sqrt(var_w + var_b)
        lower = ensemble - 1.645 * ensemble_std
        upper = ensemble + 1.645 * ensemble_std
        return ensemble, lower, upper

    def _fit_stacking(self, df, target: str, covariates: list[str]):
        tscv = TimeSeriesSplit(n_splits=3)
        X_stack, y_stack = [], []
        for train_idx, val_idx in tscv.split(df):
            train_df, val_df = df.iloc[train_idx], df.iloc[val_idx]
            fold_preds = []
            for model in self.models:
                try:
                    mc = self._clone(model)
                    mc.fit(train_df, target, covariates)
                    p, _, _ = mc.predict(len(val_idx))
                    fold_preds.append(p)
                except Exception:
                    fold_preds.append(np.zeros(len(val_idx)))
            if fold_preds:
                X_stack.append(np.array(fold_preds).T)
                y_stack.append(val_df[target].values[:len(val_idx)])
        if X_stack:
            X = np.vstack(X_stack)
            y = np.concatenate(y_stack)
            self.meta_model_ = Ridge(alpha=1.0, positive=True)
            self.meta_model_.fit(X, y)
            c = self.meta_model_.coef_
            self.weights_ = c / c.sum() if c.sum() > 0 else np.ones(len(self.models)) / len(self.models)

    def _clone(self, model):
        import copy
        return copy.deepcopy(model)

    def get_model_weights(self) -> dict[str, float]:
        if self.weights_ is None:
            return {}
        return {m.name(): float(self.weights_[i]) for i, m in enumerate(self.models) if i < len(self.weights_)}
