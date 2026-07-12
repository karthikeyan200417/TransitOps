"""
data_engine.py
==============
Loads the six seed CSVs and computes all vehicle/driver/trip features
live, in-memory, with no schema changes -- same formulas as features.py,
packaged so the FastAPI app can call `get_state()` and get fresh
DataFrames + KPIs on every request (fine at hackathon/demo scale).
"""

import os
import pandas as pd
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

RATE_PER_KM = 15.0
MAINT_DUE_DAYS = 180
MAINT_DUE_KM = 8000


def _now():
    return pd.Timestamp.now().normalize()


def load_raw():
    vehicles = pd.read_csv(f"{DATA_DIR}/vehicles.csv")
    drivers = pd.read_csv(f"{DATA_DIR}/drivers.csv", parse_dates=["expiry"])
    trips = pd.read_csv(f"{DATA_DIR}/trips.csv", parse_dates=["date"])
    maintenance = pd.read_csv(f"{DATA_DIR}/maintenance.csv", parse_dates=["date"])
    fuel_logs = pd.read_csv(f"{DATA_DIR}/fuel_logs.csv", parse_dates=["date"])
    expenses = pd.read_csv(f"{DATA_DIR}/expenses.csv")
    return vehicles, drivers, trips, maintenance, fuel_logs, expenses


