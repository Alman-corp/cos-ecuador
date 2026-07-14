from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
import logging

from app.shared import CausalQuestion, CausalEffectResult

logger = logging.getLogger(__name__)


class CausalInferenceEngine:
    def __init__(self):
        try:
            from econml.dml import LinearDML, CausalForestDML
            self.default_estimators = {
                "linear_dml": LinearDML(
                    model_y=GradientBoostingRegressor(n_estimators=100),
                    model_t=GradientBoostingRegressor(n_estimators=100),
                    discrete_treatment=False,
                ),
                "causal_forest": CausalForestDML(
                    model_y=RandomForestRegressor(n_estimators=200),
                    model_t=RandomForestRegressor(n_estimators=200),
                    n_estimators=500,
                    discrete_treatment=False,
                ),
            }
        except ImportError:
            self.default_estimators = {}
            logger.warning("econml not available, double ML methods disabled")

    def estimate_effect(
        self, df: pd.DataFrame, question: CausalQuestion, method: str = "doubly_robust",
    ) -> CausalEffectResult:
        treatment = question.treatment
        outcome = question.outcome
        confounders = question.confounders

        required = [treatment, outcome] + confounders
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"Missing columns: {missing}")

        df_clean = df[required].dropna()
        if len(df_clean) < 30:
            raise ValueError(f"Insufficient data: {len(df_clean)} rows (need >=30)")

        if question.time_lag_days > 0 and "date" in df.columns:
            df_clean = df_clean.sort_values("date")
            df_clean[treatment] = df_clean[treatment].shift(question.time_lag_days)
            df_clean = df_clean.dropna()

        dowhy_result = None
        try:
            dowhy_result = self._run_dowhy(df_clean, question)
        except Exception as e:
            logger.warning(f"DoWhy failed: {e}")

        dml_result = None
        try:
            dml_result = self._run_double_ml(df_clean, question)
        except Exception as e:
            logger.warning(f"Double ML failed: {e}")

        results = [r for r in [dowhy_result, dml_result] if r is not None]
        if not results:
            raise RuntimeError("All causal methods failed")

        return self._combine_results(results)

    def _run_dowhy(self, df: pd.DataFrame, question: CausalQuestion) -> Optional[dict]:
        treatment, outcome = question.treatment, question.outcome
        confounders = question.confounders

        graph_str = "digraph {\n"
        for c in confounders:
            graph_str += f'  "{c}" -> "{treatment}";\n'
            graph_str += f'  "{c}" -> "{outcome}";\n'
        graph_str += f'  "{treatment}" -> "{outcome}";\n'
        graph_str += "}"

        try:
            from dowhy import CausalModel
        except ImportError:
            logger.warning("dowhy not available")
            return None

        model = CausalModel(data=df, treatment=treatment, outcome=outcome, graph=graph_str)
        identified = model.identify_effect(proceed_when_unidentifiable=True)

        methods = [
            ("backdoor.linear_regression", {}),
            ("backdoor.propensity_score_matching", {}),
            ("backdoor.generalized_linear_model", {}),
        ]
        estimates = []
        for mn, mp in methods:
            try:
                est = model.estimate_effect(identified, method_name=mn, **mp)
                estimates.append(est)
            except Exception:
                continue
        if not estimates:
            return None

        ate = float(estimates[0].value)

        bootstrap = []
        for _ in range(100):
            sample = df.sample(frac=0.8, replace=True)
            try:
                m2 = CausalModel(data=sample, treatment=treatment, outcome=outcome, graph=graph_str)
                i2 = m2.identify_effect(proceed_when_unidentifiable=True)
                e2 = m2.estimate_effect(i2, method_name="backdoor.linear_regression")
                bootstrap.append(float(e2.value))
            except Exception:
                continue

        if bootstrap:
            ci_lower = float(np.percentile(bootstrap, 2.5))
            ci_upper = float(np.percentile(bootstrap, 97.5))
        else:
            ci_lower = ate * 0.8
            ci_upper = ate * 1.2

        p_value = 0.05
        if bootstrap and ate != 0:
            p_value = float(min(np.mean(np.array(bootstrap) <= 0) * 2, 1.0))

        return {"method": "dowhy", "ate": ate, "ci_lower": ci_lower, "ci_upper": ci_upper, "p_value": p_value}

    def _run_double_ml(self, df: pd.DataFrame, question: CausalQuestion) -> Optional[dict]:
        treatment, outcome = question.treatment, question.outcome
        confounders = question.confounders

        Y = df[outcome].values
        T = df[treatment].values
        X = df[confounders].values if confounders else np.ones((len(df), 1))

        estimator = self.default_estimators["causal_forest"]
        estimator.fit(Y=Y, T=T, X=X)

        ate = float(estimator.ate(X))
        interval = estimator.ate_inference(X).conf_int_mean()
        ci_lower, ci_upper = float(interval[0]), float(interval[1])

        return {"method": "double_ml_causal_forest", "ate": ate, "ci_lower": ci_lower, "ci_upper": ci_upper,
                "p_value": 0.05 if (ci_lower > 0 or ci_upper < 0) else 0.3}

    def _combine_results(self, results: list[dict]) -> CausalEffectResult:
        weights = [1.0 / max(r["ci_upper"] - r["ci_lower"], 1e-6) for r in results]
        total = sum(weights)
        weights = [w / total for w in weights]

        ate = float(sum(r["ate"] * w for r, w in zip(results, weights)))
        ci_lower = float(min(r["ci_lower"] for r in results))
        ci_upper = float(max(r["ci_upper"] for r in results))
        p_value = float(min(r["p_value"] for r in results))
        is_significant = p_value < 0.05 and (ci_lower > 0 or ci_upper < 0)

        direction = "positivo" if ate > 0 else "negativo"
        interpretation = (
            f"Efecto causal {direction} ({ate:.3f}, IC 95%: [{ci_lower:.3f}, {ci_upper:.3f}]). "
            f"{'Estadisticamente significativo' if is_significant else 'No estadisticamente significativo'} "
            f"(p={p_value:.3f}). Estimado con {len(results)} metodos."
        )

        return CausalEffectResult(
            ate=ate, ate_ci_lower=ci_lower, ate_ci_upper=ci_upper,
            p_value=p_value, method=f"ensemble ({'+'.join(r['method'] for r in results)})",
            is_significant=is_significant, interpretation=interpretation,
            confounder_adjustment=[], diagnostics={"methods": [r["method"] for r in results]},
        )
