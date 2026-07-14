"""75: Auto-categorización de transacciones con ML (scikit-learn GBM)."""
from __future__ import annotations
import re
import joblib
from pathlib import Path
from typing import Optional
import numpy as np
import logging

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.pipeline import Pipeline
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

from app.shared.schemas import Transaction, CategorizedTransaction, CategoryTrainingExample

logger = logging.getLogger(__name__)

CATEGORIES = {
    "revenue": {"name": "Ingresos", "subcategories": ["sales", "services", "interest_income", "other_income"], "keywords": ["venta", "factura", "pago recibido", "ingreso", "invoice"]},
    "cogs": {"name": "Costo de Ventas", "subcategories": ["raw_materials", "direct_labor", "manufacturing"], "keywords": ["materia prima", "producción", "manufactura"]},
    "payroll": {"name": "Nómina", "subcategories": ["salaries", "benefits", "social_security", "bonuses"], "keywords": ["nómina", "sueldo", "salario", "seguro social"]},
    "rent": {"name": "Arriendos", "subcategories": ["office", "equipment", "vehicles"], "keywords": ["arriendo", "alquiler", "renta", "leasing"]},
    "utilities": {"name": "Servicios Básicos", "subcategories": ["electricity", "water", "internet", "phone"], "keywords": ["luz", "agua", "internet", "teléfono", "electricidad"]},
    "taxes": {"name": "Impuestos", "subcategories": ["iva", "income_tax", "withholding", "municipal"], "keywords": ["sri", "iva", "impuesto", "renta", "retención"]},
    "marketing": {"name": "Marketing", "subcategories": ["digital", "events", "advertising", "branding"], "keywords": ["publicidad", "marketing", "google ads", "facebook"]},
    "professional_services": {"name": "Servicios Profesionales", "subcategories": ["legal", "accounting", "consulting", "audit"], "keywords": ["honorarios", "abogado", "contador", "auditor"]},
    "travel": {"name": "Viáticos", "subcategories": ["flights", "hotels", "meals", "transportation"], "keywords": ["vuelo", "hotel", "viático", "pasaje"]},
    "financial": {"name": "Financieros", "subcategories": ["interest", "bank_fees", "fx_gains_losses"], "keywords": ["interés", "comisión bancaria", "transferencia"]},
    "capex": {"name": "Inversión en Activos", "subcategories": ["equipment", "software", "real_estate", "vehicles"], "keywords": ["maquinaria", "equipo", "software", "inmueble"]},
    "insurance": {"name": "Seguros", "subcategories": ["liability", "property", "health", "life"], "keywords": ["seguro", "póliza", "aseguradora"]},
    "other": {"name": "Otros", "subcategories": ["misc"], "keywords": []},
}


class TransactionClassifier:
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or Path("ml_models/transaction_classifier.joblib")
        self.pipeline: Optional[Pipeline] = None
        self._load_or_init()

    def _load_or_init(self):
        if self.model_path.exists():
            try:
                self.pipeline = joblib.load(self.model_path)
            except Exception as e:
                logger.warning(f"Failed to load model: {e}")

    def train(self, examples: list[CategoryTrainingExample], test_size: float = 0.2) -> dict:
        if not SKLEARN_AVAILABLE:
            raise RuntimeError("scikit-learn not available")
        if len(examples) < 50:
            raise ValueError(f"Need at least 50 examples, got {len(examples)}")
        import pandas as pd
        df = pd.DataFrame({"desc": [self._normalize_text(e.description) for e in examples], "counterparty": [self._normalize_text(e.counterparty or "") for e in examples], "amount": [e.amount for e in examples], "amount_sign": [np.sign(e.amount) for e in examples], "amount_log": [np.log1p(abs(e.amount)) for e in examples], "label": [e.category for e in examples]})
        preprocessor = ColumnTransformer(transformers=[("desc_tfidf", TfidfVectorizer(max_features=5000, ngram_range=(1, 2)), "desc"), ("cp_tfidf", TfidfVectorizer(max_features=2000), "counterparty"), ("amount", StandardScaler(), ["amount"]), ("amount_sign", "passthrough", ["amount_sign"]), ("amount_log", "passthrough", ["amount_log"])])
        X_train, X_test, y_train, y_test = train_test_split(df.drop("label", axis=1), df["label"], test_size=test_size, random_state=42, stratify=df["label"])
        self.pipeline = Pipeline([("preprocessor", preprocessor), ("classifier", GradientBoostingClassifier(n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42))])
        self.pipeline.fit(X_train, y_train)
        y_pred = self.pipeline.predict(X_test)
        accuracy = float(np.mean(y_pred == y_test))
        report = classification_report(y_test, y_pred, output_dict=True)
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.pipeline, self.model_path)
        return {"accuracy": accuracy, "n_train": len(X_train), "n_test": len(X_test), "n_classes": len(set(df["label"])), "classification_report": report, "model_saved_to": str(self.model_path)}

    def predict(self, transaction: Transaction, threshold: float = 0.6) -> CategorizedTransaction:
        if self.pipeline is None:
            return self._rule_based_predict(transaction)
        import pandas as pd
        X = pd.DataFrame([{"desc": self._normalize_text(transaction.description), "counterparty": self._normalize_text(transaction.counterparty or ""), "amount": transaction.amount, "amount_sign": np.sign(transaction.amount), "amount_log": np.log1p(abs(transaction.amount))}])
        probas = self.pipeline.predict_proba(X)[0]
        classes = self.pipeline.classes_
        top_idx = int(np.argmax(probas))
        confidence = float(probas[top_idx])
        predicted = classes[top_idx]
        subcategory = CATEGORIES[predicted]["subcategories"][0] if predicted in CATEGORIES and CATEGORIES[predicted]["subcategories"] else None
        return CategorizedTransaction(**transaction.model_dump(), predicted_category=predicted, confidence=confidence, subcategory=subcategory, is_training_candidate=confidence < threshold)

    def batch_predict(self, transactions: list[Transaction], threshold: float = 0.6) -> list[CategorizedTransaction]:
        return [self.predict(t, threshold) for t in transactions]

    def _rule_based_predict(self, transaction: Transaction) -> CategorizedTransaction:
        combined = f"{transaction.description.lower()} {(transaction.counterparty or '').lower()}"
        best_category = "other"
        best_score = 0
        for category, info in CATEGORIES.items():
            score = sum(1 for kw in info["keywords"] if kw in combined)
            if score > best_score:
                best_score = score
                best_category = category
        confidence = min(0.9, best_score * 0.2) if best_score > 0 else 0.3
        return CategorizedTransaction(**transaction.model_dump(), predicted_category=best_category, confidence=confidence, subcategory=CATEGORIES[best_category]["subcategories"][0] if best_category in CATEGORIES else None, is_training_candidate=confidence < 0.6)

    def _normalize_text(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r"\d+", " NUM ", text)
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def suggest_labeling_candidates(self, transactions: list[Transaction], top_n: int = 100) -> list[Transaction]:
        scored = []
        for t in transactions:
            pred = self.predict(t)
            priority = (1 - pred.confidence) * np.log1p(abs(t.amount))
            scored.append((priority, t))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [t for _, t in scored[:top_n]]
