from pydantic import Field, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema


class WorkspaceCreateRequest(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "folder"


class WorkspaceUpdateRequest(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    is_archived: Optional[bool] = None


class WorkspaceMemberUserResponse(BaseSchema):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    username: str
    full_name: str
    avatar_url: Optional[str] = None


class WorkspaceMemberResponse(BaseSchema):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    workspace_id: str
    role: str
    joined_at: datetime
    user: Optional[WorkspaceMemberUserResponse] = None


class WorkspaceResponse(BaseSchema):
    id: str
    tenant_id: str
    name: str
    slug: str
    description: Optional[str] = None
    color: str
    icon: str
    is_archived: bool
    created_by: str
    created_at: datetime
    updated_at: datetime


class WorkspaceDetailResponse(WorkspaceResponse):
    model_config = ConfigDict(from_attributes=True)
    
    members: list[WorkspaceMemberResponse] = []
