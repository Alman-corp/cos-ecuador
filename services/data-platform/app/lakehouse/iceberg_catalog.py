"""71: Data Lakehouse con Apache Iceberg."""
from __future__ import annotations
from typing import Optional, Any
from datetime import datetime
import pyarrow as pa
from pyiceberg.catalog import load_catalog
from pyiceberg.schema import Schema
from pyiceberg.types import NestedField, StringType, LongType, DoubleType, TimestampType, BooleanType, DateType
from pyiceberg.partitioning import PartitionSpec
import logging
import os
from app.shared.schemas import SchemaEvolution, TableSnapshot

logger = logging.getLogger(__name__)


class IcebergLakehouse:
    def __init__(self, warehouse_path: Optional[str] = None, catalog_type: str = "rest", catalog_uri: Optional[str] = None):
        self.warehouse_path = warehouse_path or os.getenv("ICEBERG_WAREHOUSE", "s3://cos-lakehouse/warehouse")
        catalog_config = {"type": catalog_type, "warehouse": self.warehouse_path}
        if catalog_uri:
            catalog_config["uri"] = catalog_uri
        else:
            catalog_config = {"type": "sql", "uri": f"sqlite:///{os.getenv('ICEBERG_CATALOG_DB', '/tmp/iceberg_catalog.db')}", "warehouse": self.warehouse_path}
        self.catalog = load_catalog("cos", **catalog_config)
        self._ensure_namespace()

    def _ensure_namespace(self):
        for ns in ["cos", "cos.raw", "cos.curated", "cos.analytics"]:
            try:
                self.catalog.create_namespace_if_not_exists(ns)
            except Exception:
                pass

    def create_table(self, full_name: str, schema: Schema, partition_spec: Optional[PartitionSpec] = None, properties: Optional[dict[str, str]] = None):
        default_props = {"format-version": "2", "write.format.default": "parquet", "write.parquet.compression-codec": "zstd", "commit.retry.num-retries": "3"}
        if properties:
            default_props.update(properties)
        try:
            return self.catalog.create_table(identifier=full_name, schema=schema, partition_spec=partition_spec, properties=default_props)
        except Exception as e:
            if "already exists" in str(e).lower():
                return self.catalog.load_table(full_name)
            raise

    def append_data(self, full_name: str, data: pa.Table, snapshot_properties: Optional[dict[str, str]] = None):
        table = self.catalog.load_table(full_name)
        with table.transaction() as tx:
            tx.append(data, snapshot_properties=snapshot_properties or {})

    def overwrite_data(self, full_name: str, data: pa.Table, filter_expr: Optional[Any] = None):
        table = self.catalog.load_table(full_name)
        with table.transaction() as tx:
            if filter_expr is not None:
                tx.overwrite(data, overwrite_filter=filter_expr)
            else:
                tx.overwrite(data)

    def evolve_schema(self, full_name: str, evolution: SchemaEvolution) -> dict[str, Any]:
        table = self.catalog.load_table(full_name)
        changes = []
        with table.update_schema() as update:
            for col in evolution.added_columns:
                update.add_column(col["name"], self._map_type(col.get("type", "string")), doc=col.get("doc"))
                changes.append(f"Added: {col['name']}")
            for rename in evolution.renamed_columns:
                update.rename_column(rename["from"], rename["to"])
                changes.append(f"Renamed: {rename['from']} -> {rename['to']}")
            for col_name in evolution.removed_columns:
                update.delete_column(col_name)
                changes.append(f"Dropped: {col_name}")
        return {"table": full_name, "changes_applied": changes, "new_schema_version": table.metadata.current_schema_id}

    def list_snapshots(self, full_name: str) -> list[TableSnapshot]:
        table = self.catalog.load_table(full_name)
        snapshots = []
        for snap in table.metadata.snapshots:
            snapshots.append(TableSnapshot(snapshot_id=str(snap.snapshot_id), timestamp=datetime.fromtimestamp(snap.timestamp_ms / 1000), parent_id=str(snap.parent_snapshot_id) if snap.parent_snapshot_id else None, operation=snap.summary.get("operation", "unknown"), manifest_location=snap.manifest_list or "", summary=dict(snap.summary) if snap.summary else {}))
        return sorted(snapshots, key=lambda s: s.timestamp, reverse=True)

    def query_snapshot(self, full_name: str, snapshot_id: Optional[str] = None, as_of_timestamp: Optional[datetime] = None) -> pa.Table:
        table = self.catalog.load_table(full_name)
        if snapshot_id:
            return table.scan(snapshot_id=int(snapshot_id)).to_arrow()
        if as_of_timestamp:
            snapshots = self.list_snapshots(full_name)
            target_ts = as_of_timestamp.timestamp()
            best = min((s for s in snapshots if s.timestamp.timestamp() <= target_ts), key=lambda s: abs(s.timestamp.timestamp() - target_ts), default=None)
            if best:
                return table.scan(snapshot_id=int(best.snapshot_id)).to_arrow()
            raise ValueError(f"No snapshot found before {as_of_timestamp}")
        return table.scan().to_arrow()

    def _map_type(self, type_str: str):
        mapping = {"string": StringType(), "long": LongType(), "int": LongType(), "double": DoubleType(), "float": DoubleType(), "timestamp": TimestampType(), "boolean": BooleanType(), "date": DateType()}
        return mapping.get(type_str.lower(), StringType())


FINANCIAL_STATEMENT_SCHEMA = Schema(
    NestedField(1, "entity_id", StringType(), required=True),
    NestedField(2, "reporting_date", DateType(), required=True),
    NestedField(3, "gaap_standard", StringType(), required=True),
    NestedField(4, "currency", StringType(), required=True),
    NestedField(5, "account_code", StringType(), required=True),
    NestedField(6, "account_name", StringType(), required=True),
    NestedField(7, "amount", DoubleType(), required=True),
    NestedField(8, "amount_usd", DoubleType(), required=False),
    NestedField(9, "is_pii", BooleanType(), required=False),
    NestedField(10, "dq_score", DoubleType(), required=False),
    NestedField(11, "ingested_at", TimestampType(), required=True),
    NestedField(12, "source_system", StringType(), required=False),
)

TRANSACTION_SCHEMA = Schema(
    NestedField(1, "transaction_id", StringType(), required=True),
    NestedField(2, "entity_id", StringType(), required=True),
    NestedField(3, "transaction_date", DateType(), required=True),
    NestedField(4, "description", StringType(), required=True),
    NestedField(5, "counterparty", StringType(), required=False),
    NestedField(6, "amount", DoubleType(), required=True),
    NestedField(7, "currency", StringType(), required=True),
    NestedField(8, "category", StringType(), required=False),
    NestedField(9, "subcategory", StringType(), required=False),
    NestedField(10, "pii_detected", BooleanType(), required=False),
    NestedField(11, "ingested_at", TimestampType(), required=True),
)
