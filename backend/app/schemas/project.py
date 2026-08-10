from pydantic import Field, ConfigDict
from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema


class ProjectCreateRequest(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = "#10B981"
    icon: Optional[str] = "project"
    status: Optional[str] = "planning"
    priority: Optional[str] = "medium"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[int] = None


class ProjectUpdateRequest(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[int] = None
    is_archived: Optional[bool] = None


class ProjectResponse(BaseSchema):
    id: str
    workspace_id: str
    name: str
    slug: str
    description: Optional[str] = None
    color: str
    icon: str
    status: str
    priority: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[int] = None
    is_archived: bool
    created_by: str
    created_at: datetime
    updated_at: datetime


class ProjectMemberUserResponse(BaseSchema):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    username: str
    full_name: str


class ProjectMemberResponse(BaseSchema):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: str
    project_id: str
    role: str
    joined_at: datetime
    user: Optional[ProjectMemberUserResponse] = None


class ProjectDetailResponse(ProjectResponse):
    model_config = ConfigDict(from_attributes=True)
    
    members: list[ProjectMemberResponse] = []


class ProjectInviteRequest(BaseSchema):
    invitation_code: str = Field(..., min_length=1, max_length=20)


class ProjectInvitationResponse(BaseSchema):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    project_id: str
    invited_by: str
    email: str
    invitation_code: str
    status: str
    created_at: datetime
    responded_at: Optional[datetime] = None
    inviter: Optional[ProjectMemberUserResponse] = None
    project_name: Optional[str] = None
