from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional
import logging

from app.shared import BayesianResult

logger = logging.getLogger(__name__)


class BayesianNetworkEngine:
    def __init__(self, n_samples: int = 2000, n_chains: int = 2, random_seed: int = 42):
        self.n_samples = n_samples
        self.n_chains = n_chains
        self.random_seed = random_seed

    def infer_distributions(self, df: pd.DataFrame, columns: list[str], prior_spec: Optional[dict] = None) -> BayesianResult:
        posteriors = {}
        samples_dict = {}

        try:
            import pymc as pm
            import arviz as az

            with pm.Model() as model:
                for col in columns:
                    if col not in df.columns:
                        continue
                    data = df[col].dropna().values
                    if len(data) < 5:
                        continue

                    data_mean, data_std = float(np.mean(data)), float(np.std(data)) + 1e-6
                    data_min = float(np.min(data))

                    if data_min > 0 and np.any(data > data_mean * 3):
                        mu = pm.Normal(f"{col}_mu", mu=np.log(data_mean), sigma=1)
                        sigma = pm.HalfNormal(f"{col}_sigma", sigma=1)
                        pm.LogNormal(col, mu=mu, sigma=sigma, observed=data)
                    elif data_min > 0:
                        alpha = pm.HalfNormal(f"{col}_alpha", sigma=10)
                        beta_p = pm.HalfNormal(f"{col}_beta", sigma=10)
                        pm.Gamma(col, alpha=alpha, beta=beta_p, observed=data)
                    else:
                        mu = pm.Normal(f"{col}_mu", mu=data_mean, sigma=data_std * 2)
                        sigma = pm.HalfNormal(f"{col}_sigma", sigma=data_std)
                        nu = pm.Gamma(f"{col}_nu", alpha=2, beta=0.1)
                        pm.StudentT(col, mu=mu, sigma=sigma, nu=nu, observed=data)

                trace = pm.sample(draws=self.n_samples, chains=self.n_chains,
                                  random_seed=self.random_seed, progressbar=False,
                                  return_inferencedata=True, cores=1)

            if trace is not None and hasattr(trace, "posterior") and len(trace.posterior.data_vars) > 0:
                for col in columns:
                    if col not in df.columns:
                        continue
                    try:
                        mu_s = trace.posterior[f"{col}_mu"].values.flatten()
                        sigma_s = trace.posterior[f"{col}_sigma"].values.flatten()
                        posteriors[col] = {
                            "mean": float(np.mean(mu_s)), "std": float(np.std(mu_s)),
                            "p5": float(np.percentile(mu_s, 5)), "p50": float(np.percentile(mu_s, 50)),
                            "p95": float(np.percentile(mu_s, 95)),
                        }
                        predictive = np.random.normal(mu_s[:1000], sigma_s[:1000])
                        samples_dict[col] = predictive.tolist()
                    except Exception as e:
                        logger.warning(f"Failed to extract posterior for {col}: {e}")

        except Exception:
            logger.warning("PyMC sampling failed, using scipy approximation")

        if not posteriors:
            for col in columns:
                if col not in df.columns:
                    continue
                data = df[col].dropna().values
                if len(data) < 5:
                    continue
                posteriors[col] = {
                    "mean": float(np.mean(data)), "std": float(np.std(data)),
                    "p5": float(np.percentile(data, 5)), "p50": float(np.percentile(data, 50)),
                    "p95": float(np.percentile(data, 95)),
                }
                samples_dict[col] = np.random.normal(np.mean(data), np.std(data), 1000).tolist()

        max_samples = min(100, min((len(s) for s in samples_dict.values()), default=0))
        sample_list = []
        for i in range(max_samples):
            row = {}
            for col in samples_dict:
                if i < len(samples_dict[col]):
                    row[col] = samples_dict[col][i]
            if row:
                sample_list.append(row)

        return BayesianResult(
            posteriors=posteriors, conditional_probabilities={},
            samples=sample_list, convergence_diagnostics={"method": "mcmc" if posteriors else "scipy"},
        )

    def query_conditional(self, df: pd.DataFrame, target: str, evidence: dict[str, float]) -> dict[str, float]:
        feature_cols = [c for c in evidence.keys() if c in df.columns]
        if not feature_cols or target not in df.columns:
            return {}

        df_clean = df[feature_cols + [target]].dropna()
        if len(df_clean) < 20:
            return {}

        X, y = df_clean[feature_cols].values, df_clean[target].values

        try:
            import pymc as pm
            with pm.Model() as model:
                sigma = pm.HalfNormal("sigma", sigma=float(np.std(y)))
                intercept = pm.Normal("intercept", mu=float(np.mean(y)), sigma=float(np.std(y)) * 2)
                coefs = pm.Normal("coefs", mu=0, sigma=10, shape=len(feature_cols))
                mu = intercept + pm.math.dot(X, coefs)
                pm.Normal("y", mu=mu, sigma=sigma, observed=y)
                trace = pm.sample(draws=1000, chains=2, random_seed=self.random_seed,
                                  progressbar=False, return_inferencedata=True, cores=1)

            evidence_array = np.array([evidence[c] for c in feature_cols])
            intercept_s = trace.posterior["intercept"].values.flatten()
            coef_s = trace.posterior["coefs"].values.reshape(-1, len(feature_cols))
            sigma_s = trace.posterior["sigma"].values.flatten()

            predictions = [np.random.normal(intercept_s[i] + np.dot(evidence_array, coef_s[i]), sigma_s[i])
                           for i in range(min(1000, len(intercept_s)))]
            preds = np.array(predictions)
        except Exception:
            from sklearn.linear_model import BayesianRidge
            model = BayesianRidge()
            model.fit(X, y)
            preds_model = model.predict(evidence_array.reshape(1, -1))
            preds_std = np.sqrt(model.sigma_)
            predictions = [np.random.normal(preds_model[0], preds_std) for _ in range(1000)]
            preds = np.array(predictions)

        return {
            "mean": float(np.mean(preds)), "std": float(np.std(preds)),
            "p5": float(np.percentile(preds, 5)), "p50": float(np.percentile(preds, 50)),
            "p95": float(np.percentile(preds, 95)),
        }
