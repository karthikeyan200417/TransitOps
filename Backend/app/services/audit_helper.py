import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    table_name: str,
    record_id: uuid.UUID,
    user_id: Optional[uuid.UUID] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
) -> None:
    """Write a record to audit_logs. Call after every create/update/delete."""
    entry = AuditLog(
        user_id=user_id,
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_values=old_values,
        new_values=new_values,
    )
    db.add(entry)
    # Flush so the entry is written in the same transaction as the parent change
    db.flush()
