import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.services.audit_helper import log_action


def create_vehicle(payload: VehicleCreate, db: Session, current_user: User) -> VehicleOut:
    existing = db.query(Vehicle).filter(
        Vehicle.registration_number == payload.registration_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vehicle with registration '{payload.registration_number}' already exists.",
        )
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.flush()
    log_action(
        db, action="CREATE", table_name="vehicles",
        record_id=vehicle.id, user_id=current_user.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(vehicle)
    return VehicleOut.model_validate(vehicle)


def list_vehicles(db: Session, status_filter: Optional[str] = None) -> List[VehicleOut]:
    q = db.query(Vehicle)
    if status_filter:
        q = q.filter(Vehicle.status == status_filter)
    return [VehicleOut.model_validate(v) for v in q.order_by(Vehicle.registration_number).all()]


def get_vehicle(vehicle_id: uuid.UUID, db: Session) -> VehicleOut:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    return VehicleOut.model_validate(vehicle)


def update_vehicle(vehicle_id: uuid.UUID, payload: VehicleUpdate, db: Session, current_user: User) -> VehicleOut:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    old = {c.name: getattr(vehicle, c.name) for c in Vehicle.__table__.columns}
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)
    db.flush()
    log_action(
        db, action="UPDATE", table_name="vehicles",
        record_id=vehicle.id, user_id=current_user.id,
        old_values={k: str(v) for k, v in old.items()},
        new_values={k: str(v) for k, v in update_data.items()},
    )
    db.commit()
    db.refresh(vehicle)
    return VehicleOut.model_validate(vehicle)


def delete_vehicle(vehicle_id: uuid.UUID, db: Session, current_user: User) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found.")
    old = {c.name: str(getattr(vehicle, c.name)) for c in Vehicle.__table__.columns}
    log_action(
        db, action="DELETE", table_name="vehicles",
        record_id=vehicle.id, user_id=current_user.id,
        old_values=old,
    )
    db.delete(vehicle)
    db.commit()
    return {"message": f"Vehicle {vehicle_id} deleted."}
