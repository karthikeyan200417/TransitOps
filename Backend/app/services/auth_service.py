from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, UserProfile
from app.core.security import verify_password, create_access_token, blacklist_token


def login(payload: LoginRequest, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email, User.is_active == True).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


def logout(token: str) -> dict:
    blacklist_token(token)
    return {"message": "Successfully logged out."}


def get_profile(current_user: User) -> UserProfile:
    return UserProfile.model_validate(current_user)
