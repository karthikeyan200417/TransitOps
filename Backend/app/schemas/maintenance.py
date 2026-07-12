from __future__ import annotations
from datetime import date
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel
from app.models.enums import MaintenanceStatus


class MaintenanceCreate(BaseModel):
    vehicle_id: uuid.UUID
    service_type: str
    cost: Decimal
    status: MaintenanceStatus = MaintenanceStatus.ACTIVE
    start_date: date
    end_date: Optional[date] = None


class MaintenanceUpdate(BaseModel):
    service_type: Optional[str] = None
    cost: Optional[Decimal] = None
    status: Optional[MaintenanceStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class MaintenanceOut(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    service_type: str
    cost: Decimal
    status: MaintenanceStatus
    start_date: date
    end_date: Optional[date]

    model_config = {"from_attributes": True}
