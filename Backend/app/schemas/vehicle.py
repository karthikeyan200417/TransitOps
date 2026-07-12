from __future__ import annotations
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, field_validator
from app.models.enums import VehicleStatus


class VehicleCreate(BaseModel):
    registration_number: str
    name_model: str
    type: str
    capacity_kg: Decimal
    odometer: Decimal = Decimal("0.00")
    acquisition_cost: Decimal
    status: VehicleStatus = VehicleStatus.AVAILABLE

    @field_validator("capacity_kg", "acquisition_cost")
    @classmethod
    def must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Must be greater than 0")
        return v

    @field_validator("odometer")
    @classmethod
    def must_be_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Odometer cannot be negative")
        return v


class VehicleUpdate(BaseModel):
    name_model: Optional[str] = None
    type: Optional[str] = None
    capacity_kg: Optional[Decimal] = None
    odometer: Optional[Decimal] = None
    acquisition_cost: Optional[Decimal] = None
    status: Optional[VehicleStatus] = None


class VehicleOut(BaseModel):
    id: uuid.UUID
    registration_number: str
    name_model: str
    type: str
    capacity_kg: Decimal
    odometer: Decimal
    acquisition_cost: Decimal
    status: VehicleStatus

    model_config = {"from_attributes": True}
