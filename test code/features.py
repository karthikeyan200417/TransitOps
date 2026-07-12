"""
feature_engineering.py
=======================
Computes vehicle-level, driver-level, and trip-level features straight from
the existing CSVs (vehicles, drivers, trips, maintenance, fuel_logs,
expenses) — NO schema changes, no new columns in the source data. Every
feature is derived at read-time using the formulas discussed.

"""

import os
import pandas as pd
import numpy as np

IN_DIR = "csv_output"
OUT_DIR = "csv_output"

# Assumed constants (tune these on demo day)
RATE_PER_KM = 15.0          # INR — used to estimate revenue for ROI, since no revenue column exists
MAINT_DUE_DAYS = 180
MAINT_DUE_KM = 8000
NOW = pd.Timestamp.now().normalize()


# ---------------------------------------------------------------------------
# Load
# ---------------------------------------------------------------------------

def load_data(in_dir=IN_DIR):
    vehicles = pd.read_csv(f"{in_dir}/vehicles.csv")
    drivers = pd.read_csv(f"{in_dir}/drivers.csv", parse_dates=["expiry"])
    trips = pd.read_csv(f"{in_dir}/trips.csv", parse_dates=["date"])
    maintenance = pd.read_csv(f"{in_dir}/maintenance.csv", parse_dates=["date"])
    fuel_logs = pd.read_csv(f"{in_dir}/fuel_logs.csv", parse_dates=["date"])
    expenses = pd.read_csv(f"{in_dir}/expenses.csv")
    return vehicles, drivers, trips, maintenance, fuel_logs, expenses


# ---------------------------------------------------------------------------
# Vehicle-level features
# ---------------------------------------------------------------------------

