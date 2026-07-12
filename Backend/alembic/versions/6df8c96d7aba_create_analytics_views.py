"""create_analytics_views

Revision ID: 6df8c96d7aba
Revises: ae361b14a043
Create Date: 2026-07-12 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '6df8c96d7aba'
down_revision: Union[str, Sequence[str], None] = 'ae361b14a043'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. CREATE VEHICLE FEATURES VIEW
    op.execute("""
    CREATE VIEW view_vehicle_features AS
    WITH trip_stats AS (
        SELECT 
            vehicle_id,
            MIN(dispatch_time)::date AS first_trip_date,
            COUNT(id) AS total_trips_count,
            COALESCE(SUM(planned_distance), 0) AS total_km_driven,
            COUNT(CASE WHEN status IN ('DISPATCHED', 'COMPLETED') THEN 1 END) AS on_trip_count,
            AVG(cargo_weight) AS avg_cargo_weight
        FROM trips
        GROUP BY vehicle_id
    ),
    maint_stats AS (
        SELECT 
            vehicle_id,
            MAX(end_date) AS last_service_date,
            COUNT(id) AS maintenance_count,
            COALESCE(SUM(cost), 0) AS maintenance_cost_total
        FROM maintenance_logs
        GROUP BY vehicle_id
    ),
    fuel_stats AS (
        SELECT 
            vehicle_id,
            COALESCE(SUM(liters), 0) AS total_liters,
            COALESCE(SUM(cost), 0) AS total_fuel_cost
        FROM fuel_logs
        GROUP BY vehicle_id
    ),
    expense_stats AS (
        SELECT 
            vehicle_id,
            COALESCE(SUM(amount), 0) AS total_expense_cost
        FROM expenses
        GROUP BY vehicle_id
    )
    SELECT 
        v.id AS id,
        v.registration_number AS reg_no,
        v.name_model,
        v.type,
        v.capacity_kg,
        v.odometer AS odometer_km,
        v.acquisition_cost,
        v.status,
        COALESCE(t.total_trips_count, 0) AS total_trips_count,
        COALESCE(t.total_km_driven, 0) AS total_km_driven,
        COALESCE(m.maintenance_count, 0) AS maintenance_count,
        COALESCE(m.maintenance_cost_total, 0) AS maintenance_cost_total,
        COALESCE(f.total_liters, 0) AS total_liters,
        COALESCE(f.total_fuel_cost, 0) AS total_fuel_cost,
        COALESCE(e.total_expense_cost, 0) AS total_expense_cost,
        
        -- Derived Age & Service
        COALESCE(CURRENT_DATE - t.first_trip_date, 365) AS vehicle_age_days,
        CURRENT_DATE - m.last_service_date AS days_since_last_service,
        
        -- KM driven since last service
        COALESCE(
            (SELECT SUM(planned_distance) FROM trips WHERE vehicle_id = v.id AND status = 'COMPLETED' AND (m.last_service_date IS NULL OR dispatch_time::date > m.last_service_date)),
            0
        ) AS km_since_last_service,

        -- Utilization & Avg KM
        CASE WHEN COALESCE(t.total_trips_count, 0) > 0 THEN ROUND(COALESCE(t.total_km_driven, 0) / t.total_trips_count, 2) ELSE 0 END AS avg_km_per_trip,
        ROUND(COALESCE(t.on_trip_count, 0)::numeric / COALESCE(CURRENT_DATE - t.first_trip_date, 365), 4) AS utilization_rate,
        ROUND(COALESCE(m.maintenance_count, 0)::numeric / COALESCE(CURRENT_DATE - t.first_trip_date, 365), 5) AS maintenance_frequency,
        
        -- Fuel efficiency (KM / Liter)
        CASE WHEN COALESCE(f.total_liters, 0) > 0 THEN ROUND(COALESCE(t.total_km_driven, 0) / f.total_liters, 2) ELSE 0 END AS avg_fuel_efficiency_km_l,
        
        -- Capacity Utilization Average
        ROUND(COALESCE(t.avg_cargo_weight, 0) / NULLIF(v.capacity_kg, 0), 3) AS capacity_utilization_avg,

        -- Cost per KM
        CASE WHEN COALESCE(t.total_km_driven, 0) > 0 THEN 
            ROUND((COALESCE(m.maintenance_cost_total, 0) + COALESCE(f.total_fuel_cost, 0) + COALESCE(e.total_expense_cost, 0)) / t.total_km_driven, 2)
            ELSE 0 
        END AS cost_per_km,

        -- Estimated ROI
        ROUND(((COALESCE(t.total_km_driven, 0) * 15.0 - (COALESCE(m.maintenance_cost_total, 0) + COALESCE(f.total_fuel_cost, 0))) / NULLIF(v.acquisition_cost, 0)) * 100, 2) AS roi_pct,
        
        -- Time Windowed Cost Aggregates
        COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id AND start_date >= CURRENT_DATE - 90), 0) AS maintenance_cost_last_90_days,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id AND date >= CURRENT_DATE - 30), 0) AS fuel_cost_last_30_days,
        COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id AND date BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 30), 0) AS fuel_cost_prior_30_days,
        COALESCE((SELECT COUNT(id) FROM trips WHERE vehicle_id = v.id AND dispatch_time::date >= CURRENT_DATE - 7), 0) AS trips_last_7_days,
        
        -- Maintenance Due Soon Flag
        CASE 
            WHEN (CURRENT_DATE - m.last_service_date) IS NULL 
                 OR (CURRENT_DATE - m.last_service_date) > 180 
                 OR COALESCE((SELECT SUM(planned_distance) FROM trips WHERE vehicle_id = v.id AND status = 'COMPLETED' AND (m.last_service_date IS NULL OR dispatch_time::date > m.last_service_date)), 0) > 8000 
            THEN TRUE 
            ELSE FALSE 
        END AS maintenance_due_soon
        
    FROM vehicles v
    LEFT JOIN trip_stats t ON t.vehicle_id = v.id
    LEFT JOIN maint_stats m ON m.vehicle_id = v.id
    LEFT JOIN fuel_stats f ON f.vehicle_id = v.id
    LEFT JOIN expense_stats e ON e.vehicle_id = v.id;
    """)

    # 2. CREATE DRIVER FEATURES VIEW
    op.execute("""
    CREATE VIEW view_driver_features AS
    WITH trip_stats AS (
        SELECT 
            driver_id,
            MIN(dispatch_time)::date AS first_trip_date,
            COUNT(id) AS total_trips,
            COALESCE(AVG(planned_distance), 0) AS avg_trip_distance,
            COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_count
        FROM trips
        GROUP BY driver_id
    )
    SELECT 
        d.id AS id,
        d.name,
        d.license_number AS license_no,
        d.license_category,
        d.license_expiry AS expiry,
        d.trip_completion_pct,
        d.safety_score,
        d.status,
        COALESCE(t.total_trips, 0) AS total_trips,
        COALESCE(t.avg_trip_distance, 0) AS avg_trip_distance,
        
        -- Cancellation rate
        ROUND(COALESCE(t.cancelled_count, 0)::numeric / NULLIF(t.total_trips, 0), 4) AS cancellation_rate,
        -- Days to license expiry
        d.license_expiry - CURRENT_DATE AS days_to_license_expiry,
        
        -- Trips per month
        ROUND(COALESCE(t.total_trips, 0)::numeric / NULLIF(COALESCE(CURRENT_DATE - t.first_trip_date, 30)::numeric / 30, 0), 2) AS trips_per_month,
        
        -- Composite Risk Score calculation
        ROUND(0.4 * (100 - d.safety_score) + 0.4 * (100 - d.trip_completion_pct) + 0.2 * (COALESCE(t.cancelled_count, 0)::numeric / NULLIF(t.total_trips, 0) * 100), 2) AS composite_risk_score,
        
        -- License risk bucket
        CASE 
            WHEN (d.license_expiry - CURRENT_DATE) < 14 THEN 'Critical'
            WHEN (d.license_expiry - CURRENT_DATE) < 60 THEN 'Warning'
            ELSE 'Safe'
        END AS license_risk_bucket
        
    FROM drivers d
    LEFT JOIN trip_stats t ON t.driver_id = d.id;
    """)

    # 3. CREATE TRIP FEATURES VIEW
    op.execute("""
    CREATE VIEW view_trip_features AS
    SELECT 
        t.id AS id,
        t.trip_code,
        t.source,
        t.destination,
        (t.source || ' → ' || t.destination) AS route_pair,
        t.cargo_weight AS cargo_weight_kg,
        t.planned_distance AS planned_distance_km,
        t.status,
        v.capacity_kg,
        ROUND(t.cargo_weight / NULLIF(v.capacity_kg, 0), 3) AS cargo_to_capacity_ratio,
        CASE 
            WHEN t.planned_distance < 100 THEN 'short'
            WHEN t.planned_distance < 400 THEN 'medium'
            ELSE 'long'
        END AS distance_bucket
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id;
    """)

def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS view_trip_features;")
    op.execute("DROP VIEW IF EXISTS view_driver_features;")
    op.execute("DROP VIEW IF EXISTS view_vehicle_features;")
