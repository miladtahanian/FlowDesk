from pydantic import Field
from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema


class TenantResponse(BaseSchema):
    id: str
    name: str
    slug: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    plan: str
    max_members: str
    max_workspaces: str
    max_projects: str
    is_active: bool
    created_at: datetime


class TenantUpdateRequest(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
