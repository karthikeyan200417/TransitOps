"""
generate_csv.py
================
Generates the six seed tables as plain CSV files — no database, no external
packages (stdlib only, so it runs anywhere including offline/no-network
environments). Matches the same schema/logic discussed earlier:

    vehicles, drivers, trips, maintenance   -> core fleet data
    fuel_logs                               -> synthetic, calibrated by vehicle type
    expenses                                -> synthetic tolls/misc per trip

Usage:
    python generate_csv.py
    (writes CSVs into ./csv_output/)

If you later get Hugging Face access working, swap generate_synthetic_core()
for the load_from_huggingface() version from seed_data.py and everything
downstream (fuel_logs/expenses generation, CSV writing) stays the same.
"""

import csv
import os
import random
import string
from datetime import datetime, timedelta

random.seed(42)

OUT_DIR = "csv_output"

STATE_CODES = ["GJ", "MH", "KA", "TN", "DL", "RJ"]
RTO_CODES = ["01", "02", "05", "07", "14"]
VEHICLE_TYPES = ["Truck", "Van", "Mini Truck", "Trailer"]
DEPOTS = ["Ahmedabad", "Gandhinagar", "Surat"]
FUEL_PRICE_PER_LITER = 96.5  # INR — update from a quick search on demo day

FUEL_RANGES_BY_TYPE = {
    "Truck":      {"liters_per_fill": (120, 220), "km_per_liter": (3.5, 5.5)},
    "Trailer":    {"liters_per_fill": (150, 260), "km_per_liter": (3.0, 4.5)},
    "Van":        {"liters_per_fill": (30, 60),   "km_per_liter": (8.0, 12.0)},
    "Mini Truck": {"liters_per_fill": (40, 80),   "km_per_liter": (6.0, 9.0)},
}

FIRST_NAMES = ["Raven", "Aditi", "Karan", "Meera", "Vikram", "Sneha", "Arjun",
               "Priya", "Rohan", "Neha", "Farhan", "Divya", "Sameer", "Anjali", "Kabir"]
LAST_NAMES = ["Kapoor", "Sharma", "Patel", "Iyer", "Nair", "Singh", "Reddy",
              "Mehta", "Joshi", "Verma", "Rao", "Malhotra"]
SERVICE_TYPES = ["Oil Change", "Tire Replacement", "Brake Service", "Engine Repair", "AC Service"]


def fake_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def fake_phone():
    return f"+91-{random.randint(70000,99999)}{random.randint(10000,99999)}"


def random_date_within(days_back: int) -> datetime:
    return datetime.now() - timedelta(days=random.randint(0, days_back))


def make_reg_no(existing: set) -> str:
    while True:
        reg = (f"{random.choice(STATE_CODES)}{random.choice(RTO_CODES)}"
               f"{''.join(random.choices(string.ascii_uppercase, k=2))}"
               f"{random.randint(1000, 9999)}")
        if reg not in existing:
            existing.add(reg)
            return reg


# ---------------------------------------------------------------------------
# Core tables
# ---------------------------------------------------------------------------

def generate_vehicles(n=58):
    existing = set()
    rows = []
    for _ in range(n):
        rows.append({
            "reg_no": make_reg_no(existing),
            "name_model": f"{random.choice(['Tata','Ashok Leyland','Mahindra','Eicher'])} "
                          f"{random.choice(['407','1109','Bolero Pickup','Pro 3015'])}",
            "type": random.choice(VEHICLE_TYPES),
            "capacity_kg": random.choice([500, 1000, 1500, 2000, 3500, 5000]),
            "odometer_km": random.randint(1000, 200000),
            "acquisition_cost": random.randint(500000, 2500000),
            "status": random.choice(["Available", "On Trip", "In Shop", "Retired"]),
        })
    return rows


