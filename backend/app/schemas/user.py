from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """Login form payload."""
    username: str = Field(..., example="admin")
    password: str = Field(..., min_length=4, example="secret123")


class TokenResponse(BaseModel):
    """JWT token returned after successful login."""
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int  # seconds


class UserInfo(BaseModel):
    """Basic user info embedded inside JWT payload."""
    id:        int
    username:  str
    full_name: Optional[str]
    email:     str
    group_id:  Optional[int]
    is_active: bool

    class Config:
        from_attributes = True


# ── Phase 2: User Master schemas ─────────────────────────────────────────────

class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username:  str      = Field(..., min_length=3, max_length=50, example="jdoe")
    email:     EmailStr = Field(..., example="jdoe@example.com")
    password:  str      = Field(..., min_length=6, example="Secret@123")
    full_name: Optional[str] = Field(None, max_length=100, example="John Doe")
    group_id:  Optional[int] = Field(None, example=1)
    is_active: bool          = Field(True)


class UserUpdate(BaseModel):
    """Schema for updating an existing user — all fields optional."""
    username:  Optional[str]      = Field(None, min_length=3, max_length=50)
    email:     Optional[EmailStr] = None
    full_name: Optional[str]      = Field(None, max_length=100)
    group_id:  Optional[int]      = None
    is_active: Optional[bool]     = None


class PasswordChange(BaseModel):
    """Schema for changing a user's password (admin action)."""
    new_password: str = Field(..., min_length=6, example="NewPass@456")


class UserResponse(BaseModel):
    """Full user record returned in API responses."""
    id:         int
    username:   str
    email:      str
    full_name:  Optional[str]
    group_id:   Optional[int]
    group_name: Optional[str] = None   # joined from Group
    is_active:  bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Paginated list of users."""
    total: int
    users: list[UserResponse]
