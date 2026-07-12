from __future__ import annotations
from datetime import date
from decimal import Decimal
import uuid
from pydantic import BaseModel, field_validator


class FuelCreate(BaseModel):
    vehicle_id: uuid.UUID
    date: date
    liters: Decimal
    cost: Decimal
    odometer: Decimal

    @field_validator("liters")
    @classmethod
    def liters_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Liters must be greater than 0")
        return v

    @field_validator("cost", "odometer")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Value cannot be negative")
        return v


class FuelOut(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    date: date
    liters: Decimal
    cost: Decimal
    odometer: Decimal

    model_config = {"from_attributes": True}
