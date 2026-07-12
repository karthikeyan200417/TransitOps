from decimal import Decimal
from typing import List
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.trip import Trip
from app.models.fuel import FuelLog
from app.models.expense import Expense
from app.models.maintenance import MaintenanceLog
from app.models.enums import TripStatus, MaintenanceStatus
from app.schemas.analytics import (
    FleetUtilizationItem, FleetUtilizationOut,
    FuelEfficiencyItem, FuelEfficiencyOut,
    ExpensesAnalyticsItem, ExpensesAnalyticsOut,
    MaintenanceAnalyticsItem, MaintenanceAnalyticsOut,
    TripAnalyticsItem, TripAnalyticsOut,
)


def get_fleet_utilization(db: Session) -> FleetUtilizationOut:
    vehicles = db.query(Vehicle).all()
    total = len(vehicles)
    items = []
    on_trip_count = 0

    for v in vehicles:
        trip_stats = (
            db.query(
                func.count(Trip.id),
                func.coalesce(func.sum(Trip.actual_distance), 0),
                func.coalesce(func.sum(Trip.revenue), 0),
            )
            .filter(Trip.vehicle_id == v.id, Trip.status == TripStatus.COMPLETED)
            .first()
        )
        t_count, t_dist, t_rev = trip_stats
        items.append(FleetUtilizationItem(
            vehicle_id=str(v.id),
            registration_number=v.registration_number,
            name_model=v.name_model,
            status=v.status.value,
            total_trips=t_count or 0,
            total_distance_km=Decimal(str(t_dist or 0)),
            total_revenue=Decimal(str(t_rev or 0)),
        ))
        if v.status.value == "ON_TRIP":
            on_trip_count += 1

    utilization_rate = Decimal(str(round(on_trip_count / total * 100, 2))) if total > 0 else Decimal("0.00")

    return FleetUtilizationOut(
        items=items,
        total_vehicles=total,
        utilization_rate_pct=utilization_rate,
    )


def get_fuel_efficiency(db: Session) -> FuelEfficiencyOut:
    vehicles = db.query(Vehicle).all()
    items = []
    total_liters_all = Decimal("0.00")
    total_dist_all = Decimal("0.00")

    for v in vehicles:
        fuel_stats = (
            db.query(
                func.coalesce(func.sum(FuelLog.liters), 0),
                func.coalesce(func.sum(FuelLog.cost), 0),
            )
            .filter(FuelLog.vehicle_id == v.id)
            .first()
        )
        total_liters = Decimal(str(fuel_stats[0] or 0))
        total_cost = Decimal(str(fuel_stats[1] or 0))

        dist_stats = (
            db.query(func.coalesce(func.sum(Trip.actual_distance), 0))
            .filter(Trip.vehicle_id == v.id, Trip.status == TripStatus.COMPLETED)
            .scalar()
        )
        total_dist = Decimal(str(dist_stats or 0))

        km_per_liter = (total_dist / total_liters).quantize(Decimal("0.01")) if total_liters > 0 else Decimal("0.00")

        items.append(FuelEfficiencyItem(
            vehicle_id=str(v.id),
            registration_number=v.registration_number,
            name_model=v.name_model,
            total_liters=total_liters,
            total_fuel_cost=total_cost,
            total_distance_km=total_dist,
            km_per_liter=km_per_liter,
        ))
        total_liters_all += total_liters
        total_dist_all += total_dist

    fleet_avg = (total_dist_all / total_liters_all).quantize(Decimal("0.01")) if total_liters_all > 0 else Decimal("0.00")

    return FuelEfficiencyOut(items=items, fleet_avg_km_per_liter=fleet_avg)


def get_expenses_analytics(db: Session) -> ExpensesAnalyticsOut:
    rows = (
        db.query(Expense.type, func.count(Expense.id), func.coalesce(func.sum(Expense.amount), 0))
        .group_by(Expense.type)
        .all()
    )
    breakdown = [
        ExpensesAnalyticsItem(type=r[0].value, count=r[1], total_amount=Decimal(str(r[2])))
        for r in rows
    ]
    total = sum(item.total_amount for item in breakdown)
    return ExpensesAnalyticsOut(breakdown=breakdown, total_expenses=total)


def get_maintenance_analytics(db: Session) -> MaintenanceAnalyticsOut:
    vehicles = db.query(Vehicle).all()
    items = []
    total_cost_all = Decimal("0.00")
    vehicles_in_maint = 0

    for v in vehicles:
        stats = (
            db.query(
                func.coalesce(func.sum(MaintenanceLog.cost), 0),
                func.count(MaintenanceLog.id).filter(MaintenanceLog.status == MaintenanceStatus.ACTIVE),
                func.count(MaintenanceLog.id).filter(MaintenanceLog.status == MaintenanceStatus.COMPLETED),
            )
            .filter(MaintenanceLog.vehicle_id == v.id)
            .first()
        )
        total_cost = Decimal(str(stats[0] or 0))
        active_count = stats[1] or 0
        completed_count = stats[2] or 0

        items.append(MaintenanceAnalyticsItem(
            vehicle_id=str(v.id),
            registration_number=v.registration_number,
            name_model=v.name_model,
            total_maintenance_cost=total_cost,
            active_maintenance_count=active_count,
            completed_maintenance_count=completed_count,
        ))
        total_cost_all += total_cost
        if active_count > 0:
            vehicles_in_maint += 1

    return MaintenanceAnalyticsOut(
        items=items,
        total_maintenance_cost=total_cost_all,
        vehicles_in_maintenance=vehicles_in_maint,
    )


def get_trips_analytics(db: Session) -> TripAnalyticsOut:
    rows = (
        db.query(
            Trip.status,
            func.count(Trip.id),
            func.coalesce(func.sum(Trip.revenue), 0),
            func.coalesce(func.sum(Trip.actual_distance), 0),
        )
        .group_by(Trip.status)
        .all()
    )

    breakdown = []
    total_trips = 0
    total_revenue = Decimal("0.00")
    completed_count = 0

    for r in rows:
        count = r[1]
        rev = Decimal(str(r[2] or 0))
        dist = Decimal(str(r[3] or 0))
        breakdown.append(TripAnalyticsItem(
            status=r[0].value,
            count=count,
            total_revenue=rev,
            total_distance_km=dist,
        ))
        total_trips += count
        total_revenue += rev
        if r[0] == TripStatus.COMPLETED:
            completed_count = count

    completion_rate = (
        Decimal(str(round(completed_count / total_trips * 100, 2))) if total_trips > 0 else Decimal("0.00")
    )

    return TripAnalyticsOut(
        breakdown=breakdown,
        total_trips=total_trips,
        total_revenue=total_revenue,
        completion_rate_pct=completion_rate,
    )
