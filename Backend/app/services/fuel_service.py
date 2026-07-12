import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.fuel import FuelLog
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.fuel import FuelCreate, FuelOut
from app.services.audit_helper import log_action


def create_fuel_log(payload: FuelCreate, db: Session, current_user: User) -> FuelOut:
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")

    log = FuelLog(**payload.model_dump())
    db.add(log)
    db.flush()
    log_action(
        db, action="CREATE", table_name="fuel_logs",
        record_id=log.id, user_id=current_user.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(log)
    return FuelOut.model_validate(log)


def list_fuel_logs(db: Session, vehicle_id: uuid.UUID = None) -> List[FuelOut]:
    q = db.query(FuelLog)
    if vehicle_id:
        q = q.filter(FuelLog.vehicle_id == vehicle_id)
    return [FuelOut.model_validate(f) for f in q.order_by(FuelLog.date.desc()).all()]


def get_fuel_log(log_id: uuid.UUID, db: Session) -> FuelOut:
    log = db.query(FuelLog).filter(FuelLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel log not found.")
    return FuelOut.model_validate(log)