def compute_vehicle_features(vehicles, trips, maintenance, fuel_logs, expenses):
    now = _now()
    completed = trips[trips.status == "Completed"]

    first_trip = trips.groupby("reg_no")["date"].min().rename("first_trip_date")
    closed_maint = maintenance[maintenance.status == "Closed"]
    last_service = closed_maint.groupby("reg_no")["date"].max().rename("last_service_date")

    total_trips_count = trips.groupby("reg_no").size().rename("total_trips_count")
    total_km_driven = completed.groupby("reg_no")["planned_distance_km"].sum().rename("total_km_driven")
    on_trip_count = trips[trips.status.isin(["Dispatched", "Completed"])].groupby("reg_no").size().rename("on_trip_count")

    cap = trips.merge(vehicles[["reg_no", "capacity_kg"]], on="reg_no", how="left")
    cap["ratio"] = cap["cargo_weight_kg"] / cap["capacity_kg"]
    capacity_util_avg = cap.groupby("reg_no")["ratio"].mean().rename("capacity_utilization_avg")

    maint_count = maintenance.groupby("reg_no").size().rename("maintenance_count")
    maint_cost_total = maintenance.groupby("reg_no")["cost"].sum().rename("maintenance_cost_total")
    fuel_liters_total = fuel_logs.groupby("reg_no")["liters"].sum().rename("total_liters")
    fuel_cost_total = fuel_logs.groupby("reg_no")["fuel_cost"].sum().rename("total_fuel_cost")
    expense_total = expenses.groupby("reg_no")["total"].sum().rename("total_expense_cost")

    feat = vehicles.set_index("reg_no")[
        ["name_model", "type", "capacity_kg", "odometer_km", "acquisition_cost", "status"]
    ].copy()
    feat = feat.join([first_trip, last_service, total_trips_count, total_km_driven,
                       on_trip_count, capacity_util_avg, maint_count, maint_cost_total,
                       fuel_liters_total, fuel_cost_total, expense_total])

    for col in ["total_trips_count", "total_km_driven", "on_trip_count", "maintenance_count",
                "maintenance_cost_total", "total_liters", "total_fuel_cost", "total_expense_cost"]:
        feat[col] = feat[col].fillna(0)

    feat["vehicle_age_days"] = (now - feat["first_trip_date"]).dt.days
    feat["vehicle_age_days"] = feat["vehicle_age_days"].fillna(365).clip(lower=1)

    feat["days_since_last_service"] = (now - feat["last_service_date"]).dt.days

    def km_since_service(reg_no, last_date):
        if pd.isna(last_date):
            return feat.loc[reg_no, "total_km_driven"]
        mask = (completed.reg_no == reg_no) & (completed.date > last_date)
        return completed.loc[mask, "planned_distance_km"].sum()

    feat["km_since_last_service"] = [
        km_since_service(reg, feat.loc[reg, "last_service_date"]) for reg in feat.index
    ]

    feat["avg_km_per_trip"] = np.where(
        feat["total_trips_count"] > 0,
        feat["total_km_driven"] / feat["total_trips_count"].replace(0, np.nan), 0
    )
    feat["utilization_rate"] = (feat["on_trip_count"] / feat["vehicle_age_days"]).round(4)
    feat["maintenance_frequency"] = (feat["maintenance_count"] / feat["vehicle_age_days"]).round(5)
    feat["avg_fuel_efficiency_km_l"] = np.where(
        feat["total_liters"] > 0, feat["total_km_driven"] / feat["total_liters"], np.nan
    )

    per_fill_records = []
    for reg_no, grp in fuel_logs.sort_values("date").groupby("reg_no"):
        veh_trips = completed[completed.reg_no == reg_no].sort_values("date")
        prev_date = None
        for _, row in grp.iterrows():
            window_km = veh_trips.loc[
                (veh_trips.date > (prev_date if prev_date is not None else pd.Timestamp.min))
                & (veh_trips.date <= row["date"]), "planned_distance_km"
            ].sum()
            eff = window_km / row["liters"] if row["liters"] > 0 else np.nan
            per_fill_records.append({"reg_no": reg_no, "date": row["date"], "efficiency_km_l": eff})
            prev_date = row["date"]

    per_fill_df = pd.DataFrame(per_fill_records)
    if not per_fill_df.empty:
        eff_std = per_fill_df.groupby("reg_no")["efficiency_km_l"].std().rename("fuel_efficiency_std")
        feat = feat.join(eff_std)
    else:
        feat["fuel_efficiency_std"] = np.nan
    feat["fuel_efficiency_std"] = feat["fuel_efficiency_std"].fillna(0)

    feat["cost_per_km"] = np.where(
        feat["total_km_driven"] > 0,
        (feat["maintenance_cost_total"] + feat["total_fuel_cost"] + feat["total_expense_cost"]) / feat["total_km_driven"],
        np.nan,
    )

    estimated_revenue = feat["total_km_driven"] * RATE_PER_KM
    feat["roi_pct"] = (
        (estimated_revenue - (feat["maintenance_cost_total"] + feat["total_fuel_cost"])) / feat["acquisition_cost"]
    ).round(4) * 100

    maint_90 = maintenance[maintenance.date >= now - pd.Timedelta(days=90)]
    feat["maintenance_cost_last_90_days"] = maint_90.groupby("reg_no")["cost"].sum().reindex(feat.index).fillna(0)

    fuel_last_30 = fuel_logs[fuel_logs.date >= now - pd.Timedelta(days=30)]
    fuel_prior_30 = fuel_logs[(fuel_logs.date < now - pd.Timedelta(days=30)) & (fuel_logs.date >= now - pd.Timedelta(days=60))]
    feat["fuel_cost_last_30_days"] = fuel_last_30.groupby("reg_no")["fuel_cost"].sum().reindex(feat.index).fillna(0)
    feat["fuel_cost_prior_30_days"] = fuel_prior_30.groupby("reg_no")["fuel_cost"].sum().reindex(feat.index).fillna(0)
    feat["fuel_cost_trend_pct"] = np.where(
        feat["fuel_cost_prior_30_days"] > 0,
        (feat["fuel_cost_last_30_days"] - feat["fuel_cost_prior_30_days"]) / feat["fuel_cost_prior_30_days"] * 100,
        np.nan,
    )

    trips_7 = trips[trips.date >= now - pd.Timedelta(days=7)]
    feat["trips_last_7_days"] = trips_7.groupby("reg_no").size().reindex(feat.index).fillna(0)

    feat["maintenance_due_soon"] = (
        feat["days_since_last_service"].isna()
        | (feat["days_since_last_service"] > MAINT_DUE_DAYS)
        | (feat["km_since_last_service"] > MAINT_DUE_KM)
    )

    def has_anomaly(reg_no):
        rows = per_fill_df[per_fill_df.reg_no == reg_no]["efficiency_km_l"].dropna() if not per_fill_df.empty else pd.Series(dtype=float)
        if len(rows) < 2:
            return False
        mean, std = rows.mean(), rows.std()
        if std == 0 or pd.isna(std):
            return False
        return bool(((rows - mean).abs() > 2 * std).any())

    feat["fuel_anomaly_flag"] = [has_anomaly(reg) for reg in feat.index]
    feat = feat.reset_index().rename(columns={"index": "reg_no"})
    return feat