def compute_vehicle_features(vehicles, trips, maintenance, fuel_logs, expenses):
    completed = trips[trips.status == "Completed"]

    # vehicle_age_days — proxy: today - first trip date (fallback: 365 if no trips yet)
    first_trip = trips.groupby("reg_no")["date"].min().rename("first_trip_date")

    # last CLOSED service date per vehicle
    closed_maint = maintenance[maintenance.status == "Closed"]
    last_service = closed_maint.groupby("reg_no")["date"].max().rename("last_service_date")

    # trip aggregates
    total_trips_count = trips.groupby("reg_no").size().rename("total_trips_count")
    total_km_driven = completed.groupby("reg_no")["planned_distance_km"].sum().rename("total_km_driven")
    on_trip_count = trips[trips.status.isin(["Dispatched", "Completed"])].groupby("reg_no").size().rename("on_trip_count")
    capacity_util = trips.merge(vehicles[["reg_no", "capacity_kg"]], on="reg_no", how="left")
    capacity_util["ratio"] = capacity_util["cargo_weight_kg"] / capacity_util["capacity_kg"]
    capacity_util_avg = capacity_util.groupby("reg_no")["ratio"].mean().rename("capacity_utilization_avg")

    # maintenance aggregates
    maint_count = maintenance.groupby("reg_no").size().rename("maintenance_count")
    maint_cost_total = maintenance.groupby("reg_no")["cost"].sum().rename("maintenance_cost_total")

    # fuel aggregates
    fuel_liters_total = fuel_logs.groupby("reg_no")["liters"].sum().rename("total_liters")
    fuel_cost_total = fuel_logs.groupby("reg_no")["fuel_cost"].sum().rename("total_fuel_cost")

    # expenses aggregates (toll/other/maintenance-linked, per vehicle across its trips)
    expense_total = expenses.groupby("reg_no")["total"].sum().rename("total_expense_cost")

    # assemble
    feat = vehicles.set_index("reg_no")[["name_model", "type", "capacity_kg",
                                          "odometer_km", "acquisition_cost", "status"]].copy()
    feat = feat.join([first_trip, last_service, total_trips_count, total_km_driven,
                       on_trip_count, capacity_util_avg, maint_count, maint_cost_total,
                       fuel_liters_total, fuel_cost_total, expense_total])

    # fill defaults for vehicles with no trips/maintenance/fuel yet
    feat["total_trips_count"] = feat["total_trips_count"].fillna(0)
    feat["total_km_driven"] = feat["total_km_driven"].fillna(0)
    feat["on_trip_count"] = feat["on_trip_count"].fillna(0)
    feat["maintenance_count"] = feat["maintenance_count"].fillna(0)
    feat["maintenance_cost_total"] = feat["maintenance_cost_total"].fillna(0)
    feat["total_liters"] = feat["total_liters"].fillna(0)
    feat["total_fuel_cost"] = feat["total_fuel_cost"].fillna(0)
    feat["total_expense_cost"] = feat["total_expense_cost"].fillna(0)

    # vehicle_age_days (fallback to 365 if a vehicle has never had a trip)
    feat["vehicle_age_days"] = (NOW - feat["first_trip_date"]).dt.days
    feat["vehicle_age_days"] = feat["vehicle_age_days"].fillna(365).clip(lower=1)

    # days_since_last_service / km_since_last_service
    feat["days_since_last_service"] = (NOW - feat["last_service_date"]).dt.days
    no_service_mask = feat["last_service_date"].isna()

    def km_since_service(reg_no, last_date):
        if pd.isna(last_date):
            return feat.loc[reg_no, "total_km_driven"]  # never serviced -> all km counts
        mask = (completed.reg_no == reg_no) & (completed.date > last_date)
        return completed.loc[mask, "planned_distance_km"].sum()

    feat["km_since_last_service"] = [
        km_since_service(reg, feat.loc[reg, "last_service_date"]) for reg in feat.index
    ]

    # avg_km_per_trip
    feat["avg_km_per_trip"] = np.where(
        feat["total_trips_count"] > 0,
        feat["total_km_driven"] / feat["total_trips_count"].replace(0, np.nan),
        0,
    )

    # utilization_rate (proxy: on-trip-ish trips / age)
    feat["utilization_rate"] = (feat["on_trip_count"] / feat["vehicle_age_days"]).round(4)

    # maintenance_frequency (services per day)
    feat["maintenance_frequency"] = (feat["maintenance_count"] / feat["vehicle_age_days"]).round(5)

    # fuel efficiency: overall avg km/l
    feat["avg_fuel_efficiency_km_l"] = np.where(
        feat["total_liters"] > 0, feat["total_km_driven"] / feat["total_liters"], np.nan
    )

    # --- per-fillup efficiency estimate, for fuel_efficiency_std / anomaly flag ---
    # Estimate km driven between consecutive fuel fills using trip dates in that window,
    # then km/l for that fill = km_in_window / liters. This needs no new columns —
    # it only uses date ordering already present in fuel_logs and trips.
    per_fill_records = []
    for reg_no, grp in fuel_logs.sort_values("date").groupby("reg_no"):
        veh_trips = completed[completed.reg_no == reg_no].sort_values("date")
        prev_date = None
        for _, row in grp.iterrows():
            window_km = veh_trips.loc[
                (veh_trips.date > (prev_date if prev_date is not None else pd.Timestamp.min))
                & (veh_trips.date <= row["date"]),
                "planned_distance_km",
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

    # cost_per_km
    feat["cost_per_km"] = np.where(
        feat["total_km_driven"] > 0,
        (feat["maintenance_cost_total"] + feat["total_fuel_cost"] + feat["total_expense_cost"])
        / feat["total_km_driven"],
        np.nan,
    )

    # ROI — revenue estimated from km driven * assumed rate per km (no revenue column exists)
    estimated_revenue = feat["total_km_driven"] * RATE_PER_KM
    feat["roi_pct"] = (
        (estimated_revenue - (feat["maintenance_cost_total"] + feat["total_fuel_cost"]))
        / feat["acquisition_cost"]
    ).round(4)

    # time-windowed features
    maint_90 = maintenance[maintenance.date >= NOW - pd.Timedelta(days=90)]
    feat["maintenance_cost_last_90_days"] = (
        maint_90.groupby("reg_no")["cost"].sum().reindex(feat.index).fillna(0)
    )

    fuel_last_30 = fuel_logs[fuel_logs.date >= NOW - pd.Timedelta(days=30)]
    fuel_prior_30 = fuel_logs[(fuel_logs.date < NOW - pd.Timedelta(days=30))
                               & (fuel_logs.date >= NOW - pd.Timedelta(days=60))]
    feat["fuel_cost_last_30_days"] = fuel_last_30.groupby("reg_no")["fuel_cost"].sum().reindex(feat.index).fillna(0)
    feat["fuel_cost_prior_30_days"] = fuel_prior_30.groupby("reg_no")["fuel_cost"].sum().reindex(feat.index).fillna(0)
    feat["fuel_cost_trend_pct"] = np.where(
        feat["fuel_cost_prior_30_days"] > 0,
        (feat["fuel_cost_last_30_days"] - feat["fuel_cost_prior_30_days"]) / feat["fuel_cost_prior_30_days"] * 100,
        np.nan,
    )

    trips_7 = trips[trips.date >= NOW - pd.Timedelta(days=7)]
    feat["trips_last_7_days"] = trips_7.groupby("reg_no").size().reindex(feat.index).fillna(0)

    # flags
    feat["maintenance_due_soon"] = (
        (feat["days_since_last_service"].isna())  # never serviced
        | (feat["days_since_last_service"] > MAINT_DUE_DAYS)
        | (feat["km_since_last_service"] > MAINT_DUE_KM)
    )

    # fuel anomaly: does this vehicle have ANY fill more than 2 std away from its own mean?
    def has_anomaly(reg_no):
        rows = per_fill_df[per_fill_df.reg_no == reg_no]["efficiency_km_l"].dropna()
        if len(rows) < 2:
            return False
        mean, std = rows.mean(), rows.std()
        if std == 0 or pd.isna(std):
            return False
        return bool(((rows - mean).abs() > 2 * std).any())

    feat["fuel_anomaly_flag"] = [has_anomaly(reg) for reg in feat.index]

    feat = feat.reset_index().rename(columns={"index": "reg_no"})
    return feat


# ---------------------------------------------------------------------------
# Driver-level features
# ---------------------------------------------------------------------------

def compute_driver_features(drivers, trips):
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

    feat["days_to_license_expiry"] = (feat["expiry"] - NOW).dt.days

    months_active = ((NOW - feat["first_trip_date"]).dt.days / 30).clip(lower=1)
    feat["trips_per_month"] = (feat["total_trips"] / months_active).fillna(0).round(2)

    feat["cancellation_rate"] = np.where(
        feat["total_trips"] > 0, feat["cancelled_count"] / feat["total_trips"], 0
    )

    feat["composite_risk_score"] = (
        0.4 * (100 - feat["safety_score"])
        + 0.4 * (100 - feat["trip_completion_pct"])
        + 0.2 * (feat["cancellation_rate"] * 100)
    ).round(2)

    feat["license_risk_bucket"] = pd.cut(
        feat["days_to_license_expiry"],
        bins=[-np.inf, 14, 60, np.inf],
        labels=["Critical", "Warning", "Safe"],
    )

    # tertile split for driver_risk_bucket
    try:
        feat["driver_risk_bucket"] = pd.qcut(
            feat["composite_risk_score"], q=3, labels=["Low", "Medium", "High"], duplicates="drop"
        )
    except ValueError:
        feat["driver_risk_bucket"] = "Low"  # not enough spread in tiny sample

    feat = feat.reset_index().rename(columns={"index": "license_no"})
    return feat


# ---------------------------------------------------------------------------
# Trip-level features
# ---------------------------------------------------------------------------

def compute_trip_features(trips, vehicles):
    feat = trips.merge(vehicles[["reg_no", "capacity_kg", "type"]], on="reg_no", how="left")
    feat["cargo_to_capacity_ratio"] = (feat["cargo_weight_kg"] / feat["capacity_kg"]).round(3)
    feat["distance_bucket"] = pd.cut(
        feat["planned_distance_km"], bins=[0, 100, 400, np.inf], labels=["short", "medium", "long"]
    )
    feat["route_pair"] = feat["source"] + "→" + feat["destination"]
    feat = feat.rename(columns={"type": "vehicle_type"})
    return feat


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    vehicles, drivers, trips, maintenance, fuel_logs, expenses = load_data()

    print("Computing vehicle features...")
    vehicle_features = compute_vehicle_features(vehicles, trips, maintenance, fuel_logs, expenses)
    vehicle_features.to_csv(f"{OUT_DIR}/vehicle_features.csv", index=False)
    print(f"  wrote vehicle_features.csv  ({len(vehicle_features)} rows, "
          f"{len(vehicle_features.columns)} columns)")

    print("Computing driver features...")
    driver_features = compute_driver_features(drivers, trips)
    driver_features.to_csv(f"{OUT_DIR}/driver_features.csv", index=False)
    print(f"  wrote driver_features.csv  ({len(driver_features)} rows, "
          f"{len(driver_features.columns)} columns)")

    print("Computing trip features...")
    trip_features = compute_trip_features(trips, vehicles)
    trip_features.to_csv(f"{OUT_DIR}/trip_features.csv", index=False)
    print(f"  wrote trip_features.csv  ({len(trip_features)} rows, "
          f"{len(trip_features.columns)} columns)")

    print("Done.")


if __name__ == "__main__":
    main()