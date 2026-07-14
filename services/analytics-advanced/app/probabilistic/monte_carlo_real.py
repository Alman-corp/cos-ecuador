from __future__ import annotations
import numpy as np
from scipy import stats
from scipy.stats import norm, lognorm, triang, uniform, beta, gamma, pareto, t as student_t
from typing import Optional
import logging

from app.shared import MonteCarloSpec, MonteCarloResult, DistributionSpec

logger = logging.getLogger(__name__)


class AdvancedMonteCarlo:
    DISTRIBUTION_MAP = {
        "normal": norm, "lognormal": lognorm, "triangular": triang,
        "uniform": uniform, "beta": beta, "gamma": gamma, "pareto": pareto, "student_t": student_t,
    }

    def run(self, spec: MonteCarloSpec) -> MonteCarloResult:
        if spec.seed is not None:
            np.random.seed(spec.seed)

        samples = {}
        for var_name, dist_spec in spec.variables.items():
            samples[var_name] = self._sample(dist_spec, spec.n_simulations)

        if spec.correlations:
            samples = self._apply_correlations(samples, spec.correlations, spec.n_simulations)

        output = self._evaluate(spec.formula, samples)

        mean = float(np.mean(output))
        median = float(np.median(output))
        std = float(np.std(output))

        percentiles = {
            f"p{p}": float(np.percentile(output, p))
            for p in [1, 5, 10, 25, 50, 75, 90, 95, 99]
        }
        var_95 = float(np.percentile(output, 5))
        tail = output[output <= var_95]
        cvar_95 = float(np.mean(tail)) if len(tail) > 0 else var_95

        prob_positive = float(np.mean(output > 0))
        hist, bins = np.histogram(output, bins=50)
        histogram = {"counts": hist.tolist(), "bins": bins.tolist()}

        sensitivity = self._sobol_sensitivity(output, samples)
        n_show = min(1000, len(output))
        sample_list = output[np.linspace(0, len(output) - 1, n_show, dtype=int)].tolist()

        return MonteCarloResult(
            mean=mean, median=median, std=std, percentiles=percentiles,
            var_95=var_95, cvar_95=cvar_95, probability_positive=prob_positive,
            histogram=histogram, sensitivity=sensitivity, samples=sample_list,
        )

    def _sample(self, spec: DistributionSpec, n: int) -> np.ndarray:
        params = spec.params
        try:
            if spec.type == "empirical" and spec.historical_data:
                return np.random.choice(spec.historical_data, size=n, replace=True)
            if spec.type == "empirical":
                return self._fit_distribution(spec.historical_data or [], n)
            if spec.type == "normal":
                return np.random.normal(params["mean"], params["std"], n)
            if spec.type == "lognormal":
                mu = params.get("mu", np.log(params.get("mean", 1)))
                sigma = params.get("sigma", params.get("std", 0.5))
                return lognorm(s=sigma, scale=np.exp(mu)).rvs(n)
            if spec.type == "triangular":
                low, mode, high = params["low"], params["mode"], params["high"]
                return triang(c=(mode - low) / (high - low), loc=low, scale=high - low).rvs(n)
            if spec.type == "uniform":
                return uniform(loc=params["low"], scale=params["high"] - params["low"]).rvs(n)
            if spec.type == "beta":
                s = beta(a=params["alpha"], b=params["beta"]).rvs(n)
                if "low" in params and "high" in params:
                    s = s * (params["high"] - params["low"]) + params["low"]
                return s
            if spec.type == "gamma":
                return gamma(a=params["shape"], scale=params.get("scale", 1)).rvs(n)
            if spec.type == "pareto":
                return pareto(b=params["shape"]).rvs(n) * params.get("scale", 1)
            if spec.type == "student_t":
                return params.get("mean", 0) + params.get("std", 1) * student_t(df=params["df"]).rvs(n)
            raise ValueError(f"Unknown distribution: {spec.type}")
        except Exception as e:
            logger.error(f"Sampling failed: {e}")
            return np.random.normal(params.get("mean", 0), params.get("std", 1), n)

    def _fit_distribution(self, data: list[float], n: int) -> np.ndarray:
        if not data or len(data) < 10:
            return np.random.normal(0, 1, n)
        arr = np.array(data)
        candidates = []
        try:
            mu, sigma = norm.fit(arr)
            ks, _ = stats.kstest(arr, "norm", args=(mu, sigma))
            candidates.append((ks, norm(mu, sigma).rvs(n)))
        except Exception:
            pass
        if np.all(arr > 0):
            try:
                shape, loc, scale = lognorm.fit(arr, floc=0)
                ks, _ = stats.kstest(arr, "lognorm", args=(shape, loc, scale))
                candidates.append((ks, lognorm(shape, loc, scale).rvs(n)))
            except Exception:
                pass
            try:
                a, loc, scale = gamma.fit(arr, floc=0)
                ks, _ = stats.kstest(arr, "gamma", args=(a, loc, scale))
                candidates.append((ks, gamma(a, loc, scale).rvs(n)))
            except Exception:
                pass
        if candidates:
            return min(candidates, key=lambda x: x[0])[1]
        return np.random.normal(np.mean(arr), np.std(arr), n)

    def _apply_correlations(self, samples: dict[str, np.ndarray], correlations: list[tuple[str, str, float]], n: int) -> dict[str, np.ndarray]:
        vars_set = set()
        for v1, v2, _ in correlations:
            if v1 in samples:
                vars_set.add(v1)
            if v2 in samples:
                vars_set.add(v2)
        var_list = list(vars_set)
        if len(var_list) < 2:
            return samples
        n_vars = len(var_list)
        var_idx = {v: i for i, v in enumerate(var_list)}
        corr_matrix = np.eye(n_vars)
        for v1, v2, rho in correlations:
            if v1 in var_idx and v2 in var_idx:
                corr_matrix[var_idx[v1], var_idx[v2]] = rho
                corr_matrix[var_idx[v2], var_idx[v1]] = rho
        try:
            np.linalg.cholesky(corr_matrix)
        except np.linalg.LinAlgError:
            corr_matrix = self._nearest_pd(corr_matrix)
        mvn = np.random.multivariate_normal(mean=np.zeros(n_vars), cov=corr_matrix, size=n)
        ranks = np.zeros_like(mvn)
        for i in range(n_vars):
            ranks[:, i] = stats.rankdata(mvn[:, i]) / (n + 1)
        result = samples.copy()
        for v in var_list:
            sorted_orig = np.sort(samples[v])
            result[v] = sorted_orig[np.argsort(np.argsort(ranks[:, var_idx[v]]))]
        return result

    def _nearest_pd(self, A: np.ndarray) -> np.ndarray:
        B = (A + A.T) / 2
        _, s, V = np.linalg.svd(B)
        H = V.T @ np.diag(s) @ V
        B2 = (B + H) / 2
        B3 = (B2 + B2.T) / 2
        try:
            np.linalg.cholesky(B3)
            return B3
        except np.linalg.LinAlgError:
            spacing = np.spacing(np.linalg.norm(A))
            I = np.eye(A.shape[0])
            k = 1
            while True:
                try:
                    np.linalg.cholesky(B3 + k * spacing * I)
                    return B3 + k * spacing * I
                except np.linalg.LinAlgError:
                    k *= 2

    def _evaluate(self, formula: str, samples: dict[str, np.ndarray]) -> np.ndarray:
        safe_ns = {"np": np, "sqrt": np.sqrt, "exp": np.exp, "log": np.log, "abs": np.abs, "max": np.maximum, "min": np.minimum, "pow": np.power}
        safe_ns.update(samples)
        forbidden = ["import", "exec", "eval", "__", "open", "file"]
        if any(f in formula.lower() for f in forbidden):
            raise ValueError("Forbidden operations in formula")
        try:
            return eval(formula, {"__builtins__": {}}, safe_ns)
        except Exception as e:
            raise ValueError(f"Formula evaluation failed: {e}")

    def _sobol_sensitivity(self, output: np.ndarray, samples: dict[str, np.ndarray]) -> dict[str, float]:
        total_var = np.var(output)
        if total_var == 0:
            return {v: 0.0 for v in samples}
        sens = {}
        for var_name, s in samples.items():
            corr = np.corrcoef(s, output)[0, 1]
            sens[var_name] = float(corr ** 2)
        t = sum(sens.values()) or 1.0
        return {k: v / t for k, v in sorted(sens.items(), key=lambda x: x[1], reverse=True)}
