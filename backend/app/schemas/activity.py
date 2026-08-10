from typing import Optional
from datetime import datetime
from app.schemas.base import BaseSchema


class ActivityLogResponse(BaseSchema):
    id: str
    tenant_id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    entity_name: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class NotificationResponse(BaseSchema):
    id: str
    user_id: str
    tenant_id: str
    type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: Optional[datetime] = None
    created_at: datetime


class NotificationMarkReadRequest(BaseSchema):
    notification_ids: list[str]


class DashboardStatsResponse(BaseSchema):
    total_projects: int
    total_tasks: int
    completed_tasks: int
    overdue_tasks: int
    total_members: int
    tasks_by_priority: dict
    tasks_by_status: dict
    recent_activity: list
