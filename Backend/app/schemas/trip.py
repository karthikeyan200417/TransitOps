from __future__ import annotations
from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel
from app.models.enums import TripStatus


class TripDispatch(BaseModel):
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    source: str
    destination: str
    cargo_weight: Decimal
    planned_distance: Decimal
    revenue: Decimal = Decimal("0.00")


class TripUpdate(BaseModel):
    source: Optional[str] = None
    destination: Optional[str] = None
    cargo_weight: Optional[Decimal] = None
    planned_distance: Optional[Decimal] = None
    revenue: Optional[Decimal] = None
    status: Optional[TripStatus] = None


class TripComplete(BaseModel):
    actual_distance: Decimal
    revenue: Optional[Decimal] = None


class TripOut(BaseModel):
    id: uuid.UUID
    trip_code: str
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    dispatcher_id: uuid.UUID
    source: str
    destination: str
    cargo_weight: Decimal
    planned_distance: Decimal
    actual_distance: Optional[Decimal]
    dispatch_time: Optional[datetime]
    completion_time: Optional[datetime]
    status: TripStatus
    revenue: Decimal

    model_config = {"from_attributes": True}
