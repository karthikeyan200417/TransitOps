from __future__ import annotations
from decimal import Decimal
from pydantic import BaseModel


class DashboardOut(BaseModel):
    total_vehicles: int
    available_vehicles: int
    on_trip_vehicles: int
    in_shop_vehicles: int
    total_drivers: int
    available_drivers: int
    on_trip_drivers: int
    active_trips: int
    completed_trips_today: int
    total_trips: int
    revenue_today: Decimal
    revenue_this_month: Decimal
    total_expenses_this_month: Decimal
    pending_maintenance: int
    fuel_spend_this_month: Decimal
