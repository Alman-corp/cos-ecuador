from pydantic import BaseModel
import numpy as np


class MonteCarloInput(BaseModel):
    revenue_base: float
    revenue_growth_mean: float = 0.05
    revenue_growth_std: float = 0.02
    ebitda_margin_mean: float = 0.30
    ebitda_margin_std: float = 0.03
    wacc_mean: float = 0.11
    wacc_std: float = 0.01
    terminal_growth_mean: float = 0.02
    terminal_growth_std: float = 0.005
    projection_years: int = 5
    iterations: int = 10000
    confidence_level: float = 0.95


class MonteCarloOutput(BaseModel):
    mean_ev: float
    median_ev: float
    std_ev: float
    p5: float
    p25: float
    p75: float
    p95: float
    var_95: float
    cvar_95: float
    probability_positive: float
    histogram_bins: list[float]
    histogram_counts: list[int]


class MonteCarloEngine:
    def simulate(self, input_data: MonteCarloInput) -> MonteCarloOutput:
        n = input_data.iterations
        np.random.seed(42)

        growth_samples = np.random.normal(input_data.revenue_growth_mean, input_data.revenue_growth_std, n)
        margin_samples = np.random.normal(input_data.ebitda_margin_mean, input_data.ebitda_margin_std, n)
        wacc_samples = np.random.normal(input_data.wacc_mean, input_data.wacc_std, n)
        tg_samples = np.random.normal(input_data.terminal_growth_mean, input_data.terminal_growth_std, n)

        evs = []
        for i in range(n):
            g = growth_samples[i]
            m = margin_samples[i]
            w = wacc_samples[i]
            tg = tg_samples[i]

            if w <= tg:
                continue

            fcf = input_data.revenue_base * m
            pv_sum = 0.0
            for y in range(1, input_data.projection_years + 1):
                fcf *= (1 + g)
                pv_sum += fcf / ((1 + w) ** y)

            tv = fcf * (1 + tg) / (w - tg)
            pv_tv = tv / ((1 + w) ** input_data.projection_years)
            ev = pv_sum + pv_tv
            evs.append(ev)

        arr = np.array(evs)
        mean_ev = float(np.mean(arr))
        median_ev = float(np.median(arr))
        std_ev = float(np.std(arr))
        p5 = float(np.percentile(arr, 5))
        p25 = float(np.percentile(arr, 25))
        p75 = float(np.percentile(arr, 75))
        p95 = float(np.percentile(arr, 95))
        var_95 = p5
        cvar_arr = arr[arr <= p5]
        cvar_95 = float(np.mean(cvar_arr)) if len(cvar_arr) > 0 else p5
        prob_pos = float(np.sum(arr > 0) / len(arr))

        hist_counts, hist_bins = np.histogram(arr, bins=50)
        bins = [float(b) for b in hist_bins]
        counts = [int(c) for c in hist_counts]

        return MonteCarloOutput(
            mean_ev=round(mean_ev, 2),
            median_ev=round(median_ev, 2),
            std_ev=round(std_ev, 2),
            p5=round(p5, 2),
            p25=round(p25, 2),
            p75=round(p75, 2),
            p95=round(p95, 2),
            var_95=round(var_95, 2),
            cvar_95=round(cvar_95, 2),
            probability_positive=round(prob_pos, 4),
            histogram_bins=bins,
            histogram_counts=counts,
        )
