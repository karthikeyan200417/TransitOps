from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.vehicles import router as vehicles_router
from app.api.drivers import router as drivers_router
from app.api.trips import router as trips_router
from app.api.maintenance import router as maintenance_router
from app.api.fuel import router as fuel_router
from app.api.expenses import router as expenses_router
from app.api.dashboard import router as dashboard_router
from app.api.analytics import router as analytics_router
from app.api.audit import router as audit_router

router = APIRouter()

# ── Health check ─────────────────────────────────────────────────────────────
@router.get("/ping", tags=["Health"])
def ping():
    return {"ping": "pong"}

# ── Auth ──────────────────────────────────────────────────────────────────────
router.include_router(auth_router,        prefix="/auth",        tags=["Auth"])

# ── Fleet ─────────────────────────────────────────────────────────────────────
router.include_router(vehicles_router,    prefix="/vehicles",    tags=["Vehicles"])
router.include_router(drivers_router,     prefix="/drivers",     tags=["Drivers"])
router.include_router(trips_router,       prefix="/trips",       tags=["Trips"])

# ── Operations ────────────────────────────────────────────────────────────────
router.include_router(maintenance_router, prefix="/maintenance", tags=["Maintenance"])
router.include_router(fuel_router,        prefix="/fuel",        tags=["Fuel Logs"])
router.include_router(expenses_router,    prefix="/expenses",    tags=["Expenses"])

# ── Insights ──────────────────────────────────────────────────────────────────
router.include_router(dashboard_router,   prefix="/dashboard",   tags=["Dashboard"])
router.include_router(analytics_router,   prefix="/analytics",   tags=["Analytics"])

# ── Audit ─────────────────────────────────────────────────────────────────────
router.include_router(audit_router,       prefix="/audit",       tags=["Audit Logs"])
