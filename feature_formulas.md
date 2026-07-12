# TransitOps — Feature Engineering Formula Reference

All formulas below are computed live from the six existing tables
(`vehicles`, `drivers`, `trips`, `maintenance`, `fuel_logs`, `expenses`) —
**no schema changes required.** Constants used throughout are listed at the
end so they can be tuned in one place before a demo.

---

## 1. Vehicle-level features

| # | Feature | Formula |
|---|---|---|
| 1 | `vehicle_age_days` | `today − MIN(trips.date WHERE trips.reg_no = X)` |
| 2 | `days_since_last_service` | `today − MAX(maintenance.date WHERE reg_no = X AND status = 'Closed')` |
| 3 | `km_since_last_service` | `SUM(trips.planned_distance_km WHERE reg_no = X AND date > last_service_date AND status = 'Completed')` |
| 4 | `total_trips_count` | `COUNT(trips WHERE reg_no = X)` |
| 5 | `total_km_driven` | `SUM(trips.planned_distance_km WHERE reg_no = X AND status = 'Completed')` |
| 6 | `avg_km_per_trip` | `total_km_driven / total_trips_count` |
| 7 | `utilization_rate` | `COUNT(trips WHERE reg_no = X AND status IN ('Dispatched','Completed')) / vehicle_age_days` |
| 8 | `maintenance_count` | `COUNT(maintenance WHERE reg_no = X)` |
| 9 | `maintenance_cost_total` | `SUM(maintenance.cost WHERE reg_no = X)` |
| 10 | `maintenance_frequency` | `maintenance_count / vehicle_age_days` |
| 11 | `avg_fuel_efficiency_km_l` | `total_km_driven / SUM(fuel_logs.liters WHERE reg_no = X)` |
| 12 | `fuel_efficiency_std` | `STDDEV(per_fill_efficiency)`, where for each fuel fill: `per_fill_efficiency = (SUM(trip distance between previous fill date and this fill date)) / liters` |
| 13 | `total_expense_cost` | `SUM(expenses.total WHERE reg_no = X)` |
| 14 | `cost_per_km` | `(maintenance_cost_total + SUM(fuel_logs.fuel_cost) + total_expense_cost) / total_km_driven` |
| 15 | `capacity_utilization_avg` | `AVG(trips.cargo_weight_kg / vehicles.capacity_kg WHERE reg_no = X)` |
| 16 | `estimated_revenue` | `total_km_driven × RATE_PER_KM` |
| 17 | `roi_pct` | `(estimated_revenue − (maintenance_cost_total + SUM(fuel_logs.fuel_cost))) / acquisition_cost` |

### Time-windowed (rolling) vehicle features

| # | Feature | Formula |
|---|---|---|
| 18 | `maintenance_cost_last_90_days` | `SUM(maintenance.cost WHERE reg_no = X AND date ≥ today − 90 days)` |
| 19 | `fuel_cost_last_30_days` | `SUM(fuel_logs.fuel_cost WHERE reg_no = X AND date ≥ today − 30 days)` |
| 20 | `fuel_cost_prior_30_days` | `SUM(fuel_logs.fuel_cost WHERE reg_no = X AND date BETWEEN today−60 AND today−30)` |
| 21 | `fuel_cost_trend_pct` | `(fuel_cost_last_30_days − fuel_cost_prior_30_days) / fuel_cost_prior_30_days × 100` |
| 22 | `trips_last_7_days` | `COUNT(trips WHERE reg_no = X AND date ≥ today − 7 days)` |

### Derived flags (vehicle)

| # | Feature | Formula |
|---|---|---|
| 23 | `maintenance_due_soon` | `days_since_last_service IS NULL OR days_since_last_service > MAINT_DUE_DAYS OR km_since_last_service > MAINT_DUE_KM` |
| 24 | `fuel_anomaly_flag` | `∃ fill WHERE \|per_fill_efficiency − avg_fuel_efficiency_km_l\| > 2 × fuel_efficiency_std` |

---

## 2. Driver-level features

