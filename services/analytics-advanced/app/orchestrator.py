from __future__ import annotations
import pandas as pd
import logging
from typing import Any

from app.shared import (
    AnalyticsRequest, CausalQuestion, CausalEffectResult,
    CounterfactualQuery, CounterfactualResult, BayesianNetworkSpec,
    BayesianResult, MonteCarloSpec, MonteCarloResult, ForecastSpec,
    ForecastResult, AnomalySpec, AnomalyResult, CausalGraph, ScenarioPreset,
)
from app.causal import CausalInferenceEngine, CounterfactualEngine, CausalDiscoveryEngine
from app.probabilistic import BayesianNetworkEngine, AdvancedMonteCarlo
from app.forecasting import TimeSeriesEngine, BacktestingEngine, AnomalyDetectionEngine
from app.scenarios import ScenarioLibrary

logger = logging.getLogger(__name__)


class AnalyticsOrchestrator:
    def __init__(self):
        self.causal = CausalInferenceEngine()
        self.counterfactual = CounterfactualEngine()
        self.discovery = CausalDiscoveryEngine()
        self.bayesian = BayesianNetworkEngine()
        self.monte_carlo = AdvancedMonteCarlo()
        self.forecasting = TimeSeriesEngine()
        self.backtesting = BacktestingEngine()
        self.anomaly = AnomalyDetectionEngine()
        self.scenarios = ScenarioLibrary()

    def dispatch(self, request: AnalyticsRequest, df: pd.DataFrame) -> dict[str, Any]:
        query_type = request.query_type
        payload = request.payload

        if query_type == "causal_effect":
            question = CausalQuestion(**payload.get("question", {}))
            method = payload.get("method", "doubly_robust")
            result = self.causal.estimate_effect(df, question, method)
            return {"result": result.model_dump(), "type": "causal_effect"}

        elif query_type == "counterfactual":
            query = CounterfactualQuery(**payload.get("query", {}))
            historical = payload.get("historical_data")
            if historical:
                df_hist = pd.DataFrame(historical)
            else:
                df_hist = df
            result = self.counterfactual.analyze(df_hist, query)
            return {"result": result.model_dump(), "type": "counterfactual"}

        elif query_type == "causal_discovery":
            columns = payload.get("columns")
            algorithm = payload.get("algorithm", "pc")
            alpha = payload.get("alpha", 0.05)
            result = self.discovery.discover(df, columns=columns, algorithm=algorithm, alpha=alpha)
            return {"result": result.model_dump(), "type": "causal_discovery"}

        elif query_type == "bayesian_query":
            spec = BayesianNetworkSpec(**payload.get("spec", {}))
            result = self.bayesian.infer_distributions(df, spec.nodes)
            conditional = {}
            if payload.get("conditional"):
                cond = payload["conditional"]
                conditional = self.bayesian.query_conditional(df, cond["target"], cond.get("evidence", {}))
            return {"result": result.model_dump(), "conditional": conditional, "type": "bayesian_query"}

        elif query_type == "monte_carlo":
            spec = MonteCarloSpec(**payload.get("spec", {}))
            result = self.monte_carlo.run(spec)
            return {"result": result.model_dump(), "type": "monte_carlo"}

        elif query_type == "forecast":
            spec = ForecastSpec(**payload.get("spec", {}))
            results = self.forecasting.forecast(df, spec)
            return {"results": [r.model_dump() for r in results], "type": "forecast"}

        elif query_type == "anomaly_detection":
            spec = AnomalySpec(**payload.get("spec", {}))
            result = self.anomaly.detect(df, spec)
            return {"result": result.model_dump(), "type": "anomaly_detection"}

        elif query_type == "scenario_simulation":
            scenario_id = payload.get("scenario_id", "")
            base_financials = payload.get("base_financials", {})
            n_simulations = payload.get("n_simulations", 50000)
            result = self.scenarios.simulate(scenario_id, base_financials, n_simulations)
            return {"result": result, "type": "scenario_simulation"}

        else:
            raise ValueError(f"Unknown query type: {query_type}")

    def list_scenarios(self, category: str | None = None) -> list[dict]:
        presets = self.scenarios.list_presets(category=category)
        return [p.model_dump() for p in presets]

    def register_backtest_prediction(self, **kwargs) -> dict:
        self.backtesting.register_prediction(**kwargs)
        return {"status": "ok"}

    def register_backtest_actual(self, entity_id: str, variable: str, actual_date, actual_value: float) -> list[dict]:
        updated = self.backtesting.register_actual(entity_id, variable, actual_date, actual_value)
        return [r.model_dump() for r in updated]

    def evaluate_model(self, **kwargs) -> dict:
        return self.backtesting.evaluate_model(**kwargs)
