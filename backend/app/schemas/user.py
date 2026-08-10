from pydantic import Field
from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema


class UserResponse(BaseSchema):
    id: str
    tenant_id: str
    email: str
    username: str
    full_name: str
    avatar_url: Optional[str] = None
    invitation_code: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime


class UserUpdateRequest(BaseSchema):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    avatar_url: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserListResponse(BaseSchema):
    items: list[UserResponse]
    total: int