| # | Feature | Formula |
|---|---|---|
| 25 | `days_to_license_expiry` | `drivers.expiry − today` |
| 26 | `trip_completion_rate` | `drivers.trip_completion_pct` (stored directly, no calculation) |
| 27 | `avg_trip_distance` | `AVG(trips.planned_distance_km WHERE license_no = X)` |
| 28 | `total_trips` | `COUNT(trips WHERE license_no = X)` |
| 29 | `months_active` | `MAX(1, (today − MIN(trips.date WHERE license_no = X)) / 30)` |
| 30 | `trips_per_month` | `total_trips / months_active` |
| 31 | `cancelled_count` | `COUNT(trips WHERE license_no = X AND status = 'Cancelled')` |
| 32 | `cancellation_rate` | `cancelled_count / total_trips` |
| 33 | `composite_risk_score` | `0.4 × (100 − safety_score) + 0.4 × (100 − trip_completion_pct) + 0.2 × (cancellation_rate × 100)` |
| 34 | `license_risk_bucket` | `days_to_license_expiry < 14 → "Critical"` · `< 60 → "Warning"` · `else → "Safe"` |
| 35 | `driver_risk_bucket` | Tertile split of `composite_risk_score` across all drivers → `"Low" / "Medium" / "High"` |

---

## 3. Trip-level features

| # | Feature | Formula |
|---|---|---|
| 36 | `cargo_to_capacity_ratio` | `trips.cargo_weight_kg / vehicles.capacity_kg` (joined on `reg_no`) |
| 37 | `distance_bucket` | `planned_distance_km < 100 → "short"` · `< 400 → "medium"` · `else → "long"` |
| 38 | `vehicle_type_encoded` | One-hot encoding of `vehicles.type` (`Truck / Van / Mini Truck / Trailer`) |
| 39 | `route_pair` | `source ⊕ "→" ⊕ destination` (string concatenation) |

---

## 4. Dashboard / Reports KPI formulas

These aren't per-row features but the aggregate KPIs shown on the Dashboard
and Reports & Analytics screens — included here since they reuse the same
underlying aggregates.

| KPI | Formula |
|---|---|
| Active Vehicles | `COUNT(vehicles WHERE status ≠ 'Retired')` |
| Available Vehicles | `COUNT(vehicles WHERE status = 'Available')` |
| Vehicles in Maintenance | `COUNT(vehicles WHERE status = 'In Shop')` |
| Active Trips | `COUNT(trips WHERE status = 'Dispatched')` |
| Pending Trips | `COUNT(trips WHERE status = 'Draft')` |
| Drivers on Duty | `COUNT(drivers WHERE status = 'On Trip')` |
| Fleet Utilization (%) | `COUNT(vehicles WHERE status = 'On Trip') / Active Vehicles × 100` |
| Fuel Efficiency (km/l) | `SUM(completed trip distance) / SUM(fuel_logs.liters)` |
| Operational Cost | `SUM(fuel_logs.fuel_cost) + SUM(maintenance.cost)` |
| Vehicle ROI (%) | `(Revenue − (Maintenance + Fuel)) / Acquisition Cost × 100` |
| Top Costliest Vehicles | `ORDER BY (fuel_cost + maintenance_cost) DESC LIMIT 3` |

---

## 5. Constants (tune before demo)

| Constant | Value used | Meaning |
|---|---|---|
| `RATE_PER_KM` | ₹15.0 | Assumed revenue per km driven — used to estimate revenue since no revenue column exists in the schema |
| `MAINT_DUE_DAYS` | 180 | Days since last service before a vehicle is flagged "due soon" |
| `MAINT_DUE_KM` | 8,000 | Km since last service before a vehicle is flagged "due soon" |
| Anomaly z-score threshold | 2.0 | Standard deviations from a vehicle's own mean fuel efficiency before a fill is flagged anomalous |
| License risk cutoffs | 14 / 60 days | Critical / Warning / Safe boundaries for `license_risk_bucket` |
| Risk score weights | 0.4 / 0.4 / 0.2 | Weighting of safety score, completion rate, and cancellation rate in `composite_risk_score` |

---

## Notes on design choices

- **No stored derived columns.** Every feature above is computed at read time from raw data already in the six tables — this means features never go stale and there's nothing to keep in sync when new trips/logs are added.
- **`fuel_efficiency_std` is a genuine per-fill estimate**, not a placeholder — it's derived by summing trip distance between consecutive fuel-log dates for the same vehicle, divided by liters used at that fill.
- **`roi_pct` depends on an assumed revenue rate** (`RATE_PER_KM`) because the schema has no revenue/billing column. If a real per-trip revenue figure becomes available, replace `estimated_revenue` with the real value and the rest of the formula is unchanged.
