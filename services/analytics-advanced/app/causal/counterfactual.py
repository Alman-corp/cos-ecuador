from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional
from sklearn.neighbors import NearestNeighbors
from sklearn.ensemble import GradientBoostingRegressor
import logging

from app.shared import CounterfactualQuery, CounterfactualResult

logger = logging.getLogger(__name__)


class CounterfactualEngine:
    def analyze(self, historical_data: pd.DataFrame, query: CounterfactualQuery) -> CounterfactualResult:
        matching = self._matching_counterfactual(historical_data, query)
        ml_cf = self._ml_counterfactual(historical_data, query)

        results = [r for r in [matching, ml_cf] if r is not None]
        if not results:
            raise RuntimeError("All counterfactual methods failed")

        weights = np.array([r["confidence"] for r in results])
        weights = weights / weights.sum()

        factual = float(sum(r["factual"] * w for r, w in zip(results, weights)))
        counterfactual = float(sum(r["counterfactual"] * w for r, w in zip(results, weights)))
        confidence = float(sum(r["confidence"] ** 2 * w for r, w in zip(results, weights)))

        delta = counterfactual - factual
        delta_pct = (delta / abs(factual)) * 100 if factual != 0 else 0

        cf_values = [r["counterfactual"] for r in results]
        cf_std = np.std(cf_values)
        prob_improvement = float(1 - 0.5 * np.exp(-abs(delta) / (cf_std + 1e-6))) if delta > 0 else float(0.5 * np.exp(-abs(delta) / (cf_std + 1e-6)))

        path = []
        for var, new_val in query.intervention.items():
            old_val = query.factual_observation.get(var)
            if old_val is not None:
                pct = ((new_val - old_val) / abs(old_val) * 100) if old_val != 0 else 0
                direction = "aumento" if new_val > old_val else "disminuyo"
                path.append(f"{var} {direction} de {old_val:.2f} a {new_val:.2f} ({pct:+.1f}%)")
        path.append(f"-> {query.target_outcome} cambio en {delta:+.2f} ({delta_pct:+.1f}%)")

        caveats = ["El analisis contrafactual asume relacion causal estable", f"Basado en {len(results)} metodos"]
        if confidence < 0.7:
            caveats.append("Confianza moderada - validar con analisis adicional")

        return CounterfactualResult(
            factual_value=factual, counterfactual_value=counterfactual,
            delta=delta, delta_pct=delta_pct, confidence=confidence,
            probability_of_improvement=prob_improvement,
            path_explanation=path, caveats=caveats,
        )

    def _matching_counterfactual(self, df: pd.DataFrame, query: CounterfactualQuery) -> Optional[dict]:
        intervention_vars = list(query.intervention.keys())
        numeric_cols = [c for c in df.columns if c not in intervention_vars + [query.target_outcome] and df[c].dtype in ["float64", "int64"]]
        if not numeric_cols:
            return None

        df_num = df[numeric_cols + intervention_vars].dropna()
        if len(df_num) < 10:
            return None

        X = df_num[numeric_cols].values
        X_mean, X_std = X.mean(axis=0), X.std(axis=0) + 1e-6
        X_norm = (X - X_mean) / X_std

        nn = NearestNeighbors(n_neighbors=min(20, len(df_num)), metric="euclidean")
        nn.fit(X_norm)

        factual_features = np.array([query.factual_observation.get(c, df_num[c].mean()) for c in numeric_cols]).reshape(1, -1)
        factual_norm = (factual_features - X_mean) / X_std
        distances, indices = nn.kneighbors(factual_norm)
        neighbors = df_num.iloc[indices[0]]

        matching = []
        for _, row in neighbors.iterrows():
            score = sum(1 for v in intervention_vars if v in row and abs(row[v] - query.intervention[v]) < df_num[v].std() * 0.5)
            if score >= len(intervention_vars) * 0.5:
                matching.append(row)

        if not matching:
            matching = neighbors.to_dict("records")
        target_vals = [r[query.target_outcome] for r in matching if query.target_outcome in r]
        if not target_vals:
            return None

        cf_value = float(np.mean(target_vals))
        factual_value = query.factual_observation.get(query.target_outcome, float(df[query.target_outcome].iloc[-1]))

        return {"method": "matching", "factual": factual_value, "counterfactual": cf_value, "confidence": min(0.95, len(matching) / 50)}

    def _ml_counterfactual(self, df: pd.DataFrame, query: CounterfactualQuery) -> Optional[dict]:
        target = query.target_outcome
        intervention_vars = list(query.intervention.keys())
        feature_cols = [c for c in df.columns if c != target and df[c].dtype in ["float64", "int64"]]
        if not feature_cols:
            return None

        df_clean = df[feature_cols + [target]].dropna()
        if len(df_clean) < 20:
            return None

        X, y = df_clean[feature_cols].values, df_clean[target].values
        model = GradientBoostingRegressor(n_estimators=200, max_depth=4)
        model.fit(X, y)
        r2 = float(model.score(X, y))

        factual_features = np.array([query.factual_observation.get(c, df_clean[c].mean()) for c in feature_cols]).reshape(1, -1)
        factual_pred = float(model.predict(factual_features)[0])

        cf_features = factual_features.copy()
        for i, col in enumerate(feature_cols):
            if col in query.intervention:
                cf_features[0, i] = query.intervention[col]
        cf_pred = float(model.predict(cf_features)[0])

        return {"method": "ml_gradient_boosting", "factual": factual_pred, "counterfactual": cf_pred, "confidence": min(0.95, r2)}
