import uuid
from typing import List
from decimal import Decimal
from sqlalchemy import String, Numeric, CheckConstraint, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import VehicleStatus

class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registration_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    name_model: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    capacity_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    odometer: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    acquisition_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[VehicleStatus] = mapped_column(
        SQLEnum(VehicleStatus, name="vehicle_status"),
        default=VehicleStatus.AVAILABLE,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("capacity_kg > 0", name="chk_vehicle_capacity"),
        CheckConstraint("odometer >= 0", name="chk_vehicle_odometer"),
        CheckConstraint("acquisition_cost >= 0", name="chk_vehicle_acquisition_cost"),
    )

    # Relationships
    trips: Mapped[List["Trip"]] = relationship("Trip", back_populates="vehicle")
    maintenance_logs: Mapped[List["MaintenanceLog"]] = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs: Mapped[List["FuelLog"]] = relationship("FuelLog", back_populates="vehicle")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="vehicle")
