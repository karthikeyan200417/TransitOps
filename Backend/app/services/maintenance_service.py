import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.maintenance import MaintenanceLog
from app.models.user import User
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from app.services.audit_helper import log_action


def create_maintenance(payload: MaintenanceCreate, db: Session, current_user: User) -> MaintenanceOut:
    record = MaintenanceLog(**payload.model_dump())
    db.add(record)
    db.flush()
    log_action(
        db, action="CREATE", table_name="maintenance_logs",
        record_id=record.id, user_id=current_user.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(record)
    return MaintenanceOut.model_validate(record)


def list_maintenance(db: Session, vehicle_id: uuid.UUID = None) -> List[MaintenanceOut]:
    q = db.query(MaintenanceLog)
    if vehicle_id:
        q = q.filter(MaintenanceLog.vehicle_id == vehicle_id)
    return [MaintenanceOut.model_validate(m) for m in q.order_by(MaintenanceLog.start_date.desc()).all()]


def get_maintenance(record_id: uuid.UUID, db: Session) -> MaintenanceOut:
    record = db.query(MaintenanceLog).filter(MaintenanceLog.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found.")
    return MaintenanceOut.model_validate(record)


def update_maintenance(record_id: uuid.UUID, payload: MaintenanceUpdate, db: Session, current_user: User) -> MaintenanceOut:
    record = db.query(MaintenanceLog).filter(MaintenanceLog.id == record_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance record not found.")
    old = {c.name: str(getattr(record, c.name)) for c in MaintenanceLog.__table__.columns}
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)
    db.flush()
    log_action(
        db, action="UPDATE", table_name="maintenance_logs",
        record_id=record.id, user_id=current_user.id,
        old_values=old,
        new_values={k: str(v) for k, v in update_data.items()},
    )
    db.commit()
    db.refresh(record)
    return MaintenanceOut.model_validate(record)
