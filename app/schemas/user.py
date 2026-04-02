from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: Literal["viewer", "analyst", "admin"] = "viewer"

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class UserRead(BaseModel):
    id: int
    email: str
    username: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserRoleUpdate(BaseModel):
    role: Literal["viewer", "analyst", "admin"]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
