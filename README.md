# TransitOps - Fleet & Transit Management Platform

TransitOps is a modern, production-grade Fleet, Driver, and Trip Management Platform designed to streamline logistics, dispatch operations, and telemetry analytics.

The project features a **FastAPI** backend, a **PostgreSQL 17** database, and a **Vite + React** frontend, fully containerized using **Docker Compose**.

---

# System Architecture

TransitOps is built on a decoupled, multi-service architecture:

<img width="203" height="560" alt="image" src="https://github.com/user-attachments/assets/73ff7d31-ca0b-457c-a940-834fba07eda1" />

---

# Database Design & Integrity Rules (3NF)

The database consists of **9 core tables** representing the business domain.

| Table | Description |
|--------|-------------|
| `roles` | System roles |
| `users` | Staff authentication |
| `vehicles` | Fleet information |
| `drivers` | Driver records |
| `trips` | Dispatch and trip management |
| `maintenance_logs` | Vehicle maintenance history |
| `fuel_logs` | Fuel consumption records |
| `expenses` | Financial expense ledger |
| `audit_logs` | Database audit history using JSONB |

---

# Critical Design Decisions

## 1. UUIDv4 Primary Keys

All primary keys are randomly generated UUIDs.

Benefits:

- Prevents sequential ID crawling attacks
- Enables backend-generated IDs
- Supports distributed systems
- Improves insertion scalability

---

## 2. Double-Booking Prevention (Partial Unique Indexes)

The database ensures that a driver or vehicle can only participate in **one active dispatched trip**.

```sql
idx_vehicle_active_trip
ON trips(vehicle_id)
WHERE status = 'DISPATCHED';
```

```sql
idx_driver_active_trip
ON trips(driver_id)
WHERE status = 'DISPATCHED';
```

Enforcing these rules at the PostgreSQL level prevents race conditions that could occur with application-only validation.

---

## 3. Staff vs Driver Decoupling

Drivers are modeled as operational assets rather than authenticated users.

Only staff members log in to the dashboard.

Benefits:

- Cleaner security model
- Reduced authentication complexity
- Prevents unnecessary user records

---

## 4. Application-Level RBAC Enforcement

Roles are stored in the database:

```text
users.role_id
```

Authorization is enforced in FastAPI:

```python
Depends(RoleChecker(["ADMIN", "DISPATCHER"]))
```

This allows permission checks before database operations while keeping connection pooling efficient.

---

## 5. PostgreSQL Check Constraints

The database enforces business rules using check constraints.

Examples include:

- Costs must be greater than zero
- Distances must be positive
- Weights must be positive
- Completed trips require:
  - `actual_distance`
  - `completion_time`
- Completed maintenance records require:
  - `end_date`

---

# Quick Start (Docker Compose)

The easiest way to start the complete application stack.

## Running the Stack

From the repository root:

```bash
docker compose up --build -d
```

---

## Checking Status

```bash
docker compose ps
```

---

## Stopping the Stack

```bash
docker compose down
```

Remove all persistent database data:

```bash
docker compose down -v
```

---

# 🛠️ Local Developer Setup

## macOS / Linux

Navigate to the backend directory.

```bash
# Create virtual environment
python3.12 -m venv .venv

# Activate
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Start PostgreSQL only
docker compose up -d db

# Apply migrations
alembic upgrade head

# Seed mock data
python -m app.core.seed

# Run development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

## Windows (PowerShell)

```powershell
# Create virtual environment
python -m venv .venv

# Allow scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Activate
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env

# Start PostgreSQL
docker compose up -d db

# Apply migrations
alembic upgrade head

# Seed mock data
python -m app.core.seed

# Start FastAPI
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

---

# API Testing & Interactive Documentation

FastAPI automatically generates interactive API documentation.

## Steps

1. Start the backend (Docker or local).
2. Open:

```
http://localhost:8000/docs
```

3. Select an endpoint (for example):

```
GET /api/v1/ping
```

4. Click **Try it out**.
5. Click **Execute**.

Swagger UI will display live API responses directly from the connected PostgreSQL database.

---

# Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React + Vite |
| Backend | FastAPI |
| Database | PostgreSQL 17 |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Authentication | OAuth2 + JWT |
| Containers | Docker & Docker Compose |
| API Docs | Swagger UI / OpenAPI |

---
