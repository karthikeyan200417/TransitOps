from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import AUDIT_READ
from app.models.user import User
from app.schemas.audit_log import AuditLogOut
from app.services import audit_service

router = APIRouter()


@router.get(
    "",
    response_model=List[AuditLogOut],
    summary="List audit log entries",
    description="**Roles allowed:** ADMIN only",
)
def list_audit_logs(
    table_name: Optional[str] = Query(None, description="Filter by table: vehicles, drivers, trips ..."),
    action: Optional[str] = Query(None, description="Filter by action: CREATE, UPDATE, DELETE, DISPATCH, COMPLETE"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(AUDIT_READ),
):
    return audit_service.list_audit_logs(db, table_name=table_name, action=action, limit=limit, offset=offset)
