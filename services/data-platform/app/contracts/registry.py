"""73: Data Contracts — schema + quality rules + SLA + PII declarations."""
from __future__ import annotations
from pathlib import Path
from typing import Optional, Any
from datetime import datetime
import yaml
import jsonschema
import pandas as pd
import logging
from app.shared.schemas import DataContract, QualityRule, SLASpec, ContractValidationResult

logger = logging.getLogger(__name__)


class ContractRegistry:
    def __init__(self, contracts_dir: Path):
        self.contracts_dir = Path(contracts_dir)
        self.contracts: dict[str, DataContract] = {}
        self._load_all()

    def _load_all(self):
        for f in list(self.contracts_dir.glob("**/*.yml")) + list(self.contracts_dir.glob("**/*.yaml")):
            try:
                with open(f) as fh:
                    data = yaml.safe_load(fh)
                contract = DataContract(**data)
                self.contracts[f"{contract.name}@{contract.version}"] = contract
            except Exception as e:
                logger.warning(f"Failed to load contract {f}: {e}")

    def get(self, name: str, version: Optional[str] = None) -> Optional[DataContract]:
        if version:
            return self.contracts.get(f"{name}@{version}")
        matching = [c for c in self.contracts.values() if c.name == name]
        return max(matching, key=lambda c: self._parse_version(c.version)) if matching else None

    def _parse_version(self, version: str) -> tuple:
        try:
            return tuple(int(p) for p in version.split("."))
        except ValueError:
            return (0,)

    def list_all(self) -> list[DataContract]:
        return list(self.contracts.values())

    def register(self, contract: DataContract):
        key = f"{contract.name}@{contract.version}"
        self.contracts[key] = contract
        path = self.contracts_dir / f"{contract.name}_v{contract.version}.yml"
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            yaml.dump(contract.model_dump(), f, default_flow_style=False)

    def validate_schema(self, contract: DataContract, dataframe: pd.DataFrame) -> dict[str, Any]:
        issues = []
        records = dataframe.to_dict("records")
        validator = jsonschema.Draft7Validator(contract.schema_spec)
        for i, record in enumerate(records[:100]):
            errors = list(validator.iter_errors(record))
            if errors:
                issues.append({"row": i, "errors": [{"path": list(e.path), "message": e.message} for e in errors[:3]]})
        return {"schema_valid": len(issues) == 0, "issues_count": len(issues), "sample_issues": issues[:10]}


class ContractValidator:
    def __init__(self, registry: ContractRegistry):
        self.registry = registry

    def validate(self, contract_name: str, dataframe: pd.DataFrame, last_updated: Optional[datetime] = None) -> ContractValidationResult:
        contract = self.registry.get(contract_name)
        if not contract:
            return ContractValidationResult(contract_name=contract_name, validated_at=datetime.utcnow(), is_valid=False, failed_rules=[{"rule": "contract_not_found", "message": f"No contract: {contract_name}"}], passed_rules_count=0, total_rules_count=0, freshness_ok=False, schema_ok=False, dq_score=0.0)
        failed_rules = []
        passed_count = 0
        schema_result = self.registry.validate_schema(contract, dataframe)
        schema_ok = schema_result["schema_valid"]
        if not schema_ok:
            failed_rules.append({"rule": "schema", "severity": "critical", "details": schema_result})
        else:
            passed_count += 1
        for rule in contract.quality_rules:
            if self._check_rule(rule, dataframe):
                passed_count += 1
            else:
                failed_rules.append({"rule": rule.name, "type": rule.type, "severity": rule.severity, "column": rule.column})
        freshness_ok = True
        if last_updated and contract.sla.freshness_hours:
            hours_since = (datetime.utcnow() - last_updated).total_seconds() / 3600
            freshness_ok = hours_since <= contract.sla.freshness_hours
            if not freshness_ok:
                failed_rules.append({"rule": "freshness_sla", "severity": "warning", "details": {"expected_hours": contract.sla.freshness_hours, "actual_hours": round(hours_since, 2)}})
        total_rules = 1 + len(contract.quality_rules)
        dq_score = (passed_count / total_rules * 100) if total_rules > 0 else 0
        if not freshness_ok:
            dq_score *= 0.9
        return ContractValidationResult(contract_name=contract_name, validated_at=datetime.utcnow(), is_valid=len([r for r in failed_rules if r.get("severity") == "critical"]) == 0, failed_rules=failed_rules, passed_rules_count=passed_count, total_rules_count=total_rules, freshness_ok=freshness_ok, schema_ok=schema_ok, dq_score=dq_score)

    def _check_rule(self, rule: QualityRule, df: pd.DataFrame) -> bool:
        try:
            if rule.type == "not_null":
                return df[rule.column].notna().all()
            if rule.type == "unique":
                return df[rule.column].is_unique
            if rule.type == "range":
                col = df[rule.column]
                ok = True
                if rule.params.get("min") is not None:
                    ok = ok and (col >= rule.params["min"]).all()
                if rule.params.get("max") is not None:
                    ok = ok and (col <= rule.params["max"]).all()
                return ok
            if rule.type == "regex":
                return df[rule.column].astype(str).str.match(rule.params["pattern"]).all()
            if rule.type == "custom":
                return bool(df.eval(rule.params["expression"]).all())
            return True
        except Exception as e:
            logger.warning(f"Rule {rule.name} failed: {e}")
            return False
