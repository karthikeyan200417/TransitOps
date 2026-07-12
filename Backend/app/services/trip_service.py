import uuid
import random
import string
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.user import User
from app.models.enums import TripStatus, VehicleStatus, DriverStatus
from app.schemas.trip import TripDispatch, TripUpdate, TripComplete, TripOut
from app.services.audit_helper import log_action


def _generate_trip_code() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"TRIP-{suffix}"


def dispatch_trip(payload: TripDispatch, db: Session, current_user: User) -> TripOut:
    vehicle = db.query(Vehicle).filter(Vehicle.id == payload.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    if vehicle.status != VehicleStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Vehicle is not available (current status: {vehicle.status.value}).",
        )

    driver = db.query(Driver).filter(Driver.id == payload.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found.")
    if driver.status != DriverStatus.AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Driver is not available (current status: {driver.status.value}).",
        )

    # Generate unique trip code
    trip_code = _generate_trip_code()
    while db.query(Trip).filter(Trip.trip_code == trip_code).first():
        trip_code = _generate_trip_code()

    now = datetime.now(timezone.utc)
    trip = Trip(
        trip_code=trip_code,
        vehicle_id=payload.vehicle_id,
        driver_id=payload.driver_id,
        dispatcher_id=current_user.id,
        source=payload.source,
        destination=payload.destination,
        cargo_weight=payload.cargo_weight,
        planned_distance=payload.planned_distance,
        revenue=payload.revenue,
        status=TripStatus.DISPATCHED,
        dispatch_time=now,
    )
    db.add(trip)
    db.flush()

    # Update vehicle and driver statuses
    vehicle.status = VehicleStatus.ON_TRIP
    driver.status = DriverStatus.ON_TRIP

    log_action(
        db, action="DISPATCH", table_name="trips",
        record_id=trip.id, user_id=current_user.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(trip)
    return TripOut.model_validate(trip)


def list_trips(db: Session, status_filter: Optional[str] = None) -> List[TripOut]:
    q = db.query(Trip)
    if status_filter:
        q = q.filter(Trip.status == status_filter)
    return [TripOut.model_validate(t) for t in q.order_by(Trip.dispatch_time.desc().nullslast()).all()]


def get_trip(trip_id: uuid.UUID, db: Session) -> TripOut:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    return TripOut.model_validate(trip)


def update_trip(trip_id: uuid.UUID, payload: TripUpdate, db: Session, current_user: User) -> TripOut:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.status == TripStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot update a completed trip.")

    old = {c.name: str(getattr(trip, c.name)) for c in Trip.__table__.columns}
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    log_action(
        db, action="UPDATE", table_name="trips",
        record_id=trip.id, user_id=current_user.id,
        old_values=old,
        new_values={k: str(v) for k, v in update_data.items()},
    )
    db.commit()
    db.refresh(trip)
    return TripOut.model_validate(trip)


def complete_trip(trip_id: uuid.UUID, payload: TripComplete, db: Session, current_user: User) -> TripOut:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found.")
    if trip.status != TripStatus.DISPATCHED:
        raise HTTPException(
            status_code=400,
            detail=f"Only DISPATCHED trips can be completed (current: {trip.status.value}).",
        )

    now = datetime.now(timezone.utc)
    trip.status = TripStatus.COMPLETED
    trip.actual_distance = payload.actual_distance
    trip.completion_time = now
    if payload.revenue is not None:
        trip.revenue = payload.revenue

    # Release vehicle and driver
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    if vehicle:
        vehicle.status = VehicleStatus.AVAILABLE
        vehicle.odometer += payload.actual_distance

    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    if driver:
        driver.status = DriverStatus.AVAILABLE

    log_action(
        db, action="COMPLETE", table_name="trips",
        record_id=trip.id, user_id=current_user.id,
        new_values=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(trip)
    return TripOut.model_validate(trip)
