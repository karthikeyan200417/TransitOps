import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import FUEL_WRITE, FUEL_READ
from app.models.user import User
from app.schemas.fuel import FuelCreate, FuelOut
from app.services import fuel_service

router = APIRouter()


@router.post(
    "",
    response_model=FuelOut,
    status_code=201,
    summary="Record a fuel fill-up",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER",
)
def create_fuel_log(
    payload: FuelCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(FUEL_WRITE),
):
    return fuel_service.create_fuel_log(payload, db, current_user)


@router.get(
    "",
    response_model=List[FuelOut],
    summary="List fuel logs",
    description="**Roles allowed:** All authenticated roles",
)
def list_fuel_logs(
    vehicle_id: Optional[uuid.UUID] = Query(None, description="Filter by vehicle ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(FUEL_READ),
):
    return fuel_service.list_fuel_logs(db, vehicle_id=vehicle_id)


@router.get(
    "/{log_id}",
    response_model=FuelOut,
    summary="Get a fuel log by ID",
    description="**Roles allowed:** All authenticated roles",
)
def get_fuel_log(
    log_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(FUEL_READ),
):
    return fuel_service.get_fuel_log(log_id, db)
