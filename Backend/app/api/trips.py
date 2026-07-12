import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import TRIP_DISPATCH, TRIP_READ, get_token, get_current_user
from app.models.user import User
from app.schemas.trip import TripDispatch, TripUpdate, TripComplete, TripOut
from app.services import trip_service

router = APIRouter()


@router.post(
    "/dispatch",
    response_model=TripOut,
    status_code=201,
    summary="Dispatch a new trip",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER",
)
def dispatch_trip(
    payload: TripDispatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(TRIP_DISPATCH),
):
    return trip_service.dispatch_trip(payload, db, current_user)


@router.get(
    "",
    response_model=List[TripOut],
    summary="List all trips",
    description="**Roles allowed:** All authenticated roles",
)
def list_trips(
    status: Optional[str] = Query(None, description="Filter: DRAFT | DISPATCHED | COMPLETED | CANCELLED"),
    db: Session = Depends(get_db),
    current_user: User = Depends(TRIP_READ),
):
    return trip_service.list_trips(db, status_filter=status)


@router.get(
    "/{trip_id}",
    response_model=TripOut,
    summary="Get a trip by ID",
    description="**Roles allowed:** All authenticated roles",
)
def get_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(TRIP_READ),
):
    return trip_service.get_trip(trip_id, db)


@router.put(
    "/{trip_id}",
    response_model=TripOut,
    summary="Update a trip",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER",
)
def update_trip(
    trip_id: uuid.UUID,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(TRIP_DISPATCH),
):
    return trip_service.update_trip(trip_id, payload, db, current_user)


@router.post(
    "/{trip_id}/complete",
    response_model=TripOut,
    summary="Mark a trip as completed",
    description="**Roles allowed:** ADMIN, FLEET_MANAGER, DISPATCHER",
)
def complete_trip(
    trip_id: uuid.UUID,
    payload: TripComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(TRIP_DISPATCH),
):
    return trip_service.complete_trip(trip_id, payload, db, current_user)
