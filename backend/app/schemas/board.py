from pydantic import Field
from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema
from app.schemas.task import TaskResponse


class BoardCreateRequest(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: Optional[str] = "kanban"
    is_default: Optional[bool] = False


class BoardUpdateRequest(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    type: Optional[str] = None
    is_default: Optional[bool] = None
    is_archived: Optional[bool] = None


class BoardResponse(BaseSchema):
    id: str
    project_id: str
    name: str
    description: Optional[str] = None
    type: str
    is_default: bool
    is_archived: bool
    created_by: str
    created_at: datetime


class ColumnCreateRequest(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    color: Optional[str] = "#6B7280"
    position: Optional[int] = 0
    wip_limit: Optional[int] = None


class ColumnUpdateRequest(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    color: Optional[str] = None
    position: Optional[int] = None
    wip_limit: Optional[int] = None
    is_archived: Optional[bool] = None


class ColumnResponse(BaseSchema):
    id: str
    board_id: str
    name: str
    color: str
    position: int
    wip_limit: Optional[int] = None
    is_default: bool
    is_archived: bool
    created_at: datetime


class ColumnDetailResponse(ColumnResponse):
    tasks: list[TaskResponse] = []


class BoardDetailResponse(BoardResponse):
    columns: list[ColumnDetailResponse] = []
