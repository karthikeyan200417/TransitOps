import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import FLEET_WRITE, FLEET_READ, ADMIN_ONLY
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.services import vehicle_service

router = APIRouter()


@router.post(
    "",
    response_model=VehicleOut,
    status_code=201,
    summary="Register a new vehicle",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER",
)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_WRITE),
):
    return vehicle_service.create_vehicle(payload, db, current_user)


@router.get(
    "",
    response_model=List[VehicleOut],
    summary="List all vehicles",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER",
)
def list_vehicles(
    status: Optional[str] = Query(None, description="Filter: AVAILABLE | ON_TRIP | IN_SHOP | RETIRED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_READ),
):
    return vehicle_service.list_vehicles(db, status_filter=status)


@router.get(
    "/{vehicle_id}",
    response_model=VehicleOut,
    summary="Get a vehicle by ID",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER",
)
def get_vehicle(
    vehicle_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_READ),
):
    return vehicle_service.get_vehicle(vehicle_id, db)


@router.put(
    "/{vehicle_id}",
    response_model=VehicleOut,
    summary="Update a vehicle",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER",
)
def update_vehicle(
    vehicle_id: uuid.UUID,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_WRITE),
):
    return vehicle_service.update_vehicle(vehicle_id, payload, db, current_user)


@router.delete(
    "/{vehicle_id}",
    summary="Delete a vehicle",
    description="**Roles allowed:** ADMIN only",
)
def delete_vehicle(
    vehicle_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
):
    return vehicle_service.delete_vehicle(vehicle_id, db, current_user)
