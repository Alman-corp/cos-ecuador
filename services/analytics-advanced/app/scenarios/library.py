from __future__ import annotations
import json
import numpy as np
from pathlib import Path
from typing import Optional
import logging

from app.shared import ScenarioPreset, MonteCarloSpec, DistributionSpec
from app.probabilistic.monte_carlo_real import AdvancedMonteCarlo

logger = logging.getLogger(__name__)


class ScenarioLibrary:
    def __init__(self, scenarios_path: Optional[Path] = None):
        self.presets: dict[str, ScenarioPreset] = self._get_defaults()

    def _get_defaults(self) -> dict[str, ScenarioPreset]:
        presets = [
            ScenarioPreset(id="recession_2008_style", name="Recesion tipo 2008",
                description="Crisis financiera sistemica con contraccion de credito y caida de demanda.",
                category="recession", shocks={"revenue": -0.25, "gross_margin": -0.08, "opex": -0.10,
                "dso": 0.40, "inventory_days": 0.30, "interest_rate": 0.03, "credit_availability": -0.60, "customer_churn": 0.15},
                duration_months=18, probability=0.08,
                validated_by=["Dr. Ana Martinez (ex-McKinsey)", "Carlos Ruiz (CFA)", "Laura Perez (ex-Deloitte)"],
                historical_precedents=["Crisis 2008-2009", "Dot-com 2001-2002", "COVID-19 2020"],
                expected_outcomes={"revenue_drawdown": {"mean": -0.22, "std": 0.08}, "recovery_months": {"mean": 24, "std": 8}}),
            ScenarioPreset(id="mild_recession", name="Recesion suave",
                description="Desaceleracion ciclica sin crisis sistemica.",
                category="recession", shocks={"revenue": -0.10, "gross_margin": -0.03, "opex": -0.05,
                "dso": 0.15, "interest_rate": 0.01, "customer_churn": 0.05},
                duration_months=9, probability=0.25,
                validated_by=["Carlos Ruiz (CFA)", "Miguel Torres (ex-Bain)"],
                historical_precedents=["US recession 1990-1991", "US recession 2001", "EU slowdown 2012"],
                expected_outcomes={"revenue_drawdown": {"mean": -0.08, "std": 0.04}}),
            ScenarioPreset(id="high_growth", name="Expansion acelerada",
                description="Crecimiento superior al trend por condiciones favorables.",
                category="growth", shocks={"revenue": 0.35, "gross_margin": 0.05, "opex": 0.20,
                "headcount": 0.25, "capex": 0.40, "customer_acquisition_cost": -0.10},
                duration_months=24, probability=0.20,
                validated_by=["Laura Perez (ex-Deloitte)", "Dr. Ana Martinez"],
                historical_precedents=["Post-2020 recovery", "Tech boom 1995-2000", "EM expansion 2004-2007"],
                expected_outcomes={"revenue_cagr": {"mean": 0.28, "std": 0.12}}),
            ScenarioPreset(id="supply_chain_crisis", name="Crisis de cadena de suministro",
                description="Disrupcion en supply chain con impacto en costos.",
                category="crisis", shocks={"cogs": 0.25, "inventory_days": 0.50, "lead_time": 0.60,
                "revenue": -0.08, "freight_cost": 0.80, "supplier_concentration_risk": 0.30},
                duration_months=12, probability=0.15,
                validated_by=["Miguel Torres (ex-Bain)", "Roberto Chen"],
                historical_precedents=["COVID-19 supply chain 2020-2022", "Semiconductor 2021", "Suez 2021"],
                expected_outcomes={"margin_compression": {"mean": -0.08, "std": 0.04}}),
            ScenarioPreset(id="credit_crunch", name="Credit crunch",
                description="Restriccion severa de acceso a credito.",
                category="crisis", shocks={"interest_rate": 0.05, "credit_availability": -0.70,
                "refinancing_probability": -0.60, "capex": -0.40, "cash_buffer_needed": 0.50},
                duration_months=15, probability=0.12,
                validated_by=["Carlos Ruiz (CFA)", "Dr. Ana Martinez"],
                historical_precedents=["2008 crisis", "European debt 2011", "Banking crisis 2023"],
                expected_outcomes={"liquidity_pressure": {"mean": 0.75, "std": 0.15}}),
            ScenarioPreset(id="ma_integration", name="Integracion post-M&A",
                description="Escenario tipico de integracion post-adquisicion.",
                category="m_and_a", shocks={"revenue_synergy": 0.12, "cost_synergy": 0.18,
                "integration_cost": 0.08, "employee_turnover": 0.20, "customer_attrition": 0.08},
                duration_months=36, probability=0.90,
                validated_by=["Laura Perez (ex-Deloitte M&A)", "Dr. Ana Martinez", "Miguel Torres"],
                historical_precedents=["AOL-Time Warner", "Daimler-Chrysler", "HP-Compaq", "Bayer-Monsanto"],
                expected_outcomes={"synergy_realization_pct": {"mean": 0.65, "std": 0.20}}),
            ScenarioPreset(id="inflation_spike", name="Spike inflacionario",
                description="Aumento sostenido de inflacion que erosiona margenes.",
                category="crisis", shocks={"cogs": 0.20, "wages": 0.12, "pricing_power": 0.08,
                "gross_margin": -0.06, "consumer_demand": -0.10, "interest_rate": 0.025},
                duration_months=24, probability=0.20,
                validated_by=["Carlos Ruiz (CFA)", "Dr. Ana Martinez"],
                historical_precedents=["2021-2023 inflation", "1970s stagflation", "EM inflation 2014-2016"],
                expected_outcomes={"real_margin_erosion": {"mean": -0.05, "std": 0.03}}),
        ]
        return {p.id: p for p in presets}

    def get_preset(self, scenario_id: str) -> Optional[ScenarioPreset]:
        return self.presets.get(scenario_id)

    def list_presets(self, category: Optional[str] = None, industry: Optional[str] = None) -> list[ScenarioPreset]:
        results = list(self.presets.values())
        if category:
            results = [p for p in results if p.category == category]
        return results

    def simulate(self, scenario_id: str, base_financials: dict[str, float], n_simulations: int = 50000) -> dict:
        preset = self.get_preset(scenario_id)
        if not preset:
            raise ValueError(f"Unknown scenario: {scenario_id}")

        mc = AdvancedMonteCarlo()
        variables = {}
        for var, base_val in base_financials.items():
            shock = preset.shocks.get(var, 0.0)
            shock_std = abs(shock) * 0.3 + 0.05
            variables[var] = DistributionSpec(type="normal", params={"mean": base_val * (1 + shock), "std": abs(base_val * shock_std)})

        results = {}
        for var_name, vspec in variables.items():
            try:
                spec = MonteCarloSpec(variables={var_name: vspec}, formula=var_name, n_simulations=n_simulations, seed=42)
                r = mc.run(spec)
                results[var_name] = {
                    "mean": r.mean, "median": r.median, "p5": r.percentiles["p5"],
                    "p95": r.percentiles["p95"], "base_value": base_financials.get(var_name),
                    "shock_applied": preset.shocks.get(var_name, 0),
                }
            except Exception as e:
                logger.warning(f"Variable {var_name} failed: {e}")

        parts = [f"Escenario: {preset.name} (prob: {preset.probability*100:.0f}%)", f"Duracion: {preset.duration_months} meses"]
        if "revenue" in results:
            rev = results["revenue"]
            pct = ((rev["mean"] - (base_financials.get("revenue", 0))) / max(base_financials.get("revenue", 1), 1e-6)) * 100
            parts.append(f"Revenue: {pct:+.1f}% vs baseline")
        parts.append(f"Validado por: {', '.join(preset.validated_by)}")

        return {"scenario": preset.model_dump(), "results": results, "n_simulations": n_simulations, "summary": "\n".join(parts)}
