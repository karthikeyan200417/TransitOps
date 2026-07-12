from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, Role
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserProfile
from app.core.security import verify_password, hash_password, create_access_token, blacklist_token

VALID_ROLES = {"ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"}


def register(payload: RegisterRequest, db: Session) -> UserProfile:
    if payload.role.upper() not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Choose from: {', '.join(sorted(VALID_ROLES))}")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered.")
    role = db.query(Role).filter(Role.name == payload.role.upper()).first()
    if not role:
        raise HTTPException(status_code=400, detail="Role not found. Run database seed first.")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role_id=role.id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserProfile.model_validate(user)


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
