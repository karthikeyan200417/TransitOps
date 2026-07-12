import uuid
from typing import List
from decimal import Decimal
from sqlalchemy import String, Numeric, CheckConstraint, Integer, Date, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.enums import DriverStatus

class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    license_category: Mapped[str] = mapped_column(String(20), nullable=False)
    license_expiry: Mapped[Date] = mapped_column(Date, nullable=False)
    contact_number: Mapped[str] = mapped_column(String(20), nullable=False)
    trip_completion_pct: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    safety_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=100.00, nullable=False)
    status: Mapped[DriverStatus] = mapped_column(
        SQLEnum(DriverStatus, name="driver_status"),
        default=DriverStatus.AVAILABLE,
        nullable=False
    )

    __table_args__ = (
        CheckConstraint("safety_score >= 0.00 AND safety_score <= 100.00", name="chk_driver_safety_score"),
        CheckConstraint("trip_completion_pct >= 0 AND trip_completion_pct <= 100", name="chk_trip_completion_pct"),
    )

    # Relationships
    trips: Mapped[List["Trip"]] = relationship("Trip", back_populates="driver")