def generate_drivers(n=15):
    rows = []
    for i in range(n):
        expiry = (datetime.now() - timedelta(days=60)) if i == 0 else (
            datetime.now() + timedelta(days=random.randint(30, 700)))
        rows.append({
            "license_no": f"DL{random.randint(10,99)}{random.randint(100000,999999)}",
            "name": fake_name(),
            "category": random.choice(["LMV", "HMV", "Transport"]),
            "expiry": expiry.date().isoformat(),
            "contact": fake_phone(),
            "trip_completion_pct": random.randint(70, 100),
            "safety_score": random.randint(60, 100),
            "status": "Suspended" if i == 1 else random.choice(
                ["Available", "On Trip", "Off Duty"]),
        })
    return rows


def generate_trips(vehicles, drivers, n=40):
    rows = []
    for i in range(n):
        vehicle = random.choice(vehicles)
        driver = random.choice(drivers)
        cargo = random.randint(200, vehicle["capacity_kg"] + 800)  # some over capacity on purpose
        src, dst = random.sample(DEPOTS, 2)
        rows.append({
            "trip_id": f"TRIP{1000+i}",
            "reg_no": vehicle["reg_no"],
            "license_no": driver["license_no"],
            "source": src,
            "destination": dst,
            "cargo_weight_kg": cargo,
            "planned_distance_km": random.randint(20, 900),
            "status": random.choice(["Draft", "Dispatched", "Completed", "Cancelled"]),
            "date": random_date_within(45).date().isoformat(),
        })
    return rows


def generate_maintenance(vehicles, n=20):
    rows = []
    for _ in range(n):
        vehicle = random.choice(vehicles)
        rows.append({
            "reg_no": vehicle["reg_no"],
            "service_type": random.choice(SERVICE_TYPES),
            "cost": random.randint(1500, 40000),
            "date": random_date_within(180).date().isoformat(),
            "status": random.choice(["Active", "Closed"]),
        })
    return rows


def generate_fuel_logs(vehicles, entries_per_vehicle=(5, 10)):
    rows = []
    for v in vehicles:
        ranges = FUEL_RANGES_BY_TYPE[v["type"]]
        for _ in range(random.randint(*entries_per_vehicle)):
            liters = round(random.uniform(*ranges["liters_per_fill"]), 1)
            rows.append({
                "reg_no": v["reg_no"],
                "date": random_date_within(60).date().isoformat(),
                "liters": liters,
                "fuel_cost": round(liters * FUEL_PRICE_PER_LITER, 2),
            })
    return rows


def generate_expenses(trips):
    rows = []
    for t in trips:
        toll = round(random.uniform(50, 900), 2)
        other = round(random.uniform(0, 500), 2)
        maint_linked = random.choice([0, 0, 0, round(random.uniform(500, 5000), 2)])
        rows.append({
            "trip_id": t["trip_id"],
            "reg_no": t["reg_no"],
            "toll": toll,
            "other": other,
            "maintenance_linked": maint_linked,
            "total": round(toll + other + maint_linked, 2),
        })
    return rows


# ---------------------------------------------------------------------------
# Write CSVs
# ---------------------------------------------------------------------------

def write_csv(path, rows):
    if not rows:
        return
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f"  wrote {path}  ({len(rows)} rows)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    vehicles = generate_vehicles()
    drivers = generate_drivers()
    trips = generate_trips(vehicles, drivers)
    maintenance = generate_maintenance(vehicles)
    fuel_logs = generate_fuel_logs(vehicles)
    expenses = generate_expenses(trips)

    print("Writing CSVs...")
    write_csv(f"{OUT_DIR}/vehicles.csv", vehicles)
    write_csv(f"{OUT_DIR}/drivers.csv", drivers)
    write_csv(f"{OUT_DIR}/trips.csv", trips)
    write_csv(f"{OUT_DIR}/maintenance.csv", maintenance)
    write_csv(f"{OUT_DIR}/fuel_logs.csv", fuel_logs)
    write_csv(f"{OUT_DIR}/expenses.csv", expenses)
    print("Done.")


if __name__ == "__main__":
    main()
