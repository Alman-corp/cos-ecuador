from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional
from datetime import date
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import DBSCAN
import logging

from app.shared import AnomalySpec, AnomalyResult, AnomalyRecord

logger = logging.getLogger(__name__)


class AnomalyDetectionEngine:
    def detect(self, df: pd.DataFrame, spec: AnomalySpec) -> AnomalyResult:
        all_anomalies = []
        method_agreement = {}
        normal_baseline = {}

        for column in spec.columns:
            if column not in df.columns:
                continue
            series = df[[column]].dropna()
            if len(series) < 30:
                continue

            baseline = {
                "mean": float(series[column].mean()), "std": float(series[column].std()),
                "median": float(series[column].median()), "p5": float(np.percentile(series[column], 5)),
                "p95": float(np.percentile(series[column], 95)),
            }
            normal_baseline[column] = baseline

            col_anomalies = {}
            for method in spec.methods:
                try:
                    col_anomalies[method] = self._apply(df, column, method, spec.contamination)
                    method_agreement[method] = method_agreement.get(method, 0) + len(col_anomalies[method])
                except Exception as e:
                    logger.error(f"Method {method} failed for {column}: {e}")
                    col_anomalies[method] = []

            date_to_methods = {}
            date_to_vals = {}
            for method, anomalies in col_anomalies.items():
                for a in anomalies:
                    key = a["date"]
                    if key not in date_to_methods:
                        date_to_methods[key] = []
                        date_to_vals[key] = a
                    date_to_methods[key].append(method)

            for dt, methods in date_to_methods.items():
                v = date_to_vals[dt]
                z = (v["observed"] - baseline["mean"]) / (baseline["std"] + 1e-6)
                abs_z = abs(z)
                severity = "critical" if abs_z > 4 or len(methods) >= 3 else ("high" if abs_z > 3 or len(methods) >= 2 else ("medium" if abs_z > 2 else "low"))
                cause = self._infer_cause(column, v["observed"], baseline, z)

                all_anomalies.append(AnomalyRecord(
                    date=dt, column=column, observed=float(v["observed"]), expected=float(baseline["mean"]),
                    z_score=float(z), anomaly_score=float(v.get("score", abs_z)),
                    methods_detecting=methods, probable_cause=cause, severity=severity,
                ))

        consensus = [a for a in all_anomalies if len(a.methods_detecting) >= 2]
        return AnomalyResult(
            anomalies=sorted(all_anomalies, key=lambda x: x.anomaly_score, reverse=True),
            normal_baseline=normal_baseline, method_agreement=method_agreement,
            consensus_anomalies=consensus,
        )

    def _apply(self, df: pd.DataFrame, column: str, method: str, contamination: float) -> list[dict]:
        if method == "isolation_forest":
            return self._iforest(df, column, contamination)
        elif method == "lstm":
            return self._lstm(df, column, contamination)
        elif method == "zscore":
            return self._zscore(df, column, 3.0)
        elif method == "dbscan":
            return self._dbscan(df, column)
        return []

    def _iforest(self, df: pd.DataFrame, column: str, contamination: float) -> list[dict]:
        s = df[[column]].dropna().copy()
        s["lag1"] = s[column].shift(1)
        s["lag7"] = s[column].shift(7)
        s["rm7"] = s[column].rolling(7).mean()
        s["rs7"] = s[column].rolling(7).std()
        s["chg"] = s[column].pct_change()
        f = s.dropna()
        if len(f) < 20:
            return []
        X = StandardScaler().fit_transform(f.drop(columns=[column]).values)
        model = IsolationForest(contamination=contamination, random_state=42, n_estimators=200)
        model.fit(X)
        preds = model.predict(X)
        scores = model.decision_function(X)
        anomalies = []
        for i, (p, sc) in enumerate(zip(preds, scores)):
            if p == -1:
                idx = f.index[i]
                anomalies.append({"date": idx if "date" not in df.columns else df.loc[idx, "date"], "observed": float(f.loc[idx, column]), "score": float(-sc)})
        return anomalies

    def _lstm(self, df: pd.DataFrame, column: str, contamination: float) -> list[dict]:
        try:
            import torch
            import torch.nn as nn
        except ImportError:
            return []
        series = df[[column]].dropna().values.flatten()
        if len(series) < 50:
            return []
        scaler = StandardScaler()
        s = scaler.fit_transform(series.reshape(-1, 1)).flatten()
        ws = 12
        seqs = np.array([s[i:i + ws] for i in range(len(s) - ws)])
        if len(seqs) < 10:
            return []

        class Autoencoder(nn.Module):
            def __init__(self):
                super().__init__()
                self.enc = nn.LSTM(1, 32, batch_first=True)
                self.dec = nn.LSTM(32, 1, batch_first=True)
            def forward(self, x):
                _, (h, _) = self.enc(x)
                d_in = h[-1].unsqueeze(1).repeat(1, x.size(1), 1)
                out, _ = self.dec(d_in)
                return out

        model = Autoencoder()
        crit = nn.MSELoss(reduction="none")
        opt = torch.optim.Adam(model.parameters(), lr=0.001)
        X_t = torch.FloatTensor(seqs).unsqueeze(-1)

        model.train()
        for _ in range(50):
            opt.zero_grad()
            out = model(X_t)
            loss = crit(out, X_t).mean()
            loss.backward()
            opt.step()

        model.eval()
        with torch.no_grad():
            recon = model(X_t)
            errors = crit(recon, X_t).mean(dim=(1, 2)).numpy()

        threshold = np.percentile(errors, (1 - contamination) * 100)
        anomalies = []
        for i, err in enumerate(errors):
            if err > threshold:
                idx = i + ws
                if idx < len(df):
                    anomalies.append({"date": df.iloc[idx]["date"] if "date" in df.columns else idx, "observed": float(series[idx]), "score": float(err / threshold)})
        return anomalies

    def _zscore(self, df: pd.DataFrame, column: str, threshold: float = 3.0) -> list[dict]:
        s = df[[column]].dropna()
        vals = s[column].values
        med = np.median(vals)
        mad = np.median(np.abs(vals - med)) * 1.4826
        anomalies = []
        for idx, val in enumerate(vals):
            if mad > 0 and abs((val - med) / mad) > threshold:
                anomalies.append({"date": df.iloc[idx]["date"] if "date" in df.columns else idx, "observed": float(val), "score": float(abs((val - med) / mad))})
        return anomalies

    def _dbscan(self, df: pd.DataFrame, column: str) -> list[dict]:
        s = df[[column]].dropna()
        if len(s) < 20:
            return []
        s["lag1"] = s[column].shift(1)
        s["chg"] = s[column].diff()
        f = s.dropna()
        if len(f) < 10:
            return []
        X = StandardScaler().fit_transform(f[[column, "chg"]].values)
        labels = DBSCAN(eps=0.5, min_samples=5).fit_predict(X)
        anomalies = []
        for i, label in enumerate(labels):
            if label == -1:
                idx = f.index[i]
                anomalies.append({"date": df.loc[idx, "date"] if "date" in df.columns else idx, "observed": float(f.loc[idx, column]), "score": 1.0})
        return anomalies

    def _infer_cause(self, column: str, observed: float, baseline: dict, z: float) -> Optional[str]:
        direction = "alto" if z > 0 else "bajo"
        mag = abs(z)
        cl = column.lower()
        if any(k in cl for k in ["revenue", "sales", "income"]):
            return f"Posible pico de ventas estacional ({mag:.1f}sigma)" if z > 0 else f"Caida anomala en ingresos ({mag:.1f}sigma)"
        if any(k in cl for k in ["expense", "cost", "spend"]):
            return f"Gasto inusual ({mag:.1f}sigma)" if z > 0 else "Gasto inusualmente bajo"
        if any(k in cl for k in ["margin", "profit"]):
            return f"Margen anomalo ({direction}, {mag:.1f}sigma)"
        return f"Valor anomalo ({direction}, {mag:.1f}sigma)"
