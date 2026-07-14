"""79: Multi-GAAP Converter — IFRS ↔ US GAAP ↔ LATAM local GAAP heuristic adjustments."""
from __future__ import annotations
from typing import Optional
from datetime import date
from app.shared.schemas import GAAPConversionRequest, GAAPConversionResult, GAAPAdjustment, GAAPStandard

_CONVERSION_RULES: dict[str, list[dict]] = {
    "IFRS_to_US_GAAP": [
        {"account": "R&D_expense", "adjustment": "capitalize", "reason": "IFRS allows expensing; US GAAP requires capitalization of certain development costs", "gaap_reference": "ASC 985-20 / IAS 38"},
        {"account": "Inventory", "adjustment": "add_LIFO_reserve", "reason": "IFRS prohibits LIFO; US GAAP allows LIFO. Add LIFO reserve to convert", "gaap_reference": "ASC 330 / IAS 2"},
        {"account": "Property_Plant_Equipment", "adjustment": "remove_revaluation", "reason": "IFRS allows revaluation model; US GAAP requires cost model", "gaap_reference": "ASC 360 / IAS 16"},
        {"account": "Impairment_loss", "adjustment": "reverse_if_recovered", "reason": "IFRS allows impairment reversal; US GAAP prohibits reversal", "gaap_reference": "ASC 350 / IAS 36"},
        {"account": "Borrowing_costs", "adjustment": "capitalize", "reason": "Both capitalize but scope differences exist", "gaap_reference": "ASC 835-20 / IAS 23"},
    ],
    "US_GAAP_to_IFRS": [
        {"account": "R&D_expense", "adjustment": "expense", "reason": "US GAAP capitalizes certain development costs; IFRS may expense more broadly", "gaap_reference": "IAS 38 / ASC 985-20"},
        {"account": "Inventory", "adjustment": "remove_LIFO_reserve", "reason": "IFRS prohibits LIFO. Remove LIFO reserve from inventory", "gaap_reference": "IAS 2 / ASC 330"},
        {"account": "Property_Plant_Equipment", "adjustment": "allow_revaluation", "reason": "IFRS allows revaluation; US GAAP requires cost model", "gaap_reference": "IAS 16 / ASC 360"},
        {"account": "Impairment_loss", "adjustment": "allow_reversal", "reason": "IFRS allows impairment reversal; US GAAP prohibits", "gaap_reference": "IAS 36 / ASC 350"},
        {"account": "Development_costs", "adjustment": "expense_if_not_meet_criteria", "reason": "IFRS requires capitalization only if strict criteria met", "gaap_reference": "IAS 38"},
    ],
    "IFRS_to_EC_LOCAL": [
        {"account": "Deferred_tax", "adjustment": "reclassify", "reason": "Ecuador local GAAP (NIIF ESME) may classify deferred taxes differently", "gaap_reference": "NIC 12 / NIIF ESME"},
        {"account": "Hyperinflation", "adjustment": "apply_NIC_29_if_needed", "reason": "Ecuador economy not hyperinflationary but entities must assess", "gaap_reference": "NIC 29 / NIIF ESME"},
    ],
    "IFRS_to_CO_LOCAL": [
        {"account": "Leases", "adjustment": "adjust_discount_rate", "reason": "Colombia local GAAP (NIIF Colombia) may use different discount rates for leases", "gaap_reference": "NIIF 16 / DUR 2706"},
        {"account": "Government_grants", "adjustment": "defer_recognition", "reason": "Colombia has specific recognition rules for government grants", "gaap_reference": "NIC 20 / Decreto 2548"},
    ],
    "IFRS_to_MX_LOCAL": [
        {"account": "Employee_benefits", "adjustment": "actuarial_gains_losses", "reason": "Mexico NIF D-3 requires immediate recognition of actuarial gains/losses in P&L", "gaap_reference": "NIF D-3 / IAS 19"},
        {"account": "Hyperinflation", "adjustment": "apply_NIF_B-10", "reason": "Mexico NIF B-10 requires restatement in hyperinflationary periods", "gaap_reference": "NIF B-10 / NIC 29"},
    ],
}


class GAAPConverter:
    def __init__(self):
        self.available_conversions = {
            "IFRS_to_US_GAAP": {"source": "IFRS", "target": "US_GAAP", "description": "IFRS to US GAAP (5 rules)"},
            "US_GAAP_to_IFRS": {"source": "US_GAAP", "target": "IFRS", "description": "US GAAP to IFRS (5 rules)"},
            "IFRS_to_EC_LOCAL": {"source": "IFRS", "target": "EC_LOCAL", "description": "IFRS to Ecuador Local GAAP (ESME)"},
            "IFRS_to_CO_LOCAL": {"source": "IFRS", "target": "CO_LOCAL", "description": "IFRS to Colombia Local GAAP"},
            "IFRS_to_MX_LOCAL": {"source": "IFRS", "target": "MX_LOCAL", "description": "IFRS to Mexico Local GAAP (NIF)"},
        }

    def convert(self, request: GAAPConversionRequest) -> GAAPConversionResult:
        rule_key = f"{request.source_gaap.value}_to_{request.target_gaap.value}"
        rules = _CONVERSION_RULES.get(rule_key, [])
        financials = dict(request.financials)
        adjustments = []
        total_impact = 0.0
        for rule in rules:
            account = rule["account"]
            orig_val = financials.get(account, 0.0)
            if orig_val == 0:
                continue
            if rule["adjustment"] == "capitalize":
                adj_val = orig_val * -1
            elif rule["adjustment"] == "remove_LIFO_reserve":
                adj_val = orig_val * 0.95
            elif "remove_revaluation" in rule["adjustment"]:
                adj_val = orig_val * 0.9
            elif "reverse" in rule["adjustment"]:
                adj_val = abs(orig_val) * -0.3
            elif "expense" in rule["adjustment"]:
                adj_val = orig_val * 0.8
            else:
                adj_val = orig_val * 0.95
            adjustment_amount = round(adj_val - orig_val, 2)
            if abs(adjustment_amount) < 0.01:
                continue
            total_impact += adjustment_amount
            adjusted_value = round(orig_val + adjustment_amount, 2)
            financials[account] = adjusted_value
            adjustments.append(GAAPAdjustment(account=account, original_value=round(orig_val, 2), adjusted_value=adjusted_value, adjustment_amount=adjustment_amount, reason=rule["reason"], gaap_reference=rule["gaap_reference"]))
        notes = []
        if not rules:
            notes.append(f"Conversion from {request.source_gaap.value} to {request.target_gaap.value} has no predefined rules; returning original financials")
        notes.append(f"Applied {len(adjustments)} heuristic adjustments based on {request.source_gaap.value}→{request.target_gaap.value} conversion rules")
        return GAAPConversionResult(entity_id=request.entity_id, source_gaap=request.source_gaap, target_gaap=request.target_gaap, original_financials={k: round(v, 2) for k, v in request.financials.items()}, adjusted_financials={k: round(v, 2) for k, v in financials.items()}, adjustments=adjustments, total_adjustment_impact=round(total_impact, 2), reconciliation_notes=notes)
