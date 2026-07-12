from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.maintenance import MaintenanceLog
from app.models.fuel import FuelLog
from app.models.expense import Expense
from app.models.enums import VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus
from app.schemas.dashboard import DashboardOut


def get_dashboard(db: Session) -> DashboardOut:
    today = date.today()
    month_start = today.replace(day=1)

    # Vehicles
    total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0
    available_vehicles = db.query(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.AVAILABLE).scalar() or 0
    on_trip_vehicles = db.query(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.ON_TRIP).scalar() or 0
    in_shop_vehicles = db.query(func.count(Vehicle.id)).filter(Vehicle.status == VehicleStatus.IN_SHOP).scalar() or 0

    # Drivers
    total_drivers = db.query(func.count(Driver.id)).scalar() or 0
    available_drivers = db.query(func.count(Driver.id)).filter(Driver.status == DriverStatus.AVAILABLE).scalar() or 0
    on_trip_drivers = db.query(func.count(Driver.id)).filter(Driver.status == DriverStatus.ON_TRIP).scalar() or 0

    # Trips
    active_trips = db.query(func.count(Trip.id)).filter(Trip.status == TripStatus.DISPATCHED).scalar() or 0
    total_trips = db.query(func.count(Trip.id)).scalar() or 0

    completed_trips_today = (
        db.query(func.count(Trip.id))
        .filter(
            Trip.status == TripStatus.COMPLETED,
            func.date(Trip.completion_time) == today,
        )
        .scalar() or 0
    )

    revenue_today = (
        db.query(func.coalesce(func.sum(Trip.revenue), 0))
        .filter(
            Trip.status == TripStatus.COMPLETED,
            func.date(Trip.completion_time) == today,
        )
        .scalar() or Decimal("0.00")
    )

    revenue_this_month = (
        db.query(func.coalesce(func.sum(Trip.revenue), 0))
        .filter(
            Trip.status == TripStatus.COMPLETED,
            func.date(Trip.completion_time) >= month_start,
        )
        .scalar() or Decimal("0.00")
    )

    # Expenses this month
    total_expenses_this_month = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.date >= month_start)
        .scalar() or Decimal("0.00")
    )

    # Fuel spend this month
    fuel_spend_this_month = (
        db.query(func.coalesce(func.sum(FuelLog.cost), 0))
        .filter(FuelLog.date >= month_start)
        .scalar() or Decimal("0.00")
    )

    # Pending maintenance (ACTIVE)
    pending_maintenance = (
        db.query(func.count(MaintenanceLog.id))
        .filter(MaintenanceLog.status == MaintenanceStatus.ACTIVE)
        .scalar() or 0
    )

    return DashboardOut(
        total_vehicles=total_vehicles,
        available_vehicles=available_vehicles,
        on_trip_vehicles=on_trip_vehicles,
        in_shop_vehicles=in_shop_vehicles,
        total_drivers=total_drivers,
        available_drivers=available_drivers,
        on_trip_drivers=on_trip_drivers,
        active_trips=active_trips,
        completed_trips_today=completed_trips_today,
        total_trips=total_trips,
        revenue_today=Decimal(str(revenue_today)),
        revenue_this_month=Decimal(str(revenue_this_month)),
        total_expenses_this_month=Decimal(str(total_expenses_this_month)),
        pending_maintenance=pending_maintenance,
        fuel_spend_this_month=Decimal(str(fuel_spend_this_month)),
    )
