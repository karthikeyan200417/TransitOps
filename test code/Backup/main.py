"""
TransitOps Dashboard — FastAPI backend
=======================================
Run with:  uvicorn main:app --reload
Then open: http://127.0.0.1:8000
"""

from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd
import numpy as np

import data_engine as de

app = FastAPI(title="TransitOps Dashboard")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------------------------------------------------------
# Role -> allowed views (RBAC)
# ---------------------------------------------------------------------------

ROLES = {
    "fleet_manager": {
        "label": "Fleet Manager",
        "views": ["overview", "fleet", "trips", "maintenance", "predictions"],
    },
    "driver": {
        "label": "Driver / Dispatcher",
        "views": ["overview", "trips", "fleet"],
    },
    "safety_officer": {
        "label": "Safety Officer",
        "views": ["overview", "drivers", "predictions"],
    },
    "financial_analyst": {
        "label": "Financial Analyst",
        "views": ["overview", "fuel_expenses", "financial"],
    },
}

VIEWS = {
    "overview": "Dashboard Overview (KPIs)",
    "fleet": "Vehicle Registry",
    "drivers": "Driver Compliance & Safety",
    "trips": "Trip Management",
    "maintenance": "Maintenance Log",
    "fuel_expenses": "Fuel & Expenses",
    "financial": "Financial Analytics (Cost / ROI)",
    "predictions": "Predictive Alerts",
}


def _personal_kpis(state, driver_id: str):
    """KPIs scoped to a single driver -- what a driver/dispatcher is allowed to see about themself."""
    drivers = state["drivers"]
    row = drivers[drivers.license_no == driver_id]
    if row.empty:
        raise HTTPException(404, f"unknown driver_id '{driver_id}'")
    row = row.iloc[0]

    trips = state["trips"]
    my_trips = trips[trips.license_no == driver_id]
    active = my_trips[my_trips.status == "Dispatched"]
    assigned_vehicle = active.iloc[0]["reg_no"] if not active.empty else "None"

    # The seed data assigns driver.status randomly, independent of whether a
    # dispatched trip actually exists -- so "On Trip" in the roster can be out
    # of sync with real dispatch records. Surface that instead of hiding it.
    recorded_status = row["status"]
    has_active_dispatch = not active.empty
    status_out_of_sync = (recorded_status == "On Trip") != has_active_dispatch

    now = pd.Timestamp.now().normalize()
    days_to_expiry = int((row["expiry"] - now).days)

    return {
        "driver_name": row["name"],
        "driver_status": recorded_status,
        "assigned_vehicle": assigned_vehicle,
        "status_out_of_sync": bool(status_out_of_sync),
        "my_total_trips": int(len(my_trips)),
        "my_completed_trips": int((my_trips.status == "Completed").sum()),
        "my_active_trips": int((my_trips.status == "Dispatched").sum()),
        "my_pending_trips": int((my_trips.status == "Draft").sum()),
        "my_cancelled_trips": int((my_trips.status == "Cancelled").sum()),
        "safety_score": int(row["safety_score"]),
        "trip_completion_pct": int(row["trip_completion_pct"]),
        "days_to_license_expiry": days_to_expiry,
    }


def _records(df: pd.DataFrame, cols=None, limit=500):
    d = df[cols].copy() if cols else df.copy()
    d = d.replace({np.nan: None, pd.NaT: None})
    for c in d.columns:
        if pd.api.types.is_datetime64_any_dtype(d[c]):
            d[c] = d[c].dt.strftime("%Y-%m-%d")
        elif d[c].dtype.name == "category":
            d[c] = d[c].astype(str)
    return d.head(limit).to_dict(orient="records")


# ---------------------------------------------------------------------------
# Meta endpoints
# ---------------------------------------------------------------------------

@app.get("/api/roles")
def get_roles():
    return {rid: {"label": r["label"], "views": [{"id": v, "label": VIEWS[v]} for v in r["views"]]}
            for rid, r in ROLES.items()}


@app.get("/api/kpis")
def get_kpis():
    state = de.get_state()
    return de.kpis(state)


