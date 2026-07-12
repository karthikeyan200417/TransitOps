from __future__ import annotations
from datetime import date
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, field_validator
from app.models.enums import DriverStatus


class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: str
    trip_completion_pct: int = 100
    safety_score: Decimal = Decimal("100.00")
    status: DriverStatus = DriverStatus.AVAILABLE

    @field_validator("trip_completion_pct")
    @classmethod
    def pct_range(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("trip_completion_pct must be 0–100")
        return v

    @field_validator("safety_score")
    @classmethod
    def score_range(cls, v: Decimal) -> Decimal:
        if not (Decimal("0.00") <= v <= Decimal("100.00")):
            raise ValueError("safety_score must be 0–100")
        return v


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact_number: Optional[str] = None
    trip_completion_pct: Optional[int] = None
    safety_score: Optional[Decimal] = None
    status: Optional[DriverStatus] = None


class DriverOut(BaseModel):
    id: uuid.UUID
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: str
    trip_completion_pct: int
    safety_score: Decimal
    status: DriverStatus

    model_config = {"from_attributes": True}
