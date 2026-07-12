from pydantic import BaseModel, EmailStr
import uuid


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoleOut(BaseModel):
    id: uuid.UUID
    name: str

    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool
    role: RoleOut

    model_config = {"from_attributes": True}
