from __future__ import annotations
import math
import numpy as np
import pandas as pd
from datetime import datetime, date, timezone
from typing import Optional
from collections import defaultdict
import logging

from app.shared import BacktestRecord, ForecastSpec, ForecastResult

logger = logging.getLogger(__name__)


class BacktestingEngine:
    def __init__(self):
        self.storage = InMemoryStorage()

    def register_prediction(self, prediction_id: str, entity_id: str, variable: str,
                            predicted_for: date, predicted_value: float, ci_lower: float,
                            ci_upper: float, model_name: str, metadata: Optional[dict] = None):
        record = BacktestRecord(
            prediction_id=prediction_id, entity_id=entity_id, made_at=datetime.now(timezone.utc),
            predicted_for=predicted_for, variable=variable, predicted_value=predicted_value,
            predicted_ci_lower=ci_lower, predicted_ci_upper=ci_upper,
            actual_value=None, error=None, within_ci=None, score=None,
        )
        self.storage.save(record, model_name=model_name, metadata=metadata or {})

    def register_actual(self, entity_id: str, variable: str, actual_date: date, actual_value: float) -> list[BacktestRecord]:
        pending = self.storage.get_pending(entity_id, variable, actual_date)
        updated = []
        for record in pending:
            error = actual_value - record.predicted_value
            within_ci = record.predicted_ci_lower <= actual_value <= record.predicted_ci_upper
            crps = self._compute_crps(actual_value, record.predicted_value, record.predicted_ci_lower, record.predicted_ci_upper)
            updated_rec = record.model_copy(update={
                "actual_value": actual_value, "error": error, "within_ci": within_ci, "score": crps,
            })
            self.storage.update(updated_rec)
            updated.append(updated_rec)
        return updated

    def evaluate_model(self, model_name: str, entity_id: Optional[str] = None,
                       variable: Optional[str] = None, since: Optional[datetime] = None) -> dict:
        records = self.storage.get_evaluated(model_name=model_name, entity_id=entity_id, variable=variable, since=since)
        if not records:
            return {"status": "no_data", "n_predictions": 0}
        errors = [r.error for r in records if r.error is not None]
        actuals = [r.actual_value for r in records if r.actual_value is not None]
        within_ci = [r.within_ci for r in records if r.within_ci is not None]
        scores = [r.score for r in records if r.score is not None]

        mae = float(np.mean(np.abs(errors))) if errors else 0
        mape = float(np.mean([abs(e / a) for e, a in zip(errors, actuals) if a != 0])) * 100 if actuals else 0
        rmse = float(np.sqrt(np.mean(np.array(errors) ** 2))) if errors else 0
        bias = float(np.mean(errors)) if errors else 0
        coverage = float(np.mean(within_ci)) if within_ci else 0
        mean_crps = float(np.mean(scores)) if scores else 0

        degradation = self._detect_degradation(records)
        recs = []
        if mape > 30:
            recs.append(f"MAPE alto ({mape:.1f}%). Reentrenar o cambiar modelo.")
        if coverage < 0.7:
            recs.append(f"Coverage bajo ({coverage:.1%}). Intervalos muy estrechos.")
        if degradation.get("should_retrain"):
            recs.append(f"Modelo degradandose ({degradation['degradation_pct']:.1f}%). Reentrenar.")
        if not recs:
            recs.append("Modelo saludable.")

        return {"model_name": model_name, "n_predictions": len(records), "n_evaluated": len(errors),
                "metrics": {"mae": mae, "mape_pct": mape, "rmse": rmse, "bias": bias, "coverage_90ci": coverage, "crps": mean_crps},
                "degradation": degradation, "recommendations": recs}

    def _compute_crps(self, actual: float, predicted: float, ci_lower: float, ci_upper: float) -> float:
        std = (ci_upper - ci_lower) / (2 * 1.645) or 1e-6
        z = (actual - predicted) / std
        pdf = np.exp(-0.5 * z ** 2) / np.sqrt(2 * np.pi)
        cdf = 0.5 * (1 + math.erf(z / math.sqrt(2)))
        return float(std * (z * (2 * cdf - 1) + 2 * pdf - 1 / np.sqrt(np.pi)))

    def _detect_degradation(self, records: list[BacktestRecord]) -> dict:
        if len(records) < 20:
            return {"status": "insufficient_data"}
        sorted_r = sorted(records, key=lambda r: r.made_at)
        mid = len(sorted_r) // 2
        e1 = [abs(r.error) for r in sorted_r[:mid] if r.error is not None]
        e2 = [abs(r.error) for r in sorted_r[mid:] if r.error is not None]
        if not e1 or not e2:
            return {"status": "insufficient_data"}
        mae1, mae2 = float(np.mean(e1)), float(np.mean(e2))
        deg_pct = (mae2 - mae1) / (mae1 + 1e-6) * 100
        return {"status": "degraded" if deg_pct > 20 else "stable",
                "mae_first_half": mae1, "mae_second_half": mae2,
                "degradation_pct": deg_pct, "should_retrain": deg_pct > 25}


class InMemoryStorage:
    def __init__(self):
        self.records: dict[str, dict] = {}

    def save(self, record: BacktestRecord, model_name: str, metadata: dict):
        self.records[record.prediction_id] = {"record": record, "model_name": model_name, "metadata": metadata}

    def update(self, record: BacktestRecord):
        if record.prediction_id in self.records:
            self.records[record.prediction_id]["record"] = record

    def get_pending(self, entity_id: str, variable: str, actual_date: date) -> list[BacktestRecord]:
        return [d["record"] for d in self.records.values()
                if d["record"].entity_id == entity_id and d["record"].variable == variable
                and d["record"].predicted_for == actual_date and d["record"].actual_value is None]

    def get_evaluated(self, model_name=None, entity_id=None, variable=None, since=None) -> list[BacktestRecord]:
        results = []
        for d in self.records.values():
            r = d["record"]
            if model_name and d["model_name"] != model_name: continue
            if entity_id and r.entity_id != entity_id: continue
            if variable and r.variable != variable: continue
            if since and r.made_at < since: continue
            if r.actual_value is not None:
                results.append(r)
        return results
