from __future__ import annotations
import pytest
import numpy as np
import pandas as pd

from app.probabilistic.monte_carlo_real import AdvancedMonteCarlo
from app.probabilistic.bayesian_network import BayesianNetworkEngine
from app.shared import MonteCarloSpec, DistributionSpec


def test_monte_carlo_normal():
    mc = AdvancedMonteCarlo()
    spec = MonteCarloSpec(
        variables={
            "revenue": DistributionSpec(type="normal", params={"mean": 100.0, "std": 10.0}),
            "margin": DistributionSpec(type="normal", params={"mean": 0.25, "std": 0.03}),
        },
        formula="revenue * margin",
        n_simulations=10000,
        seed=42,
    )
    result = mc.run(spec)
    assert np.isclose(result.mean, 25.0, atol=1.0)
    assert result.std > 0
    assert result.var_95 < result.mean
    assert result.cvar_95 <= result.var_95
    assert 0 <= result.probability_positive <= 1
    assert len(result.percentiles) >= 5
    assert "revenue" in result.sensitivity
    assert "margin" in result.sensitivity
    assert result.histogram["counts"]


def test_monte_carlo_lognormal():
    mc = AdvancedMonteCarlo()
    spec = MonteCarloSpec(
        variables={
            "price": DistributionSpec(type="lognormal", params={"mu": 3.0, "sigma": 0.2}),
        },
        formula="price",
        n_simulations=10000,
        seed=42,
    )
    result = mc.run(spec)
    assert result.mean > 0
    assert result.median > 0
    assert result.var_95 < result.median


def test_monte_carlo_correlation():
    mc = AdvancedMonteCarlo()
    spec = MonteCarloSpec(
        variables={
            "X": DistributionSpec(type="normal", params={"mean": 50.0, "std": 5.0}),
            "Y": DistributionSpec(type="normal", params={"mean": 30.0, "std": 3.0}),
        },
        formula="X + Y",
        n_simulations=10000,
        seed=42,
        correlations=[("X", "Y", 0.7)],
    )
    result = mc.run(spec)
    assert np.isclose(result.mean, 80.0, atol=0.5)
    assert result.std > 0


def test_monte_carlo_empirical_fit():
    mc = AdvancedMonteCarlo()
    historical = [10, 12, 11, 13, 9, 10, 15, 8, 11, 14, 12, 10]
    spec = MonteCarloSpec(
        variables={
            "cost": DistributionSpec(type="empirical", params={}, historical_data=historical),
        },
        formula="cost + 5",
        n_simulations=1000,
        seed=42,
    )
    result = mc.run(spec)
    assert result.mean > 10
    assert result.std > 0


def test_bayesian_inference():
    bayes = BayesianNetworkEngine(n_samples=200, n_chains=1)
    np.random.seed(42)
    df = pd.DataFrame({
        "revenue": np.random.normal(100, 15, 200),
        "cost": np.random.normal(70, 10, 200),
    })
    result = bayes.infer_distributions(df, columns=["revenue", "cost"])
    assert "revenue" in result.posteriors
    assert "cost" in result.posteriors
    assert np.isclose(result.posteriors["revenue"]["mean"], 100, atol=5)
    assert len(result.samples) > 0
