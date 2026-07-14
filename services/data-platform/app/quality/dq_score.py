"""80: Data Quality Score — 6-dimension scoring engine with automatic rule inference."""
from __future__ import annotations
from typing import Optional, Any
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import logging
from app.shared.schemas import DQScore, DQDimension

logger = logging.getLogger(__name__)


class DQScoreEngine:
    DIMENSIONS = ["Completeness", "Validity", "Uniqueness", "Timeliness", "Consistency", "Accuracy"]
    WEIGHTS = {"Completeness": 0.20, "Validity": 0.20, "Uniqueness": 0.15, "Timeliness": 0.15, "Consistency": 0.15, "Accuracy": 0.15}

    def __init__(self):
        self.rules_cache: dict[str, list[dict]] = {}

    def evaluate(self, df: pd.DataFrame, entity_id: Optional[str] = None, table_name: Optional[str] = None, expected_schema: Optional[dict[str, str]] = None, reference_df: Optional[pd.DataFrame] = None, last_updated: Optional[datetime] = None) -> DQScore:
        dimensions = []
        critical_issues = []
        recommendations = []

        comp = self._completeness(df)
        dimensions.append(comp)
        if comp.score < 80:
            critical_issues.extend(comp.issues[:3])
            recommendations.append(f"Fill missing values in {len(comp.issues)} columns with null rates > 5%")

        val = self._validity(df, expected_schema or {})
        dimensions.append(val)
        if val.score < 80:
            critical_issues.extend(val.issues[:3])
            recommendations.append("Add constraint validation for type/format mismatches")

        uni = self._uniqueness(df)
        dimensions.append(uni)
        if uni.score < 80:
            critical_issues.extend(uni.issues[:3])
            recommendations.append("Review duplicate detection logic and add unique constraints")

        time_dim = self._timeliness(df, last_updated)
        dimensions.append(time_dim)
        if time_dim.score < 80:
            critical_issues.extend(time_dim.issues[:3])
            recommendations.append("Set up freshness monitoring and alerting for stale data")

        cons = self._consistency(df)
        dimensions.append(cons)
        if cons.score < 80:
            critical_issues.extend(cons.issues[:3])
            recommendations.append("Implement cross-table consistency checks in pipeline")

        acc = self._accuracy(df, reference_df)
        dimensions.append(acc)
        if acc.score < 80:
            critical_issues.extend(acc.issues[:3])
            recommendations.append("Schedule periodic accuracy audits against source of truth")

        overall = sum(d.score * self.WEIGHTS.get(d.name, 0.15) for d in dimensions)
        grade = self._grade(overall)
        is_trustworthy = overall >= 85

        return DQScore(entity_id=entity_id, table_name=table_name, evaluated_at=datetime.now(timezone.utc), overall_score=round(overall, 1), grade=grade, dimensions=dimensions, row_count=len(df), critical_issues=critical_issues[:10], recommendations=recommendations[:5], is_trustworthy=is_trustworthy)

    def _completeness(self, df: pd.DataFrame) -> DQDimension:
        total = len(df) * len(df.columns)
        nulls = int(df.isna().sum().sum()) if total > 0 else 0
        score = round(100 * (1 - nulls / total), 1) if total > 0 else 100
        col_null_rates = {col: round(float(df[col].isna().mean() * 100), 1) for col in df.columns if df[col].isna().any()}
        issues = [f"Column '{col}' is {rate}% null" for col, rate in sorted(col_null_rates.items(), key=lambda x: -x[1]) if rate > 5]
        return DQDimension(name="Completeness", score=score, weight=self.WEIGHTS["Completeness"], details={"null_count": nulls, "total_cells": total, "null_rate_pct": round(100 - score, 1), "columns_with_nulls": col_null_rates}, issues=issues)

    def _validity(self, df: pd.DataFrame, expected_schema: dict[str, str]) -> DQDimension:
        issues = []
        type_mismatches = 0
        total_checks = 0
        for col, expected_type in expected_schema.items():
            if col not in df.columns:
                issues.append(f"Column '{col}' missing from dataset")
                continue
            total_checks += 1
            try:
                if expected_type == "numeric":
                    invalid = pd.to_numeric(df[col], errors="coerce").isna() & df[col].notna()
                elif expected_type == "date":
                    invalid = pd.to_datetime(df[col], errors="coerce").isna() & df[col].notna()
                elif expected_type == "boolean":
                    invalid = ~df[col].isin([True, False, 0, 1, "true", "false", "TRUE", "FALSE"]) if df[col].dtype == "object" else pd.Series([False] * len(df))
                else:
                    continue
                type_mismatches += int(invalid.sum())
                if invalid.any():
                    issues.append(f"Column '{col}': {int(invalid.sum())} values don't match expected type '{expected_type}'")
            except Exception:
                pass
        total_records = total_checks * len(df)
        score = round(100 * (1 - type_mismatches / max(total_records, 1)), 1) if total_records > 0 else 100
        return DQDimension(name="Validity", score=score, weight=self.WEIGHTS["Validity"], details={"type_mismatches": type_mismatches, "columns_checked": total_checks, "expected_schema": expected_schema}, issues=issues[:10])

    def _uniqueness(self, df: pd.DataFrame) -> DQDimension:
        issues = []
        total_dupes = 0
        for col in df.select_dtypes(include=["object", "category"]).columns:
            dupes = int(df[col].duplicated().sum())
            total_dupes += dupes
            if dupes > len(df) * 0.5:
                issues.append(f"Column '{col}' has {dupes}/{len(df)} duplicates ({round(100*dupes/len(df), 1)}%)")
        full_dupes = int(df.duplicated().sum())
        score = round(100 * (1 - max(total_dupes, full_dupes * len(df.columns)) / max(len(df) * len(df.columns), 1)), 1)
        return DQDimension(name="Uniqueness", score=score, weight=self.WEIGHTS["Uniqueness"], details={"total_duplicate_values": total_dupes, "full_duplicate_rows": full_dupes, "total_rows": len(df)}, issues=issues[:5])

    def _timeliness(self, df: pd.DataFrame, last_updated: Optional[datetime] = None) -> DQDimension:
        issues = []
        date_cols = [col for col in df.columns if "date" in col.lower() or "timestamp" in col.lower()]
        staleness_days = 0
        if last_updated:
            staleness_days = (datetime.now(timezone.utc) - last_updated).days
            if staleness_days > 30:
                issues.append(f"Data is {staleness_days} days stale (last updated: {last_updated.date()})")
        if date_cols:
            for col in date_cols[:3]:
                try:
                    dates = pd.to_datetime(df[col], errors="coerce")
                    max_date = dates.max()
                    if pd.notna(max_date):
                        days_behind = (datetime.now(timezone.utc) - max_date).days
                        if days_behind > 90:
                            issues.append(f"Column '{col}' most recent date is {days_behind} days ago ({max_date.date()})")
                except Exception:
                    pass
        score = max(0, 100 - staleness_days * 2) if staleness_days > 7 else 100
        return DQDimension(name="Timeliness", score=score, weight=self.WEIGHTS["Timeliness"], details={"staleness_days": staleness_days, "last_updated": last_updated.isoformat() if last_updated else None, "date_columns_found": len(date_cols)}, issues=issues[:5])

    def _consistency(self, df: pd.DataFrame) -> DQDimension:
        issues = []
        for col in df.select_dtypes(include=["object"]).columns:
            unique_vals = df[col].dropna().unique()
            if len(unique_vals) <= 20 and len(unique_vals) > 1:
                lower = set(str(v).lower().strip() for v in unique_vals)
                if len(lower) < len(unique_vals) * 0.8:
                    issues.append(f"Column '{col}' has case/whitespace inconsistencies among {len(unique_vals)} unique values")
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) >= 2:
            for i in range(min(3, len(numeric_cols))):
                for j in range(i + 1, min(4, len(numeric_cols))):
                    ci, cj = numeric_cols[i], numeric_cols[j]
                    corr = df[[ci, cj]].dropna().corr().iloc[0, 1]
                    if abs(corr) > 0.99 and corr < 1:
                        issues.append(f"Columns '{ci}' and '{cj}' are near-perfectly correlated (r={corr:.3f}), may be redundant")
        score = max(0, 100 - len(issues) * 10)
        return DQDimension(name="Consistency", score=score, weight=self.WEIGHTS["Consistency"], details={"inconsistencies_found": len(issues), "columns_analyzed": len(df.columns)}, issues=issues[:5])

    def _accuracy(self, df: pd.DataFrame, reference_df: Optional[pd.DataFrame] = None) -> DQDimension:
        issues = []
        if reference_df is not None and len(reference_df) > 0:
            overlap_cols = [c for c in df.columns if c in reference_df.columns]
            if overlap_cols:
                merged = df.merge(reference_df, on=overlap_cols[:3], how="inner", suffixes=("_a", "_b"), indicator=True)
                only_left = int((merged["_merge"] == "left_only").sum())
                only_right = int((merged["_merge"] == "right_only").sum())
                match_rate = 1 - (only_left + only_right) / max(len(merged), 1)
                score = round(match_rate * 100, 1)
                if only_left > 0:
                    issues.append(f"{only_left} records in main not in reference")
                if only_right > 0:
                    issues.append(f"{only_right} records in reference not in main")
                return DQDimension(name="Accuracy", score=score, weight=self.WEIGHTS["Accuracy"], details={"match_rate_pct": score, "main_records": len(df), "ref_records": len(reference_df), "overlap_columns": overlap_cols[:5]}, issues=issues[:5])
        balance_cols = [c for c in df.columns if "balance" in c.lower() or "total" in c.lower()]
        for col in balance_cols[:3]:
            neg_count = int((df[col] < 0).sum())
            if neg_count > len(df) * 0.1:
                issues.append(f"Column '{col}' has {neg_count}/{len(df)} negative values ({round(100*neg_count/len(df),1)}%)")
        score = max(50, 100 - len(issues) * 15)
        return DQDimension(name="Accuracy", score=score, weight=self.WEIGHTS["Accuracy"], details={"no_reference": reference_df is None, "negative_value_columns": balance_cols[:3]}, issues=issues[:5])

    def _grade(self, score: float) -> str:
        if score >= 95: return "A"
        if score >= 85: return "B"
        if score >= 70: return "C"
        if score >= 50: return "D"
        return "F"

    def infer_quality_rules(self, df: pd.DataFrame) -> list[dict]:
        rules = []
        for col in df.columns:
            if df[col].isna().sum() == 0:
                rules.append({"type": "not_null", "column": col, "confidence": "high"})
            if df[col].dtype == "object" and df[col].nunique() == len(df):
                rules.append({"type": "unique", "column": col, "confidence": "high"})
            if pd.api.types.is_numeric_dtype(df[col]):
                lo = float(df[col].min())
                hi = float(df[col].max())
                rules.append({"type": "range", "column": col, "params": {"min": round(lo, 2), "max": round(hi, 2)}, "confidence": "medium"})
        return rules

    def check_balance_sheet(self, assets: float, liabilities: float, equity: float, tolerance: float = 0.01) -> dict:
        diff = abs(assets - (liabilities + equity))
        max_val = max(abs(assets), abs(liabilities + equity), 1)
        error_pct = diff / max_val
        return {"accounting_equation_holds": error_pct < tolerance, "assets": assets, "liabilities_plus_equity": liabilities + equity, "difference": round(diff, 2), "error_pct": round(error_pct * 100, 4), "recommendation": "OK" if error_pct < tolerance else f"Balance sheet off by ${diff:,.2f} ({error_pct*100:.4f}%)"}