def compute_driver_features(drivers, trips):
    now = _now()
    first_trip = trips.groupby("license_no")["date"].min().rename("first_trip_date")
    total_trips = trips.groupby("license_no").size().rename("total_trips")
    avg_distance = trips.groupby("license_no")["planned_distance_km"].mean().rename("avg_trip_distance")
    cancelled = trips[trips.status == "Cancelled"].groupby("license_no").size().rename("cancelled_count")

    feat = drivers.set_index("license_no")[
        ["name", "category", "expiry", "trip_completion_pct", "safety_score", "status"]
    ].copy()
    feat = feat.join([first_trip, total_trips, avg_distance, cancelled])
    feat["total_trips"] = feat["total_trips"].fillna(0)
    feat["cancelled_count"] = feat["cancelled_count"].fillna(0)
    feat["avg_trip_distance"] = feat["avg_trip_distance"].fillna(0)

    feat["days_to_license_expiry"] = (feat["expiry"] - now).dt.days
    months_active = ((now - feat["first_trip_date"]).dt.days / 30).clip(lower=1)
    feat["trips_per_month"] = (feat["total_trips"] / months_active).fillna(0).round(2)
    feat["cancellation_rate"] = np.where(feat["total_trips"] > 0, feat["cancelled_count"] / feat["total_trips"], 0)

    feat["composite_risk_score"] = (
        0.4 * (100 - feat["safety_score"])
        + 0.4 * (100 - feat["trip_completion_pct"])
        + 0.2 * (feat["cancellation_rate"] * 100)
    ).round(2)

    feat["license_risk_bucket"] = pd.cut(
        feat["days_to_license_expiry"], bins=[-np.inf, 14, 60, np.inf], labels=["Critical", "Warning", "Safe"]
    )
    try:
        feat["driver_risk_bucket"] = pd.qcut(
            feat["composite_risk_score"], q=3, labels=["Low", "Medium", "High"], duplicates="drop"
        )
    except ValueError:
        feat["driver_risk_bucket"] = "Low"

    feat = feat.reset_index().rename(columns={"index": "license_no"})
    return feat


def compute_trip_features(trips, vehicles):
    feat = trips.merge(vehicles[["reg_no", "capacity_kg", "type"]], on="reg_no", how="left")
    feat["cargo_to_capacity_ratio"] = (feat["cargo_weight_kg"] / feat["capacity_kg"]).round(3)
    feat["distance_bucket"] = pd.cut(
        feat["planned_distance_km"], bins=[0, 100, 400, np.inf], labels=["short", "medium", "long"]
    )
    feat["route_pair"] = feat["source"] + "\u2192" + feat["destination"]
    feat = feat.rename(columns={"type": "vehicle_type"})
    return feat


def get_state():
    """Load everything fresh and return a dict of DataFrames, used by every API route."""
    vehicles, drivers, trips, maintenance, fuel_logs, expenses = load_raw()
    vehicle_features = compute_vehicle_features(vehicles, trips, maintenance, fuel_logs, expenses)
    driver_features = compute_driver_features(drivers, trips)
    trip_features = compute_trip_features(trips, vehicles)
    return {
        "vehicles": vehicles, "drivers": drivers, "trips": trips,
        "maintenance": maintenance, "fuel_logs": fuel_logs, "expenses": expenses,
        "vehicle_features": vehicle_features, "driver_features": driver_features,
        "trip_features": trip_features,
    }


def kpis(state):
    v = state["vehicles"]
    t = state["trips"]
    d = state["drivers"]
    total_vehicles = len(v)
    active_vehicles = int((v.status != "Retired").sum())
    available_vehicles = int((v.status == "Available").sum())
    in_maintenance = int((v.status == "In Shop").sum())
    active_trips = int((t.status == "Dispatched").sum())
    pending_trips = int((t.status == "Draft").sum())
    drivers_on_duty = int((d.status == "On Trip").sum())
    fleet_utilization = round((v.status == "On Trip").sum() / total_vehicles * 100, 1) if total_vehicles else 0
    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "available_vehicles": available_vehicles,
        "vehicles_in_maintenance": in_maintenance,
        "active_trips": active_trips,
        "pending_trips": pending_trips,
        "drivers_on_duty": drivers_on_duty,
        "fleet_utilization_pct": fleet_utilization,
    }
