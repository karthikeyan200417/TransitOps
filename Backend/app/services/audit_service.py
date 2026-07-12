from typing import List
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut


def list_audit_logs(
    db: Session,
    table_name: str = None,
    action: str = None,
    limit: int = 100,
    offset: int = 0,
) -> List[AuditLogOut]:
    q = db.query(AuditLog)
    if table_name:
        q = q.filter(AuditLog.table_name == table_name)
    if action:
        q = q.filter(AuditLog.action == action)
    results = q.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return [AuditLogOut.model_validate(r) for r in results]
