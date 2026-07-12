from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, get_token
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile
from app.services import auth_service

router = APIRouter()


@router.post("/login", response_model=TokenResponse, summary="Login and receive JWT token")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(payload, db)


@router.post("/logout", summary="Invalidate current JWT token")
def logout(
    token: str = Depends(get_token),
    current_user: User = Depends(get_current_user),
):
    return auth_service.logout(token)


@router.get("/profile", response_model=UserProfile, summary="Get current user's profile")
def profile(current_user: User = Depends(get_current_user)):
    return auth_service.get_profile(current_user)
