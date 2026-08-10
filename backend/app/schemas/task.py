from pydantic import Field
from typing import Optional, List
from datetime import datetime
from app.schemas.base import BaseSchema


class SubtaskCreateRequest(BaseSchema):
    title: str = Field(..., min_length=1, max_length=500)
    position: Optional[int] = 0


class SubtaskUpdateRequest(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    position: Optional[int] = None
    is_completed: Optional[bool] = None


class SubtaskResponse(BaseSchema):
    id: str
    task_id: str
    title: str
    position: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime


class ChecklistCreateRequest(BaseSchema):
    title: str = Field(..., min_length=1, max_length=255)
    position: Optional[int] = 0


class ChecklistUpdateRequest(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    position: Optional[int] = None
    is_completed: Optional[bool] = None


class ChecklistResponse(BaseSchema):
    id: str
    task_id: str
    title: str
    position: int
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime


class TaskCreateRequest(BaseSchema):
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    column_id: str
    parent_task_id: Optional[str] = None
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    assignee_id: Optional[str] = None
    label_ids: Optional[List[str]] = []


class TaskUpdateRequest(BaseSchema):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    column_id: Optional[str] = None
    position: Optional[int] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    assignee_id: Optional[str] = None
    is_completed: Optional[bool] = None
    is_archived: Optional[bool] = None
    label_ids: Optional[List[str]] = None


class TaskMoveRequest(BaseSchema):
    column_id: str
    position: int


class TaskResponse(BaseSchema):
    id: str
    column_id: str
    parent_task_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    position: int
    priority: str
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    estimated_hours: Optional[int] = None
    actual_hours: int
    assignee_id: Optional[str] = None
    reporter_id: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime


class TaskDetailResponse(TaskResponse):
    subtasks: list[SubtaskResponse] = []
    checklists: list[ChecklistResponse] = []
    assignee: Optional[dict] = None
    reporter: Optional[dict] = None
    labels: list[dict] = []
    attachments: list[dict] = []
    comments_count: int = 0


class CommentCreateRequest(BaseSchema):
    content: str = Field(..., min_length=1)
    parent_comment_id: Optional[str] = None


class CommentUpdateRequest(BaseSchema):
    content: str = Field(..., min_length=1)


class CommentResponse(BaseSchema):
    id: str
    task_id: str
    author_id: str
    content: str
    parent_comment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    author: Optional[dict] = None
    replies: list["CommentResponse"] = []
