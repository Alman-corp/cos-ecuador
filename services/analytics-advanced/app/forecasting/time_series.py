from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional
from datetime import date
import logging

from app.shared import ForecastSpec, ForecastResult

logger = logging.getLogger(__name__)


class TimeSeriesEngine:
    def __init__(self):
        self.fitted_models = {}

    def forecast(self, df: pd.DataFrame, spec: ForecastSpec) -> list[ForecastResult]:
        results = []
        df_std = df.copy()
        date_col = "date" if "date" in df.columns else df.columns[0]
        df_std = df_std.rename(columns={date_col: "ds", spec.target_column: "y"})
        df_std["ds"] = pd.to_datetime(df_std["ds"])
        df_std = df_std.sort_values("ds").reset_index(drop=True).dropna(subset=["y"])

        for model_name in spec.models:
            try:
                if model_name == "prophet":
                    r = self._prophet(df_std, spec)
                elif model_name == "arima":
                    r = self._arima(df_std, spec)
                elif model_name == "ets":
                    r = self._ets(df_std, spec)
                elif model_name == "nbeats":
                    r = self._nbeats(df_std, spec)
                else:
                    continue
                if r:
                    results.append(r)
            except Exception as e:
                logger.error(f"Model {model_name} failed: {e}")
                continue
        if not results:
            raise RuntimeError("All forecasting models failed")
        return results

    def _prophet(self, df: pd.DataFrame, spec: ForecastSpec) -> Optional[ForecastResult]:
        try:
            from prophet import Prophet
        except ImportError:
            return None

        model = Prophet(seasonality_mode=spec.seasonality_mode, changepoint_prior_scale=0.05)
        for cov in spec.covariates:
            if cov in df.columns:
                model.add_regressor(cov)

        fit_cols = ["ds", "y"] + [c for c in spec.covariates if c in df.columns]
        model.fit(df[fit_cols])
        self.fitted_models["prophet"] = model

        future = model.make_future_dataframe(periods=spec.horizon, freq=self._freq(spec.frequency))
        for cov in spec.covariates:
            if cov in df.columns:
                future[cov] = df[cov].iloc[-1]
        forecast = model.predict(future)

        in_sample = forecast[forecast["ds"] <= df["ds"].max()]
        is_mape = self._mape(in_sample["yhat"].values, df["y"].values[:len(in_sample)])

        fc = forecast[forecast["ds"] > df["ds"].max()].head(spec.horizon)
        return ForecastResult(
            model="prophet", dates=fc["ds"].dt.date.tolist(),
            point_forecast=fc["yhat"].tolist(), lower_ci=fc["yhat_lower"].tolist(),
            upper_ci=fc["yhat_upper"].tolist(), in_sample_mape=is_mape,
            components={"trend": forecast["trend"].tolist(), "yearly": forecast.get("yearly", pd.Series()).tolist()},
        )

    def _arima(self, df: pd.DataFrame, spec: ForecastSpec) -> Optional[ForecastResult]:
        try:
            from pmdarima import auto_arima
        except ImportError:
            return None

        y = df["y"].values
        try:
            auto = auto_arima(y, seasonal=True, m=12 if spec.frequency == "monthly" else 4,
                              stepwise=True, suppress_warnings=True, error_action="ignore")
            fc, ci = auto.predict(n_periods=spec.horizon, return_conf_int=True)
            lower, upper = ci[:, 0].tolist(), ci[:, 1].tolist()
            fitted = auto.predict_in_sample()
            is_mape = self._mape(fitted, y)
        except Exception:
            from statsmodels.tsa.arima.model import ARIMA
            model = ARIMA(y, order=(1, 1, 1))
            fitted = model.fit()
            fc = fitted.forecast(steps=spec.horizon)
            std = fitted.resid.std()
            lower = (fc - 1.96 * std).tolist()
            upper = (fc + 1.96 * std).tolist()
            is_mape = self._mape(fitted.fittedvalues, y)

        last = pd.to_datetime(df["ds"].max())
        dates = pd.date_range(start=last + pd.Timedelta(days=1), periods=spec.horizon, freq=self._freq(spec.frequency))
        return ForecastResult(
            model="arima", dates=[d.date() for d in dates],
            point_forecast=[float(p) for p in fc], lower_ci=[float(l) for l in lower],
            upper_ci=[float(u) for u in upper], in_sample_mape=is_mape,
        )

    def _ets(self, df: pd.DataFrame, spec: ForecastSpec) -> Optional[ForecastResult]:
        try:
            from statsmodels.tsa.holtwinters import ExponentialSmoothing
        except ImportError:
            return None
        y = df["y"].values
        best_aic, best_model = np.inf, None
        for trend in ["add", "mul", None]:
            for seasonal in ["add", "mul", None]:
                try:
                    m = ExponentialSmoothing(y, trend=trend, seasonal=seasonal,
                                            seasonal_periods=12 if spec.frequency == "monthly" else 4).fit(optimized=True)
                    if m.aic < best_aic:
                        best_aic, best_model = m.aic, m
                except Exception:
                    continue
        if best_model is None:
            return None
        fc = best_model.forecast(spec.horizon)
        std = np.std(best_model.resid)
        lower, upper = (fc - 1.96 * std).tolist(), (fc + 1.96 * std).tolist()
        last = pd.to_datetime(df["ds"].max())
        dates = pd.date_range(start=last + pd.Timedelta(days=1), periods=spec.horizon, freq=self._freq(spec.frequency))
        return ForecastResult(
            model="ets", dates=[d.date() for d in dates], point_forecast=fc.tolist(),
            lower_ci=lower, upper_ci=upper, in_sample_mape=self._mape(best_model.fittedvalues, y),
        )

    def _nbeats(self, df: pd.DataFrame, spec: ForecastSpec) -> Optional[ForecastResult]:
        try:
            from darts import TimeSeries
            from darts.models import NBEATSModel
        except ImportError:
            return None

        series = TimeSeries.from_dataframe(df, "ds", "y")
        model = NBEATSModel(input_chunk_length=max(12, spec.horizon * 2), output_chunk_length=spec.horizon,
                            num_stacks=3, num_blocks=3, num_layers=4, layer_widths=256,
                            n_epochs=100, random_state=42)
        model.fit(series)
        fc = model.predict(n=spec.horizon)
        vals = fc.values().flatten()
        dates = fc.time_index.to_pandas().dt.date.tolist()

        boots = []
        for _ in range(30):
            try:
                m2 = NBEATSModel(input_chunk_length=max(12, spec.horizon * 2), output_chunk_length=spec.horizon,
                                 num_stacks=2, num_blocks=2, num_layers=2, layer_widths=128,
                                 n_epochs=50, random_state=np.random.randint(10000))
                idx = np.sort(np.random.choice(len(df), size=int(len(df) * 0.8), replace=True))
                df_boot = df.iloc[idx]
                s2 = TimeSeries.from_dataframe(df_boot, "ds", "y")
                m2.fit(s2)
                boots.append(m2.predict(n=spec.horizon).values().flatten())
            except Exception:
                continue
        if boots:
            b_arr = np.array(boots)
            lower, upper = np.percentile(b_arr, 5, axis=0).tolist(), np.percentile(b_arr, 95, axis=0).tolist()
        else:
            std = np.std(vals)
            lower, upper = (vals - 1.645 * std).tolist(), (vals + 1.645 * std).tolist()

        return ForecastResult(model="nbeats", dates=dates, point_forecast=vals.tolist(),
                              lower_ci=lower, upper_ci=upper, in_sample_mape=0.0)

    def _freq(self, frequency: str) -> str:
        return {"daily": "D", "weekly": "W", "monthly": "MS", "quarterly": "QS", "yearly": "YS"}.get(frequency, "MS")

    def _mape(self, predicted: np.ndarray, actual: np.ndarray) -> float:
        mask = actual != 0
        if not mask.any():
            return float("inf")
        return float(np.mean(np.abs((predicted[mask] - actual[mask]) / actual[mask])) * 100)
