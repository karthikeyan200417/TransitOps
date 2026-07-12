from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    FleetUtilizationOut,
    FuelEfficiencyOut,
    ExpensesAnalyticsOut,
    MaintenanceAnalyticsOut,
    TripAnalyticsOut,
)
from app.services import analytics_service

router = APIRouter()


@router.get("/fleet-utilization", response_model=FleetUtilizationOut, summary="Fleet utilization report")
def fleet_utilization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_fleet_utilization(db)


@router.get("/fuel-efficiency", response_model=FuelEfficiencyOut, summary="Fuel efficiency report (km/L per vehicle)")
def fuel_efficiency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_fuel_efficiency(db)


@router.get("/expenses", response_model=ExpensesAnalyticsOut, summary="Expense breakdown by type")
def expenses_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_expenses_analytics(db)


@router.get("/maintenance", response_model=MaintenanceAnalyticsOut, summary="Maintenance cost analytics per vehicle")
def maintenance_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_maintenance_analytics(db)


@router.get("/trips", response_model=TripAnalyticsOut, summary="Trip completion and revenue analytics")
def trips_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return analytics_service.get_trips_analytics(db)
