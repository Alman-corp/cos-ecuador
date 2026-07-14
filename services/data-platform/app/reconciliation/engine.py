"""76: Reconciliation Engine — detecta inconsistencias entre sistemas."""
from __future__ import annotations
from typing import Optional, Any
from datetime import datetime
import pandas as pd
import numpy as np
import logging
from app.shared.schemas import ReconciliationSpec, ReconciliationResult, MismatchRecord, DataSourceRef

logger = logging.getLogger(__name__)


class ReconciliationEngine:
    def __init__(self, db_connector=None):
        self.db_connector = db_connector

    def reconcile(self, spec: ReconciliationSpec) -> ReconciliationResult:
        try:
            df_a = self._load_source(spec.source_a)
            df_b = self._load_source(spec.source_b)
            for key in spec.match_keys:
                if key in df_a.columns and key in df_b.columns:
                    df_a[key] = df_a[key].astype(str)
                    df_b[key] = df_b[key].astype(str)
            merged = pd.merge(df_a, df_b, on=spec.match_keys, how="outer", suffixes=("_a", "_b"), indicator=True)
            only_in_a = int((merged["_merge"] == "left_only").sum())
            only_in_b = int((merged["_merge"] == "right_only").sum())
            matched = int((merged["_merge"] == "both").sum())
            mismatches = []
            matched_df = merged[merged["_merge"] == "both"]
            for col in spec.value_columns:
                col_a = f"{col}_a"
                col_b = f"{col}_b"
                if col_a not in matched_df.columns or col_b not in matched_df.columns:
                    continue
                val_a = pd.to_numeric(matched_df[col_a], errors="coerce")
                val_b = pd.to_numeric(matched_df[col_b], errors="coerce")
                diff_abs = (val_a - val_b).abs()
                diff_pct = diff_abs / val_a.replace(0, np.nan).abs()
                is_mismatch = pd.Series(False, index=matched_df.index)
                if spec.tolerance_abs is not None:
                    is_mismatch |= diff_abs > spec.tolerance_abs
                else:
                    is_mismatch |= diff_pct > spec.tolerance_pct
                both_nan = val_a.isna() & val_b.isna()
                is_mismatch &= ~both_nan
                for _, row in matched_df[is_mismatch].iterrows():
                    key_vals = {k: row[k] for k in spec.match_keys}
                    va, vb = row[col_a], row[col_b]
                    try:
                        d = float(vb) - float(va)
                        dp = (d / float(va) * 100) if float(va) != 0 else 0
                    except (ValueError, TypeError):
                        d, dp = 0, 0
                    mismatches.append(MismatchRecord(key_values=key_vals, column=col, value_a=None if pd.isna(va) else va, value_b=None if pd.isna(vb) else vb, diff=round(d, 2), diff_pct=round(dp, 2)))
            status = "matched" if (len(mismatches) == 0 and only_in_a == 0 and only_in_b == 0) else "mismatched"
            summary = self._generate_summary(spec.name, len(df_a), len(df_b), matched, len(mismatches), only_in_a, only_in_b)
            return ReconciliationResult(spec_name=spec.name, executed_at=datetime.utcnow(), status=status, total_records_a=len(df_a), total_records_b=len(df_b), matched_records=matched, mismatched_records=len(set((str(m.key_values), m.column) for m in mismatches)), only_in_a=only_in_a, only_in_b=only_in_b, mismatches=sorted(mismatches, key=lambda m: abs(m.diff), reverse=True)[:100], summary=summary)
        except Exception as e:
            return ReconciliationResult(spec_name=spec.name, executed_at=datetime.utcnow(), status="error", total_records_a=0, total_records_b=0, matched_records=0, mismatched_records=0, only_in_a=0, only_in_b=0, mismatches=[], summary=f"Error: {str(e)}")

    def _load_source(self, source: DataSourceRef) -> pd.DataFrame:
        if source.type in ("table", "query"):
            if self.db_connector is None:
                raise ValueError("DB connector not configured")
            return pd.read_sql(source.location, self.db_connector)
        if source.type == "api":
            import requests
            resp = requests.get(source.location, params=source.filters)
            resp.raise_for_status()
            return pd.DataFrame(resp.json())
        raise ValueError(f"Unknown source type: {source.type}")

    def _generate_summary(self, name: str, total_a: int, total_b: int, matched: int, mismatches: int, only_a: int, only_b: int) -> str:
        if mismatches == 0 and only_a == 0 and only_b == 0:
            return f"OK Reconciliation '{name}': {matched} records match between {total_a} and {total_b} records."
        parts = [f"ISSUES in '{name}':"]
        if mismatches > 0: parts.append(f"- {mismatches} records with value differences")
        if only_a > 0: parts.append(f"- {only_a} records only in source A")
        if only_b > 0: parts.append(f"- {only_b} records only in source B")
        return "\n".join(parts)
