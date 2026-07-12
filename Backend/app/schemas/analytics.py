from __future__ import annotations
from decimal import Decimal
from typing import List
from pydantic import BaseModel


class FleetUtilizationItem(BaseModel):
    vehicle_id: str
    registration_number: str
    name_model: str
    status: str
    total_trips: int
    total_distance_km: Decimal
    total_revenue: Decimal


class FleetUtilizationOut(BaseModel):
    items: List[FleetUtilizationItem]
    total_vehicles: int
    utilization_rate_pct: Decimal


class FuelEfficiencyItem(BaseModel):
    vehicle_id: str
    registration_number: str
    name_model: str
    total_liters: Decimal
    total_fuel_cost: Decimal
    total_distance_km: Decimal
    km_per_liter: Decimal


class FuelEfficiencyOut(BaseModel):
    items: List[FuelEfficiencyItem]
    fleet_avg_km_per_liter: Decimal


class ExpensesAnalyticsItem(BaseModel):
    type: str
    total_amount: Decimal
    count: int


class ExpensesAnalyticsOut(BaseModel):
    breakdown: List[ExpensesAnalyticsItem]
    total_expenses: Decimal


class MaintenanceAnalyticsItem(BaseModel):
    vehicle_id: str
    registration_number: str
    name_model: str
    total_maintenance_cost: Decimal
    active_maintenance_count: int
    completed_maintenance_count: int


class MaintenanceAnalyticsOut(BaseModel):
    items: List[MaintenanceAnalyticsItem]
    total_maintenance_cost: Decimal
    vehicles_in_maintenance: int


class TripAnalyticsItem(BaseModel):
    status: str
    count: int
    total_revenue: Decimal
    total_distance_km: Decimal


class TripAnalyticsOut(BaseModel):
    breakdown: List[TripAnalyticsItem]
    total_trips: int
    total_revenue: Decimal
    completion_rate_pct: Decimal
