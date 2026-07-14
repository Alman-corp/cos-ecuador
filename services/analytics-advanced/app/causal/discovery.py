from __future__ import annotations
import numpy as np
import pandas as pd
from typing import Optional
import logging

from app.shared import CausalGraph

logger = logging.getLogger(__name__)


class CausalDiscoveryEngine:
    def __init__(self):
        self.discovered_graph = None

    def discover(self, df: pd.DataFrame, columns: Optional[list[str]] = None,
                 algorithm: str = "pc", alpha: float = 0.05, max_depth: int = 5) -> CausalGraph:
        if columns is None:
            columns = [c for c in df.columns if df[c].dtype in ["float64", "int64"]]

        df_clean = df[columns].dropna()
        if len(df_clean) < 50:
            raise ValueError(f"Insufficient data: {len(df_clean)} rows (need >=50)")

        data = df_clean.values

        try:
            from causallearn.search.ConstraintBased.PC import pc
            cg = pc(data=data, alpha=alpha, stable=True, uc_rule=0, uc_priority=2)
            graph = self._extract_from_matrix(cg.G.graph, columns)
        except Exception:
            graph = self._fallback_correlation(data, columns)

        graph.interpretation = self._generate_interpretation(graph, columns)
        self.discovered_graph = graph
        return graph

    def _extract_from_matrix(self, adj_matrix: np.ndarray, columns: list[str]) -> CausalGraph:
        n_vars = len(columns)
        edges = []
        for i in range(n_vars):
            for j in range(i + 1, n_vars):
                val_ij, val_ji = adj_matrix[i, j], adj_matrix[j, i]
                if val_ij == -1 and val_ji == 1:
                    edges.append({"source": columns[i], "target": columns[j],
                                  "direction": f"{columns[i]} -> {columns[j]}", "direction_confidence": 0.75,
                                  "strength": self._estimate_strength(adj_matrix, i, j)})
                elif val_ij == 1 and val_ji == -1:
                    edges.append({"source": columns[j], "target": columns[i],
                                  "direction": f"{columns[j]} -> {columns[i]}", "direction_confidence": 0.75,
                                  "strength": self._estimate_strength(adj_matrix, j, i)})
                elif val_ij == -1 and val_ji == -1:
                    edges.append({"source": columns[i], "target": columns[j],
                                  "direction": f"{columns[i]} - {columns[j]} (undirected)", "direction_confidence": 0.3,
                                  "strength": self._estimate_strength(adj_matrix, i, j)})
        return CausalGraph(nodes=columns, edges=edges, independent_sets=[], interpretation="")

    def _fallback_correlation(self, data: np.ndarray, columns: list[str]) -> CausalGraph:
        n_vars = len(columns)
        corr = np.corrcoef(data.T)
        edges = []
        for i in range(n_vars):
            for j in range(i + 1, n_vars):
                if abs(corr[i, j]) > 0.3:
                    edges.append({"source": columns[i], "target": columns[j],
                                  "direction": f"{columns[i]} - {columns[j]} (correlacion)",
                                  "direction_confidence": 0.2, "strength": float(abs(corr[i, j]))})
        return CausalGraph(nodes=columns, edges=edges, independent_sets=[],
                           interpretation="(Warning: usando correlacion como proxy)")

    def _estimate_strength(self, mat: np.ndarray, i: int, j: int) -> float:
        return float(abs(np.corrcoef(mat[:, i], mat[:, j])[0, 1])) if isinstance(mat, np.ndarray) and mat.ndim == 2 else 0.5

    def _generate_interpretation(self, graph: CausalGraph, columns: list[str]) -> str:
        if not graph.edges:
            return "No se detectaron relaciones causales significativas."
        in_deg, out_deg = {}, {}
        for e in graph.edges:
            out_deg[e["source"]] = out_deg.get(e["source"], 0) + 1
            in_deg[e["target"]] = in_deg.get(e["target"], 0) + 1
        drivers = sorted(out_deg.items(), key=lambda x: x[1], reverse=True)[:3]
        outcomes = sorted(in_deg.items(), key=lambda x: x[1], reverse=True)[:3]
        parts = [f"Se descubrieron {len(graph.edges)} relaciones causales entre {len(columns)} variables."]
        if drivers:
            parts.append(f"Principales drivers: {', '.join(f'{v} ({c})' for v, c in drivers)}.")
        if outcomes:
            parts.append(f"Variables mas influenciadas: {', '.join(f'{v} ({c})' for v, c in outcomes)}.")
        return " ".join(parts)
