"""72: Time-travel queries sobre Iceberg snapshots."""
from __future__ import annotations
from typing import Optional, Any
from datetime import datetime
import pyarrow as pa
import logging
from app.shared.schemas import TimeTravelQuery, TableSnapshot
from app.lakehouse.iceberg_catalog import IcebergLakehouse

logger = logging.getLogger(__name__)


class TimeTravelEngine:
    def __init__(self, lakehouse: IcebergLakehouse):
        self.lakehouse = lakehouse

    def query(self, request: TimeTravelQuery) -> pa.Table:
        return self.lakehouse.query_snapshot(full_name=request.table_name, snapshot_id=request.snapshot_id, as_of_timestamp=request.as_of_timestamp)

    def diff(self, table_name: str, from_timestamp: datetime, to_timestamp: datetime, key_columns: list[str]) -> dict[str, Any]:
        from_data = self.lakehouse.query_snapshot(table_name, as_of_timestamp=from_timestamp).to_pandas()
        to_data = self.lakehouse.query_snapshot(table_name, as_of_timestamp=to_timestamp).to_pandas()
        from_keys = set(from_data[key_columns].apply(tuple, axis=1))
        to_keys = set(to_data[key_columns].apply(tuple, axis=1))
        added_keys = to_keys - from_keys
        removed_keys = from_keys - to_keys
        common_keys = from_keys & to_keys
        changed_keys = []
        from_idx = from_data.set_index(key_columns)
        to_idx = to_data.set_index(key_columns)
        for key in common_keys:
            try:
                if not from_idx.loc[key].equals(to_idx.loc[key]):
                    changed_keys.append(key)
            except Exception:
                changed_keys.append(key)
        return {"table": table_name, "from_timestamp": from_timestamp.isoformat(), "to_timestamp": to_timestamp.isoformat(), "rows_added": len(added_keys), "rows_removed": len(removed_keys), "rows_changed": len(changed_keys), "total_from": len(from_data), "total_to": len(to_data)}

    def restore(self, table_name: str, target_table: str, as_of_timestamp: datetime) -> dict[str, Any]:
        snapshot_data = self.lakehouse.query_snapshot(table_name, as_of_timestamp=as_of_timestamp)
        source_table = self.lakehouse.catalog.load_table(table_name)
        try:
            self.lakehouse.create_table(full_name=target_table, schema=source_table.schema())
        except Exception as e:
            if "already exists" not in str(e).lower():
                raise
        self.lakehouse.append_data(target_table, snapshot_data, snapshot_properties={"restored-from": table_name, "restored-as-of": as_of_timestamp.isoformat()})
        return {"status": "restored", "source_table": table_name, "target_table": target_table, "as_of": as_of_timestamp.isoformat(), "rows_restored": len(snapshot_data)}

    def audit_log(self, table_name: str, since: Optional[datetime] = None) -> list[dict[str, Any]]:
        snapshots = self.lakehouse.list_snapshots(table_name)
        if since:
            snapshots = [s for s in snapshots if s.timestamp >= since]
        return [{"timestamp": s.timestamp.isoformat(), "snapshot_id": s.snapshot_id, "operation": s.operation, "summary": s.summary} for s in snapshots]
