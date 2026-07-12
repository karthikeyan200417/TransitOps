from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Callable
from app.core.database import get_db
from app.core.security import decode_access_token, is_token_blacklisted
from app.models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract JWT, validate it, return the active User object."""
    token = credentials.credentials

    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id, User.is_active == True)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    return user


def get_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    return credentials.credentials


def require_roles(*allowed_roles: str) -> Callable:
    """
    Dependency factory — returns a FastAPI dependency that:
      1. Validates the JWT (via get_current_user)
      2. Checks the user's role against allowed_roles
      3. Raises 403 if the role is not permitted
      4. Returns the authenticated User so routes can use it directly

    Usage:
        current_user: User = Depends(require_roles("ADMIN", "FLEET_MANAGER"))
    """
    def _check_role(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access denied. Your role '{current_user.role.name}' is not "
                    f"authorised. Required: {', '.join(allowed_roles)}."
                ),
            )
        return current_user

    return _check_role


# ── Pre-built role guards (import & use directly in routers) ─────────────────

# Full access
ADMIN_ONLY          = require_roles("ADMIN")

# Vehicle & driver management
FLEET_WRITE         = require_roles("ADMIN", "FLEET_MANAGER")
FLEET_READ          = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER")

# Trip operations
TRIP_DISPATCH       = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER")
TRIP_READ           = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST")

# Maintenance
MAINTENANCE_WRITE   = require_roles("ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER")
MAINTENANCE_READ    = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER")

# Fuel
FUEL_WRITE          = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER")
FUEL_READ           = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST")

# Expenses
EXPENSE_WRITE       = require_roles("ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST")
EXPENSE_READ        = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER", "FINANCIAL_ANALYST")

# Dashboard — all roles
DASHBOARD_READ      = require_roles("ADMIN", "FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER", "FINANCIAL_ANALYST")

# Analytics
ANALYTICS_READ      = require_roles("ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER", "FINANCIAL_ANALYST")

# Audit — admin only
AUDIT_READ          = require_roles("ADMIN")
