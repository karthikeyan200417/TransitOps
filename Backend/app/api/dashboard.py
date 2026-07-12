from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import DASHBOARD_READ
from app.models.user import User
from app.schemas.dashboard import DashboardOut
from app.services import dashboard_service

router = APIRouter()


@router.get(
    "",
    response_model=DashboardOut,
    summary="Get fleet dashboard KPIs",
    description="**Roles allowed:** All authenticated roles",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(DASHBOARD_READ),
):
    return dashboard_service.get_dashboard(db)
