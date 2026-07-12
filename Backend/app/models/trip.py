import uuid
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy import String, Numeric, CheckConstraint, DateTime, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import TripStatus

class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False)
    driver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="RESTRICT"), nullable=False)
    dispatcher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    cargo_weight: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    planned_distance: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    actual_distance: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    dispatch_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completion_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[TripStatus] = mapped_column(
        SQLEnum(TripStatus, name="trip_status"),
        default=TripStatus.DRAFT,
        nullable=False
    )
    revenue: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)

    __table_args__ = (
        CheckConstraint("cargo_weight > 0", name="chk_trip_cargo"),
        CheckConstraint("planned_distance > 0", name="chk_planned_distance"),
        CheckConstraint("actual_distance IS NULL OR actual_distance >= 0", name="chk_actual_distance"),
        CheckConstraint("revenue >= 0", name="chk_trip_revenue"),
        CheckConstraint("status != 'COMPLETED' OR (actual_distance IS NOT NULL AND completion_time IS NOT NULL)", name="chk_trip_completion_data"),
        # Partial Index: unique active trip constraint for drivers and vehicles
        Index("idx_vehicle_active_trip", "vehicle_id", unique=True, postgresql_where=(status == 'DISPATCHED')),
        Index("idx_driver_active_trip", "driver_id", unique=True, postgresql_where=(status == 'DISPATCHED')),
    )

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="trips")
    driver: Mapped["Driver"] = relationship("Driver", back_populates="trips")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="trip")
