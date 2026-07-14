from __future__ import annotations
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field
from datetime import date, datetime


class TimeSeriesPoint(BaseModel):
    date: date
    value: float
    metadata: dict[str, Any] = Field(default_factory=dict)


class FinancialDataFrame(BaseModel):
    entity_id: str
    columns: list[str]
    rows: list[dict[str, float | str | None]]
    frequency: Literal["daily", "weekly", "monthly", "quarterly", "yearly"] = "monthly"
    start_date: date
    end_date: date


class CausalQuestion(BaseModel):
    treatment: str
    outcome: str
    confounders: list[str] = Field(default_factory=list)
    effect_mediators: list[str] = Field(default_factory=list)
    time_lag_days: int = 0
    question_text: Optional[str] = None


class CausalEffectResult(BaseModel):
    ate: float
    ate_ci_lower: float
    ate_ci_upper: float
    p_value: float
    method: str
    is_significant: bool
    interpretation: str
    confounder_adjustment: list[str]
    diagnostics: dict[str, Any]


class CounterfactualQuery(BaseModel):
    entity_id: str
    factual_observation: dict[str, float]
    intervention: dict[str, float]
    target_outcome: str
    horizon_periods: int = 12


class CounterfactualResult(BaseModel):
    factual_value: float
    counterfactual_value: float
    delta: float
    delta_pct: float
    confidence: float
    probability_of_improvement: float
    path_explanation: list[str]
    caveats: list[str]


class BayesianNetworkSpec(BaseModel):
    nodes: list[str]
    edges: list[tuple[str, str]]
    priors: dict[str, dict[str, Any]] = Field(default_factory=dict)
    observations: Optional[dict[str, float]] = None


class BayesianResult(BaseModel):
    posteriors: dict[str, dict[str, float]]
    conditional_probabilities: dict[str, float]
    samples: list[dict[str, float]]
    convergence_diagnostics: dict[str, Any]


class DistributionSpec(BaseModel):
    type: Literal[
        "normal", "lognormal", "triangular", "uniform",
        "beta", "gamma", "pareto", "empirical", "student_t",
    ]
    params: dict[str, float]
    historical_data: Optional[list[float]] = None


class MonteCarloSpec(BaseModel):
    variables: dict[str, DistributionSpec]
    formula: str
    n_simulations: int = 50_000
    seed: Optional[int] = None
    correlations: Optional[list[tuple[str, str, float]]] = None


class MonteCarloResult(BaseModel):
    mean: float
    median: float
    std: float
    percentiles: dict[str, float]
    var_95: float
    cvar_95: float
    probability_positive: float
    probability_above_threshold: Optional[float] = None
    histogram: dict[str, list[float]]
    sensitivity: dict[str, float]
    samples: list[float]


class ForecastSpec(BaseModel):
    entity_id: str
    target_column: str
    covariates: list[str] = Field(default_factory=list)
    horizon: int = 12
    frequency: Literal["daily", "weekly", "monthly", "quarterly"] = "monthly"
    seasonality_mode: Literal["additive", "multiplicative"] = "multiplicative"
    models: list[Literal["prophet", "neuralprophet", "nbeats", "arima", "ets"]] = Field(default=["prophet", "arima"])


class ForecastResult(BaseModel):
    model: str
    dates: list[date]
    point_forecast: list[float]
    lower_ci: list[float]
    upper_ci: list[float]
    in_sample_mape: float
    out_sample_mape: Optional[float] = None
    components: Optional[dict[str, list[float]]] = None
    backtest_scores: Optional[dict[str, float]] = None


class AnomalySpec(BaseModel):
    entity_id: str
    columns: list[str]
    contamination: float = 0.05
    methods: list[Literal["isolation_forest", "lstm", "zscore", "dbscan"]] = Field(default=["isolation_forest", "lstm"])


class AnomalyRecord(BaseModel):
    date: date
    column: str
    observed: float
    expected: float
    z_score: float
    anomaly_score: float
    methods_detecting: list[str]
    probable_cause: Optional[str] = None
    severity: Literal["low", "medium", "high", "critical"]


class AnomalyResult(BaseModel):
    anomalies: list[AnomalyRecord]
    normal_baseline: dict[str, dict[str, float]]
    method_agreement: dict[str, int]
    consensus_anomalies: list[AnomalyRecord]


class ScenarioPreset(BaseModel):
    id: str
    name: str
    description: str
    industry: Optional[str] = None
    category: Literal["recession", "growth", "crisis", "m_and_a", "expansion", "custom"]
    shocks: dict[str, float]
    duration_months: int
    probability: float
    validated_by: list[str]
    historical_precedents: list[str]
    expected_outcomes: dict[str, dict[str, float]]


class CausalGraph(BaseModel):
    nodes: list[str]
    edges: list[dict[str, Any]]
    independent_sets: list[list[str]]
    interpretation: str


class AnalyticsRequest(BaseModel):
    query_type: Literal[
        "causal_effect", "counterfactual", "bayesian_query",
        "monte_carlo", "forecast", "ensemble_forecast",
        "anomaly_detection", "causal_discovery", "scenario_simulation",
    ]
    payload: dict[str, Any]
    entity_id: Optional[str] = None
    company_id: Optional[str] = None


class BacktestRecord(BaseModel):
    prediction_id: str
    entity_id: str
    made_at: datetime
    predicted_for: date
    variable: str
    predicted_value: float
    predicted_ci_lower: float
    predicted_ci_upper: float
    actual_value: Optional[float] = None
    error: Optional[float] = None
    within_ci: Optional[bool] = None
    score: Optional[float] = None
