import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import FLEET_WRITE, FLEET_READ, ADMIN_ONLY
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.services import driver_service

router = APIRouter()


@router.post(
    "",
    response_model=DriverOut,
    status_code=201,
    summary="Register a new driver",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER",
)
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_WRITE),
):
    return driver_service.create_driver(payload, db, current_user)


@router.get(
    "",
    response_model=List[DriverOut],
    summary="List all drivers",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER",
)
def list_drivers(
    status: Optional[str] = Query(None, description="Filter: AVAILABLE | ON_TRIP | OFF_DUTY | SUSPENDED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_READ),
):
    return driver_service.list_drivers(db, status_filter=status)


@router.get(
    "/{driver_id}",
    response_model=DriverOut,
    summary="Get a driver by ID",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER",
)
def get_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_READ),
):
    return driver_service.get_driver(driver_id, db)


@router.put(
    "/{driver_id}",
    response_model=DriverOut,
    summary="Update a driver",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER",
)
def update_driver(
    driver_id: uuid.UUID,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(FLEET_WRITE),
):
    return driver_service.update_driver(driver_id, payload, db, current_user)


@router.delete(
    "/{driver_id}",
    summary="Delete a driver",
    description="**Roles allowed:** ADMIN only",
)
def delete_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
):
    return driver_service.delete_driver(driver_id, db, current_user)
