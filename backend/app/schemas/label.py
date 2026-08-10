from pydantic import Field
from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema


class LabelCreateRequest(BaseSchema):
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = "#3B82F6"


class LabelUpdateRequest(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = None


class LabelResponse(BaseSchema):
    id: str
    project_id: str
    name: str
    color: str
    created_at: datetime


class TaskLabelCreateRequest(BaseSchema):
    label_id: str


class TimeEntryCreateRequest(BaseSchema):
    task_id: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[int] = 0


class TimeEntryUpdateRequest(BaseSchema):
    description: Optional[str] = None
    end_time: Optional[datetime] = None
    duration: Optional[int] = None


class TimeEntryResponse(BaseSchema):
    id: str
    task_id: str
    user_id: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: int
    created_at: datetime


class MilestoneCreateRequest(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: datetime


class MilestoneUpdateRequest(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None


class MilestoneResponse(BaseSchema):
    id: str
    project_id: str
    name: str
    description: Optional[str] = None
    due_date: datetime
    status: str
    created_by: str
    created_at: datetime
