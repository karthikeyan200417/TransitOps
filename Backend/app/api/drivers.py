import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverUpdate, DriverOut
from app.services import driver_service

router = APIRouter()


@router.post("", response_model=DriverOut, status_code=201, summary="Register a new driver")
def create_driver(
    payload: DriverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return driver_service.create_driver(payload, db, current_user)


@router.get("", response_model=List[DriverOut], summary="List all drivers")
def list_drivers(
    status: Optional[str] = Query(None, description="Filter by status: AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return driver_service.list_drivers(db, status_filter=status)


@router.get("/{driver_id}", response_model=DriverOut, summary="Get a driver by ID")
def get_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return driver_service.get_driver(driver_id, db)


@router.put("/{driver_id}", response_model=DriverOut, summary="Update a driver")
def update_driver(
    driver_id: uuid.UUID,
    payload: DriverUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return driver_service.update_driver(driver_id, payload, db, current_user)


@router.delete("/{driver_id}", summary="Delete a driver")
def delete_driver(
    driver_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return driver_service.delete_driver(driver_id, db, current_user)
