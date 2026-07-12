import csv
import os
import uuid
from datetime import datetime, date
from decimal import Decimal
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Base
from app.models import Role, User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
from app.models.enums import VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, ExpenseType

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_csv_path(filename: str) -> str:
    # Go 4 levels up to reach repository root (TransitOps/)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    return os.path.join(base_dir, "test code", "csv_output", filename)

def parse_date(date_str: str) -> date:
    return datetime.strptime(date_str, "%Y-%m-%d").date()

def parse_datetime(date_str: str) -> datetime:
    return datetime.strptime(date_str, "%Y-%m-%d")

def seed_database():
    db: Session = SessionLocal()
    print("Starting database seeding...")

    try:
        # Clear existing tables first to ensure clean seed
        db.query(Expense).delete()
        db.query(FuelLog).delete()
        db.query(MaintenanceLog).delete()
        db.query(Trip).delete()
        db.query(Driver).delete()
        db.query(Vehicle).delete()
        db.query(User).delete()
        db.query(Role).delete()
        db.commit()
        print("Existing data cleared.")

        # 1. SEED ROLES
        roles_to_create = ["ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"]
        role_map = {}
        
        for r_name in roles_to_create:
            role = Role(name=r_name)
            db.add(role)
            db.flush()
            role_map[r_name] = role.id
        print("Roles seeded.")

        # 2. SEED ALL ROLE USERS
        demo_users = [
            ("admin@transitops.com",      "admin123",      "Admin User",       "ADMIN"),
            ("fleet@transitops.com",       "fleet123",      "Fleet Manager",    "FLEET_MANAGER"),
            ("dispatcher@transitops.com", "dispatcher123", "Alex Dispatcher",  "DISPATCHER"),
            ("safety@transitops.com",     "safety123",     "Safety Officer",   "SAFETY_OFFICER"),
            ("finance@transitops.com",    "finance123",    "Finance Analyst",  "FINANCIAL_ANALYST"),
        ]
        dispatcher_id = None
        for email, pwd, name, role_name in demo_users:
            u = User(
                email=email,
                password_hash=pwd_context.hash(pwd),
                full_name=name,
                role_id=role_map[role_name],
                is_active=True
            )
            db.add(u)
            db.flush()
            if role_name == "DISPATCHER":
                dispatcher_id = u.id
            print(f"User seeded: {email}")
        print("All demo users seeded.")

        # 3. SEED VEHICLES
        vehicle_map = {}
        with open(get_csv_path("vehicles.csv"), mode="r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                reg_no = row["reg_no"]
                status_str = row["status"].upper().replace(" ", "_")
                vehicle = Vehicle(
                    registration_number=reg_no,
                    name_model=row["name_model"],
                    type=row["type"],
                    capacity_kg=Decimal(row["capacity_kg"]),
                    odometer=Decimal(row["odometer_km"]),
                    acquisition_cost=Decimal(row["acquisition_cost"]),
                    status=VehicleStatus[status_str]
                )
                db.add(vehicle)
                db.flush()
                vehicle_map[reg_no] = vehicle.id
        print(f"Vehicles seeded ({len(vehicle_map)} records).")

        # 4. SEED DRIVERS
        driver_map = {}
        with open(get_csv_path("drivers.csv"), mode="r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                lic_no = row["license_no"]
                status_str = row["status"].upper().replace(" ", "_")
                driver = Driver(
                    name=row["name"],
                    license_number=lic_no,
                    license_category=row["category"],
                    license_expiry=parse_date(row["expiry"]),
                    contact_number=row["contact"],
                    trip_completion_pct=int(row["trip_completion_pct"]),
                    safety_score=Decimal(row["safety_score"]),
                    status=DriverStatus[status_str]
                )
                db.add(driver)
                db.flush()
                driver_map[lic_no] = driver.id
        print(f"Drivers seeded ({len(driver_map)} records).")

        # 5. SEED TRIPS WITH DATA CLEANING
        trip_map = {}
        active_drivers = set()
        active_vehicles = set()
        
        # Read trips and sort by date descending (to keep the newest trip active)
        trips_rows = []
        with open(get_csv_path("trips.csv"), mode="r") as f:
            reader = csv.DictReader(f)
            trips_rows = list(reader)
        
        # Sort trips by date descending so newer dispatches take priority
        trips_rows.sort(key=lambda x: x["date"], reverse=True)

        for row in trips_rows:
            t_code = row["trip_id"]
            status_str = row["status"].upper().replace(" ", "_")
            v_id = vehicle_map.get(row["reg_no"])
            d_id = driver_map.get(row["license_no"])
            
            if not v_id or not d_id:
                continue

            planned_dist = Decimal(row["planned_distance_km"])
            revenue_amt = Decimal("0.00")
            actual_dist = None
            disp_time = None
            comp_time = None
            trip_date = parse_datetime(row["date"])

            # Data Cleansing Logic for double dispatches
            if status_str == "DISPATCHED":
                if d_id in active_drivers or v_id in active_vehicles:
                    status_str = "COMPLETED"
                    actual_dist = planned_dist
                    revenue_amt = planned_dist * Decimal("5.50")
                    disp_time = trip_date
                    comp_time = trip_date
                else:
                    active_drivers.add(d_id)
                    active_vehicles.add(v_id)
                    disp_time = trip_date
            
            elif status_str == "COMPLETED":
                actual_dist = planned_dist
                revenue_amt = planned_dist * Decimal("5.50")
                disp_time = trip_date
                comp_time = trip_date

            trip = Trip(
                trip_code=t_code,
                vehicle_id=v_id,
                driver_id=d_id,
                dispatcher_id=dispatcher_id,
                source=row["source"],
                destination=row["destination"],
                cargo_weight=Decimal(row["cargo_weight_kg"]),
                planned_distance=planned_dist,
                actual_distance=actual_dist,
                status=TripStatus[status_str],
                dispatch_time=disp_time,
                completion_time=comp_time,
                revenue=revenue_amt
            )
            db.add(trip)
            db.flush()
            trip_map[t_code] = trip.id
            
        print(f"Trips seeded & cleansed ({len(trip_map)} records).")

        # 6. SEED MAINTENANCE
        maint_count = 0
        with open(get_csv_path("maintenance.csv"), mode="r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                v_id = vehicle_map.get(row["reg_no"])
                if not v_id:
                    continue
                
                status_str = "ACTIVE" if row["status"] == "Active" else "COMPLETED"
                maint_date = parse_date(row["date"])
                
                maint = MaintenanceLog(
                    vehicle_id=v_id,
                    service_type=row["service_type"],
                    cost=Decimal(row["cost"]),
                    status=MaintenanceStatus[status_str],
                    start_date=maint_date,
                    end_date=maint_date if status_str == "COMPLETED" else None
                )
                db.add(maint)
                maint_count += 1
        print(f"Maintenance records seeded ({maint_count} records).")

        # 7. SEED FUEL LOGS WITH SAFE ODOMETER VALUES
        fuel_count = 0
        vehicle_fuel_counts = {}
        with open(get_csv_path("fuel_logs.csv"), mode="r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                v_id = vehicle_map.get(row["reg_no"])
                if not v_id:
                    continue
                
                log_date = parse_date(row["date"])
                liters = Decimal(row["liters"])
                cost = Decimal(row["fuel_cost"])
                
                # Fetch baseline vehicle odometer
                vehicle = db.query(Vehicle).filter(Vehicle.id == v_id).first()
                
                # Track fill logs per vehicle to decrement odometer backward safely
                v_count = vehicle_fuel_counts.get(v_id, 0)
                vehicle_fuel_counts[v_id] = v_count + 1
                
                # Odometer decrements by 150km per fill, guaranteed to stop at 0
                odo = max(Decimal("0.00"), vehicle.odometer - Decimal(v_count * 150))

                fuel = FuelLog(
                    vehicle_id=v_id,
                    date=log_date,
                    liters=liters,
                    cost=cost,
                    odometer=odo
                )
                db.add(fuel)
                fuel_count += 1
        print(f"Fuel logs seeded ({fuel_count} records).")

        # 8. SEED EXPENSES
        expense_count = 0
        with open(get_csv_path("expenses.csv"), mode="r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                t_id = trip_map.get(row["trip_id"])
                v_id = vehicle_map.get(row["reg_no"])
                if not v_id or not t_id:
                    continue

                trip = db.query(Trip).filter(Trip.id == t_id).first()
                exp_date = trip.dispatch_time.date() if trip.dispatch_time else date.today()

                toll_amt = Decimal(row["toll"])
                if toll_amt > 0:
                    toll_exp = Expense(
                        vehicle_id=v_id,
                        trip_id=t_id,
                        amount=toll_amt,
                        type=ExpenseType.TOLL,
                        date=exp_date
                    )
                    db.add(toll_exp)
                    expense_count += 1

                maint_amt = Decimal(row["maintenance_linked"])
                if maint_amt > 0:
                    maint_exp = Expense(
                        vehicle_id=v_id,
                        trip_id=t_id,
                        amount=maint_amt,
                        type=ExpenseType.MAINTENANCE,
                        date=exp_date
                    )
                    db.add(maint_exp)
                    expense_count += 1

                other_amt = Decimal(row["other"])
                if other_amt > 0:
                    other_exp = Expense(
                        vehicle_id=v_id,
                        trip_id=t_id,
                        amount=other_amt,
                        type=ExpenseType.OTHER,
                        date=exp_date
                    )
                    db.add(other_exp)
                    expense_count += 1

        print(f"Expenses normalized and seeded ({expense_count} entries).")
        
        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
