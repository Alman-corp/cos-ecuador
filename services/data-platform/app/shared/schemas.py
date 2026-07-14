from __future__ import annotations
from typing import Literal, Optional, Any
from pydantic import BaseModel, Field
from datetime import date, datetime
from enum import Enum


class GAAPStandard(str, Enum):
    IFRS = "IFRS"
    US_GAAP = "US_GAAP"
    ECUADOR_LOCAL = "EC_LOCAL"
    COLOMBIA_LOCAL = "CO_LOCAL"
    MEXICO_LOCAL = "MX_LOCAL"


class CurrencyCode(str, Enum):
    USD = "USD"
    EUR = "EUR"
    MXN = "MXN"
    COP = "COP"
    PEN = "PEN"
    CLP = "CLP"
    BRL = "BRL"
    ARS = "ARS"


class TimeTravelQuery(BaseModel):
    table_name: str
    as_of_timestamp: Optional[datetime] = None
    as_of_version: Optional[int] = None
    snapshot_id: Optional[str] = None
    filters: Optional[dict[str, Any]] = None


class TableSnapshot(BaseModel):
    snapshot_id: str
    timestamp: datetime
    parent_id: Optional[str] = None
    operation: str
    manifest_location: str
    summary: dict[str, str]


class SchemaEvolution(BaseModel):
    table_name: str
    added_columns: list[dict[str, str]] = Field(default_factory=list)
    removed_columns: list[str] = Field(default_factory=list)
    renamed_columns: list[dict[str, str]] = Field(default_factory=list)
    type_changes: list[dict[str, str]] = Field(default_factory=list)


class QualityRule(BaseModel):
    name: str
    type: Literal["not_null", "unique", "range", "regex", "custom"]
    column: Optional[str] = None
    params: dict[str, Any] = Field(default_factory=dict)
    severity: Literal["critical", "warning", "info"] = "warning"


class SLASpec(BaseModel):
    freshness_hours: float = 24.0
    availability_pct: float = 99.9
    max_latency_seconds: float = 60.0


class DataContract(BaseModel):
    name: str
    version: str
    owner: str
    description: str
    schema_spec: dict[str, Any]
    quality_rules: list[QualityRule] = Field(default_factory=list)
    sla: SLASpec = Field(default_factory=lambda: SLASpec())
    producer: str
    consumers: list[str] = Field(default_factory=list)
    pii_fields: list[str] = Field(default_factory=list)


class ContractValidationResult(BaseModel):
    contract_name: str
    validated_at: datetime
    is_valid: bool
    failed_rules: list[dict[str, Any]]
    passed_rules_count: int
    total_rules_count: int
    freshness_ok: bool
    schema_ok: bool
    dq_score: float


class PIIEntity(BaseModel):
    entity_type: str
    start: int
    end: int
    text: str
    score: float
    country: Optional[str] = None


class PIIDetectionResult(BaseModel):
    entities: list[PIIEntity]
    total_count: int
    high_confidence_count: int
    by_type: dict[str, int]
    redacted_text: Optional[str] = None


class RedactionPolicy(BaseModel):
    strategy: Literal["mask", "hash", "replace", "redact", "pseudonymize"]
    entity_types: list[str] = Field(default_factory=lambda: ["PERSON", "EMAIL", "PHONE", "TAX_ID", "CREDIT_CARD"])
    mask_char: str = "*"
    replacement: str = "[REDACTED]"


class Transaction(BaseModel):
    id: str
    date: date
    description: str
    amount: float
    currency: CurrencyCode = CurrencyCode.USD
    counterparty: Optional[str] = None
    raw_category: Optional[str] = None


class CategorizedTransaction(Transaction):
    predicted_category: str
    confidence: float
    subcategory: Optional[str] = None
    is_training_candidate: bool = False


class CategoryTrainingExample(BaseModel):
    description: str
    counterparty: Optional[str] = None
    amount: float
    category: str
    subcategory: Optional[str] = None


class DataSourceRef(BaseModel):
    type: Literal["table", "query", "api"]
    location: str
    filters: Optional[dict[str, Any]] = None


class ReconciliationSpec(BaseModel):
    name: str
    source_a: DataSourceRef
    source_b: DataSourceRef
    match_keys: list[str]
    value_columns: list[str]
    tolerance_pct: float = 0.01
    tolerance_abs: Optional[float] = None


class MismatchRecord(BaseModel):
    key_values: dict[str, Any]
    column: str
    value_a: Any
    value_b: Any
    diff: float
    diff_pct: float


class ReconciliationResult(BaseModel):
    spec_name: str
    executed_at: datetime
    status: Literal["matched", "mismatched", "error"]
    total_records_a: int
    total_records_b: int
    matched_records: int
    mismatched_records: int
    only_in_a: int
    only_in_b: int
    mismatches: list[MismatchRecord]
    summary: str


class FXConversion(BaseModel):
    amount: float
    from_currency: CurrencyCode
    to_currency: CurrencyCode = CurrencyCode.USD
    as_of_date: date
    rate: Optional[float] = None
    rate_source: Optional[str] = None


class FXConversionResult(BaseModel):
    original_amount: float
    original_currency: CurrencyCode
    converted_amount: float
    target_currency: CurrencyCode
    rate_used: float
    rate_date: date
    rate_source: str
    historical_volatility_30d: Optional[float] = None


class InflationAdjustment(BaseModel):
    amount: float
    currency: CurrencyCode
    original_date: date
    target_date: date = Field(default_factory=date.today)
    index: Literal["CPI", "PPI", "GDP_deflator"] = "CPI"


class InflationResult(BaseModel):
    nominal_amount: float
    real_amount: float
    cumulative_inflation_pct: float
    original_date: date
    target_date: date
    index_used: str
    base_year: int


class GAAPConversionRequest(BaseModel):
    entity_id: str
    financials: dict[str, Any]
    source_gaap: GAAPStandard
    target_gaap: GAAPStandard
    reporting_date: date


class GAAPAdjustment(BaseModel):
    account: str
    original_value: float
    adjusted_value: float
    adjustment_amount: float
    reason: str
    gaap_reference: str


class GAAPConversionResult(BaseModel):
    entity_id: str
    source_gaap: GAAPStandard
    target_gaap: GAAPStandard
    original_financials: dict[str, float]
    adjusted_financials: dict[str, float]
    adjustments: list[GAAPAdjustment]
    total_adjustment_impact: float
    reconciliation_notes: list[str]


class DQDimension(BaseModel):
    name: str
    score: float
    weight: float
    details: dict[str, Any] = Field(default_factory=dict)
    issues: list[str] = Field(default_factory=list)


class DQScore(BaseModel):
    entity_id: Optional[str] = None
    table_name: Optional[str] = None
    evaluated_at: datetime
    overall_score: float
    grade: Literal["A", "B", "C", "D", "F"]
    dimensions: list[DQDimension]
    row_count: int
    critical_issues: list[str]
    recommendations: list[str]
    is_trustworthy: bool
