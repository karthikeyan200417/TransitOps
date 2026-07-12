import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.driver import Driver
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.services.audit_helper import log_action


def create_driver(payload: DriverCreate, db: Session, current_user: User) -> DriverOut:
    existing = db.query(Driver).filter(Driver.license_number == payload.license_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver with license '{payload.license_number}' already exists.",
        )
    driver = Driver(**payload.model_dump())
    db.add(driver)
    db.flush()
    log_action(
        db, action="CREATE", table_name="drivers",
        record_id=driver.id, user_id=current_user.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(driver)
    return DriverOut.model_validate(driver)


def list_drivers(db: Session, status_filter: Optional[str] = None) -> List[DriverOut]:
    q = db.query(Driver)
    if status_filter:
        q = q.filter(Driver.status == status_filter)
    return [DriverOut.model_validate(d) for d in q.order_by(Driver.name).all()]


def get_driver(driver_id: uuid.UUID, db: Session) -> DriverOut:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")
    return DriverOut.model_validate(driver)


def update_driver(driver_id: uuid.UUID, payload: DriverUpdate, db: Session, current_user: User) -> DriverOut:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")
    old = {c.name: getattr(driver, c.name) for c in Driver.__table__.columns}
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(driver, field, value)
    db.flush()
    log_action(
        db, action="UPDATE", table_name="drivers",
        record_id=driver.id, user_id=current_user.id,
        old_values={k: str(v) for k, v in old.items()},
        new_values={k: str(v) for k, v in update_data.items()},
    )
    db.commit()
    db.refresh(driver)
    return DriverOut.model_validate(driver)


def delete_driver(driver_id: uuid.UUID, db: Session, current_user: User) -> dict:
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found.")
    old = {c.name: str(getattr(driver, c.name)) for c in Driver.__table__.columns}
    log_action(
        db, action="DELETE", table_name="drivers",
        record_id=driver.id, user_id=current_user.id,
        old_values=old,
    )
    db.delete(driver)
    db.commit()
    return {"message": f"Driver {driver_id} deleted."}
