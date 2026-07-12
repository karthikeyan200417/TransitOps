import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate, MaintenanceOut
from app.services import maintenance_service

router = APIRouter()


@router.post("", response_model=MaintenanceOut, status_code=201, summary="Log a maintenance event")
def create_maintenance(
    payload: MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return maintenance_service.create_maintenance(payload, db, current_user)


@router.get("", response_model=List[MaintenanceOut], summary="List maintenance logs")
def list_maintenance(
    vehicle_id: Optional[uuid.UUID] = Query(None, description="Filter by vehicle ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return maintenance_service.list_maintenance(db, vehicle_id=vehicle_id)


@router.get("/{record_id}", response_model=MaintenanceOut, summary="Get a maintenance record by ID")
def get_maintenance(
    record_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return maintenance_service.get_maintenance(record_id, db)


@router.put("/{record_id}", response_model=MaintenanceOut, summary="Update a maintenance record")
def update_maintenance(
    record_id: uuid.UUID,
    payload: MaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return maintenance_service.update_maintenance(record_id, payload, db, current_user)
