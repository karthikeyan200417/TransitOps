from __future__ import annotations
from datetime import date
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, field_validator
from app.models.enums import ExpenseType


class ExpenseCreate(BaseModel):
    vehicle_id: uuid.UUID
    trip_id: Optional[uuid.UUID] = None
    amount: Decimal
    type: ExpenseType
    date: date

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = None
    type: Optional[ExpenseType] = None
    date: Optional[date] = None


class ExpenseOut(BaseModel):
    id: uuid.UUID
    vehicle_id: uuid.UUID
    trip_id: Optional[uuid.UUID]
    amount: Decimal
    type: ExpenseType
    date: date

    model_config = {"from_attributes": True}
