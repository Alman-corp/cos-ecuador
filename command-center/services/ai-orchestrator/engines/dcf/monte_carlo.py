from decimal import Decimal
from typing import Dict, List, Tuple
from pydantic import BaseModel, Field
import numpy as np
from engines.dcf.engine import DCFEngine, DCFInput


class MonteCarloInput(BaseModel):
    dcf_base_input: dict
    revenue_growth_dist: Dict = Field(default={"type": "triangular", "min": 0.02, "mode": 0.05, "max": 0.08})
    ebitda_margin_dist: Dict = Field(default={"type": "normal", "mean": 0.15, "std": 0.02})
    wacc_dist: Dict = Field(default={"type": "normal", "mean": 0.12, "std": 0.015})
    terminal_growth_dist: Dict = Field(default={"type": "triangular", "min": 0.01, "mode": 0.02, "max": 0.03})
    iterations: int = Field(10000, ge=1000, le=100000)
    random_seed: int = Field(42)


class MonteCarloOutput(BaseModel):
    iterations_completed: int
    iterations_valid: int
    mean: Decimal
    std: Decimal
    percentiles: Dict[str, Decimal]
    prob_equity_positive: float
    prob_above_base: float
    var_95: Decimal
    cvar_95: Decimal
    tornado_analysis: List[Dict]
    execution_time_seconds: float
    confidence_interval_95: Tuple[Decimal, Decimal]


class MonteCarloSimulator:
    def __init__(self):
        self.dcf_engine = DCFEngine()

    async def simulate(self, input: MonteCarloInput) -> MonteCarloOutput:
        import time
        start_time = time.time()

        np.random.seed(input.random_seed)
        samples = self._sample_parameters(input)
        equity_values = self._run_dcf_parallel(input.dcf_base_input, samples, input.iterations)

        valid_values = [v for v in equity_values if v is not None and not (isinstance(v, float) and np.isnan(v))]

        if len(valid_values) < input.iterations * 0.5:
            raise ValueError(f"Menos del 50% de iteraciones válidas ({len(valid_values)}/{input.iterations})")

        arr = np.array([float(v) for v in valid_values])
        percentiles = {
            "p5": Decimal(str(np.percentile(arr, 5))),
            "p25": Decimal(str(np.percentile(arr, 25))),
            "p50": Decimal(str(np.percentile(arr, 50))),
            "p75": Decimal(str(np.percentile(arr, 75))),
            "p95": Decimal(str(np.percentile(arr, 95))),
        }

        var_95 = Decimal(str(np.percentile(arr, 5)))
        cvar_95 = Decimal(str(arr[arr <= float(var_95)].mean())) if len(arr[arr <= float(var_95)]) > 0 else var_95

        prob_positive = float(np.sum(arr > 0) / len(arr))
        base_equity = self._calculate_base_case(input.dcf_base_input)
        prob_above_base = float(np.sum(arr > float(base_equity)) / len(arr))
        tornado_analysis = self._calculate_tornado(input, samples, valid_values)

        execution_time = time.time() - start_time

        return MonteCarloOutput(
            iterations_completed=input.iterations,
            iterations_valid=len(valid_values),
            mean=Decimal(str(np.mean(arr))),
            std=Decimal(str(np.std(arr))),
            percentiles=percentiles,
            prob_equity_positive=prob_positive,
            prob_above_base=prob_above_base,
            var_95=var_95,
            cvar_95=cvar_95,
            tornado_analysis=tornado_analysis,
            execution_time_seconds=execution_time,
            confidence_interval_95=(percentiles["p5"], percentiles["p95"]),
        )

    def _sample_parameters(self, input: MonteCarloInput) -> Dict[str, np.ndarray]:
        samples = {}
        n = input.iterations

        def sample_dist(dist: Dict, size: int) -> np.ndarray:
            t = dist["type"]
            if t == "normal":
                return np.random.normal(dist["mean"], dist["std"], size)
            elif t == "triangular":
                return np.random.triangular(dist["min"], dist["mode"], dist["max"], size)
            elif t == "uniform":
                return np.random.uniform(dist["min"], dist["max"], size)
            raise ValueError(f"Distribución no soportada: {t}")

        samples["revenue_growth"] = sample_dist(input.revenue_growth_dist, n)
        samples["ebitda_margin"] = sample_dist(input.ebitda_margin_dist, n)
        samples["wacc"] = sample_dist(input.wacc_dist, n)
        samples["terminal_growth"] = sample_dist(input.terminal_growth_dist, n)
        return samples

    def _run_dcf_parallel(self, base_input: dict, samples: Dict[str, np.ndarray], iterations: int) -> List:
        equity_values = []
        for i in range(iterations):
            try:
                scenario = dict(base_input)
                scenario["revenue_growth_rate"] = float(samples["revenue_growth"][i])
                scenario["ebitda_margin"] = float(samples["ebitda_margin"][i])
                scenario["terminal_growth"] = float(samples["terminal_growth"][i])

                target_wacc = float(samples["wacc"][i])
                if target_wacc <= scenario["terminal_growth"]:
                    equity_values.append(None)
                    continue

                inp = DCFInput(**scenario)
                output = self.dcf_engine.calculate(inp)
                equity_values.append(output.equity_value)
            except Exception:
                equity_values.append(None)
        return equity_values

    def _calculate_base_case(self, base_input: dict) -> Decimal:
        try:
            output = self.dcf_engine.calculate(DCFInput(**base_input))
            return output.equity_value
        except Exception:
            return Decimal('0')

    def _calculate_tornado(self, input: MonteCarloInput, samples: Dict[str, np.ndarray], values: List) -> List[Dict]:
        variables = ["revenue_growth", "ebitda_margin", "wacc", "terminal_growth"]
        tornado = []
        base_case = float(self._calculate_base_case(input.dcf_base_input))
        if base_case == 0:
            return []

        for var in variables:
            valid_mask = [v is not None for v in values]
            if sum(valid_mask) < 100:
                continue
            var_samples = samples[var][valid_mask]
            valid_values = np.array([float(v) for v in values if v is not None])
            correlation = float(np.corrcoef(var_samples, valid_values)[0, 1])
            impact_pct = (correlation * float(np.std(valid_values)) / base_case) * 100

            tornado.append({
                "variable": var,
                "correlation": correlation,
                "impact_pct": impact_pct,
                "impact_abs": float(correlation * float(np.std(valid_values))),
            })

        tornado.sort(key=lambda x: abs(x["impact_pct"]), reverse=True)
        return tornado
