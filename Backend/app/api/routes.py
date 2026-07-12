from fastapi import APIRouter

router = APIRouter()


# ── Health check (internal) ──────────────────────────────────────────────────
@router.get("/ping", tags=["Health"])
def ping():
    return {"ping": "pong"}


# ── TODO: import and include sub-routers below as they are built ─────────────
# from app.api.vehicles import router as vehicles_router
# from app.api.drivers  import router as drivers_router
# from app.api.trips    import router as trips_router
# from app.api.auth     import router as auth_router
#
# router.include_router(auth_router,     prefix="/auth",        tags=["Auth"])
# router.include_router(vehicles_router, prefix="/vehicles",    tags=["Vehicles"])
# router.include_router(drivers_router,  prefix="/drivers",     tags=["Drivers"])
# router.include_router(trips_router,    prefix="/trips",       tags=["Trips"])
