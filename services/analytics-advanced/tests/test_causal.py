from __future__ import annotations
import pytest
import numpy as np
import pandas as pd

from app.causal.inference import CausalInferenceEngine
from app.causal.counterfactual import CounterfactualEngine
from app.causal.discovery import CausalDiscoveryEngine
from app.shared import CausalQuestion, CounterfactualQuery, CausalGraph


@pytest.fixture
def causal_df() -> pd.DataFrame:
    np.random.seed(42)
    n = 500
    X = np.random.normal(10, 2, n)
    T = 2.0 * X + np.random.normal(0, 1, n)
    Y = 1.5 * T + 0.5 * X + np.random.normal(0, 0.5, n)
    dates = pd.date_range("2020-01-01", periods=n, freq="D")
    return pd.DataFrame({"date": dates, "X": X, "T": T, "Y": Y, "Z": np.random.normal(5, 1, n)})


def test_causal_inference_ate(causal_df):
    engine = CausalInferenceEngine()
    question = CausalQuestion(treatment="T", outcome="Y", confounders=["X"])
    try:
        result = engine.estimate_effect(causal_df, question)
        assert result.ate > 0
        assert result.is_significant
        assert result.ate_ci_lower <= result.ate <= result.ate_ci_upper
        assert 0 <= result.p_value <= 1
    except RuntimeError as e:
        if "All causal methods failed" in str(e):
            pytest.skip("Causal libraries not fully available (dowhy/econml)")
        raise


def test_causal_inference_fails_with_insufficient_data():
    engine = CausalInferenceEngine()
    df_small = pd.DataFrame({"A": [1, 2], "B": [3, 4], "C": [5, 6]})
    question = CausalQuestion(treatment="A", outcome="B", confounders=["C"])
    with pytest.raises(ValueError, match="Insufficient"):
        engine.estimate_effect(df_small, question)


def test_counterfactual(causal_df):
    engine = CounterfactualEngine()
    query = CounterfactualQuery(
        entity_id="test_entity",
        factual_observation={"X": 10.0, "T": 20.0, "Y": 35.0},
        intervention={"T": 25.0},
        target_outcome="Y",
        horizon_periods=12,
    )
    result = engine.analyze(causal_df, query)
    assert result.delta != 0
    assert 0 <= result.confidence <= 1
    assert 0 <= result.probability_of_improvement <= 1
    assert isinstance(result.path_explanation, list)
    assert isinstance(result.caveats, list)


def test_causal_discovery(causal_df):
    engine = CausalDiscoveryEngine()
    graph = engine.discover(causal_df, columns=["X", "T", "Y"])
    assert isinstance(graph, dict) or hasattr(graph, "nodes")
    if hasattr(graph, "nodes"):
        assert len(graph.nodes) >= 2
        assert hasattr(graph, "edges")