@app.get("/api/drivers")
def list_drivers():
    """Used by the frontend to populate the 'which driver is logging in' selector."""
    state = de.get_state()
    df = state["drivers"][["license_no", "name", "status"]]
    return _records(df)


# ---------------------------------------------------------------------------
# View endpoint — one route, branches on `view`
# ---------------------------------------------------------------------------

@app.get("/api/view/{view}")
def get_view(view: str, role: str = "fleet_manager", driver_id: Optional[str] = None):
    if role not in ROLES:
        raise HTTPException(400, f"unknown role '{role}'")
    if view not in ROLES[role]["views"]:
        raise HTTPException(403, f"role '{role}' cannot access view '{view}'")

    state = de.get_state()

    # --- Driver / Dispatcher self-service scoping -----------------------
    # A driver only has rights to their own trips and the vehicle(s) they've
    # actually driven -- never the full fleet/trip roster.
    is_self_scoped = role == "driver"
    my_trips_df = None
    my_vehicle_features = None
    if is_self_scoped:
        if not driver_id:
            raise HTTPException(400, "driver_id is required when role='driver'")
        kpis = _personal_kpis(state, driver_id)
        my_trips_df = state["trip_features"][state["trip_features"].license_no == driver_id]
        my_regs = set(my_trips_df["reg_no"].unique())
        my_vehicle_features = state["vehicle_features"][state["vehicle_features"].reg_no.isin(my_regs)]
    else:
        kpis = de.kpis(state)

    if view == "overview":
        if is_self_scoped:
            status_counts = my_trips_df["status"].value_counts().to_dict()
            cols = ["trip_id", "route_pair", "reg_no", "status",
                    "planned_distance_km", "cargo_weight_kg", "date"]
            recent = my_trips_df.sort_values("date", ascending=False)
            return {
                "kpis": kpis,
                "chart": {"type": "doughnut", "title": "My Trips by Status",
                          "labels": list(status_counts.keys()), "data": list(status_counts.values())},
                "table": _records(recent, cols, limit=20),
            }
        status_counts = state["vehicles"]["status"].value_counts().to_dict()
        trip_status_counts = state["trips"]["status"].value_counts().to_dict()
        return {
            "kpis": kpis,
            "chart": {
                "type": "doughnut",
                "title": "Vehicles by Status",
                "labels": list(status_counts.keys()),
                "data": list(status_counts.values()),
            },
            "chart2": {
                "type": "bar",
                "title": "Trips by Status",
                "labels": list(trip_status_counts.keys()),
                "data": list(trip_status_counts.values()),
            },
        }

    if view == "fleet":
        vf = my_vehicle_features if is_self_scoped else state["vehicle_features"]
        cols = ["reg_no", "name_model", "type", "status", "capacity_kg", "odometer_km",
                "total_trips_count", "total_km_driven", "utilization_rate",
                "avg_fuel_efficiency_km_l", "cost_per_km", "roi_pct"]
        by_type = vf.groupby("type").size()
        return {
            "kpis": kpis,
            "table": _records(vf, cols),
            "chart": {"type": "bar", "title": "My Vehicles by Type" if is_self_scoped else "Vehicles by Type",
                      "labels": by_type.index.tolist(), "data": by_type.values.tolist()},
        }

    if view == "drivers":
        df = state["driver_features"]
        cols = ["license_no", "name", "category", "status", "expiry", "days_to_license_expiry",
                "license_risk_bucket", "safety_score", "trip_completion_pct",
                "cancellation_rate", "composite_risk_score", "driver_risk_bucket"]
        risk_counts = df["driver_risk_bucket"].astype(str).value_counts().to_dict()
        license_counts = df["license_risk_bucket"].astype(str).value_counts().to_dict()
        return {
            "kpis": kpis,
            "table": _records(df, cols),
            "chart": {"type": "doughnut", "title": "Driver Risk Buckets",
                      "labels": list(risk_counts.keys()), "data": list(risk_counts.values())},
            "chart2": {"type": "bar", "title": "License Risk Buckets",
                       "labels": list(license_counts.keys()), "data": list(license_counts.values())},
        }

    if view == "trips":
        df = my_trips_df if is_self_scoped else state["trip_features"]
        cols = ["trip_id", "reg_no", "license_no", "route_pair", "vehicle_type",
                "cargo_weight_kg", "planned_distance_km", "cargo_to_capacity_ratio",
                "distance_bucket", "status", "date"]
        bucket_counts = df["distance_bucket"].astype(str).value_counts().to_dict()
        return {
            "kpis": kpis,
            "table": _records(df.sort_values("date", ascending=False), cols),
            "chart": {"type": "bar", "title": "My Trips by Distance Bucket" if is_self_scoped else "Trips by Distance Bucket",
                      "labels": list(bucket_counts.keys()), "data": list(bucket_counts.values())},
        }

    if view == "maintenance":
        df = state["maintenance"].sort_values("date", ascending=False)
        vf = state["vehicle_features"]
        due_soon = vf[vf["maintenance_due_soon"]][["reg_no", "name_model", "days_since_last_service", "km_since_last_service"]]
        by_type = state["maintenance"]["service_type"].value_counts()
        return {
            "kpis": kpis,
            "table": _records(df),
            "due_soon": _records(due_soon),
            "chart": {"type": "bar", "title": "Maintenance Records by Service Type",
                      "labels": by_type.index.tolist(), "data": by_type.values.tolist()},
        }

    if view == "fuel_expenses":
        vf = state["vehicle_features"]
        cols = ["reg_no", "name_model", "total_liters", "total_fuel_cost",
                "avg_fuel_efficiency_km_l", "fuel_efficiency_std", "fuel_anomaly_flag",
                "total_expense_cost", "fuel_cost_last_30_days", "fuel_cost_prior_30_days",
                "fuel_cost_trend_pct"]
        top_cost = vf.nlargest(10, "total_fuel_cost")
        return {
            "kpis": kpis,
            "table": _records(vf, cols),
            "chart": {"type": "bar", "title": "Top 10 Vehicles by Fuel Cost",
                      "labels": top_cost["reg_no"].tolist(), "data": top_cost["total_fuel_cost"].round(0).tolist()},
        }

    if view == "financial":
        vf = state["vehicle_features"]
        cols = ["reg_no", "name_model", "acquisition_cost", "total_km_driven",
                "maintenance_cost_total", "total_fuel_cost", "total_expense_cost",
                "cost_per_km", "roi_pct"]
        top_roi = vf.nlargest(10, "roi_pct")
        total_ops_cost = float((vf["maintenance_cost_total"] + vf["total_fuel_cost"] + vf["total_expense_cost"]).sum())
        return {
            "kpis": {**kpis, "total_operational_cost": round(total_ops_cost, 2)},
            "table": _records(vf, cols),
            "chart": {"type": "bar", "title": "Top 10 Vehicles by ROI %",
                      "labels": top_roi["reg_no"].tolist(), "data": top_roi["roi_pct"].round(2).tolist()},
        }

    if view == "predictions":
        vf = state["vehicle_features"]
        df_drv = state["driver_features"]
        maint_due = vf[vf["maintenance_due_soon"]][
            ["reg_no", "name_model", "days_since_last_service", "km_since_last_service"]]
        fuel_anom = vf[vf["fuel_anomaly_flag"]][
            ["reg_no", "name_model", "avg_fuel_efficiency_km_l", "fuel_efficiency_std"]]
        license_risk = df_drv[df_drv["license_risk_bucket"].astype(str).isin(["Critical", "Warning"])][
            ["license_no", "name", "expiry", "days_to_license_expiry", "license_risk_bucket"]]
        return {
            "kpis": kpis,
            "maintenance_due": _records(maint_due),
            "fuel_anomalies": _records(fuel_anom),
            "license_risk": _records(license_risk),
        }

    raise HTTPException(404, f"unknown view '{view}'")


# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def index():
    with open("templates/index.html") as f:
        return f.read()
