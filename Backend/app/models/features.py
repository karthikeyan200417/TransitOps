import uuid
from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy import UUID, String, Numeric, Integer, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class VehicleFeature(Base):
    """Maps to view_vehicle_features in PostgreSQL"""
    __tablename__ = "view_vehicle_features"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    reg_no: Mapped[str] = mapped_column(String(20))
    name_model: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(50))
    capacity_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    odometer_km: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    acquisition_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20))
    
    # Aggregated Analytics
    total_trips_count: Mapped[int] = mapped_column(Integer)
    total_km_driven: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    maintenance_count: Mapped[int] = mapped_column(Integer)
    maintenance_cost_total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_liters: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    total_fuel_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_expense_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    
    # Derived Metrics
    vehicle_age_days: Mapped[int] = mapped_column(Integer)
    days_since_last_service: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    km_since_last_service: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    avg_km_per_trip: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    utilization_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4))
    maintenance_frequency: Mapped[Decimal] = mapped_column(Numeric(7, 5))
    avg_fuel_efficiency_km_l: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    capacity_utilization_avg: Mapped[Decimal] = mapped_column(Numeric(5, 3))
    cost_per_km: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    roi_pct: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    
    # Time-windowed metrics
    maintenance_cost_last_90_days: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    fuel_cost_last_30_days: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    fuel_cost_prior_30_days: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    trips_last_7_days: Mapped[int] = mapped_column(Integer)
    
    # Trigger Flags
    maintenance_due_soon: Mapped[bool] = mapped_column(Boolean)


class DriverFeature(Base):
    """Maps to view_driver_features in PostgreSQL"""
    __tablename__ = "view_driver_features"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    license_no: Mapped[str] = mapped_column(String(50))
    license_category: Mapped[str] = mapped_column(String(10))
    expiry: Mapped[date] = mapped_column(Date)
    trip_completion_pct: Mapped[int] = mapped_column(Integer)
    safety_score: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    status: Mapped[str] = mapped_column(String(20))
    
    # Aggregated Analytics
    total_trips: Mapped[int] = mapped_column(Integer)
    avg_trip_distance: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    cancellation_rate: Mapped[Decimal] = mapped_column(Numeric(6, 4))
    days_to_license_expiry: Mapped[int] = mapped_column(Integer)
    trips_per_month: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    composite_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    license_risk_bucket: Mapped[str] = mapped_column(String(20))


class TripFeature(Base):
    """Maps to view_trip_features in PostgreSQL"""
    __tablename__ = "view_trip_features"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    trip_code: Mapped[str] = mapped_column(String(20))
    source: Mapped[str] = mapped_column(String(100))
    destination: Mapped[str] = mapped_column(String(100))
    route_pair: Mapped[str] = mapped_column(String(205))
    cargo_weight_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    planned_distance_km: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    status: Mapped[str] = mapped_column(String(20))
    capacity_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    cargo_to_capacity_ratio: Mapped[Decimal] = mapped_column(Numeric(5, 3))
    distance_bucket: Mapped[str] = mapped_column(String(20))
