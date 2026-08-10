from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.activity import (
    ActivityLogRepository,
    NotificationRepository,
    TimeEntryRepository,
    MilestoneRepository,
)
from app.models.activity import ActivityLog, Notification, TimeEntry, Milestone
from app.models.user import User
from app.schemas.activity import (
    ActivityLogResponse,
    NotificationResponse,
    TimeEntryCreateRequest,
    MilestoneCreateRequest,
    MilestoneUpdateRequest,
)
from typing import Optional


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.activity_repo = ActivityLogRepository(db)
        self.notification_repo = NotificationRepository(db)
        self.time_entry_repo = TimeEntryRepository(db)
        self.milestone_repo = MilestoneRepository(db)

    async def log_activity(
        self,
        tenant_id: str,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        entity_name: str = None,
        details: str = None,
        ip_address: str = None,
        user_agent: str = None,
    ) -> ActivityLog:
        log = ActivityLog(
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        return await self.activity_repo.create(log)

    async def get_activity_logs(
        self,
        tenant_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> list[ActivityLog]:
        return await self.activity_repo.get_by_tenant(tenant_id, skip, limit)

    async def get_entity_activity(
        self, entity_type: str, entity_id: str
    ) -> list[ActivityLog]:
        return await self.activity_repo.get_by_entity(entity_type, entity_id)

    async def create_notification(
        self,
        user_id: str,
        tenant_id: str,
        type: str,
        title: str,
        message: str,
        entity_type: str = None,
        entity_id: str = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            type=type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        return await self.notification_repo.create(notification)

    async def get_user_notifications(
        self, user_id: str, skip: int = 0, limit: int = 50
    ) -> list[Notification]:
        return await self.notification_repo.get_by_user(user_id, skip, limit)

    async def get_unread_count(self, user_id: str) -> int:
        return await self.notification_repo.get_unread_count(user_id)

    async def mark_as_read(
        self, notification_id: str, user: User
    ) -> Notification:
        from datetime import datetime, timezone

        notification = await self.notification_repo.get_by_id(notification_id)
        if not notification:
            from app.core.exceptions import NotFoundException

            raise NotFoundException("Notification")

        if notification.user_id != user.id:
            from app.core.exceptions import ForbiddenException

            raise ForbiddenException("Not your notification")

        notification.is_read = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user: User) -> None:
        from datetime import datetime, timezone

        notifications = await self.notification_repo.get_by_user(user.id)
        for n in notifications:
            if n.is_read is None:
                n.is_read = datetime.now(timezone.utc)
        await self.db.flush()

    async def start_time_entry(
        self, task_id: str, user: User, description: str = None
    ) -> TimeEntry:
        from datetime import datetime, timezone

        entry = TimeEntry(
            task_id=task_id,
            user_id=user.id,
            description=description,
            start_time=datetime.now(timezone.utc),
        )
        return await self.time_entry_repo.create(entry)

    async def stop_time_entry(
        self, entry_id: str, user: User
    ) -> TimeEntry:
        from datetime import datetime, timezone

        entry = await self.time_entry_repo.get_by_id(entry_id)
        if not entry:
            from app.core.exceptions import NotFoundException

            raise NotFoundException("Time entry")

        if entry.user_id != user.id:
            from app.core.exceptions import ForbiddenException

            raise ForbiddenException("Not your time entry")

        entry.end_time = datetime.now(timezone.utc)
        entry.duration = int((entry.end_time - entry.start_time).total_seconds())
        await self.db.flush()
        await self.db.refresh(entry)
        return entry

    async def get_task_time_entries(self, task_id: str) -> list[TimeEntry]:
        return await self.time_entry_repo.get_by_task(task_id)

    async def get_user_time_entries(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> list[TimeEntry]:
        return await self.time_entry_repo.get_by_user(user_id, skip, limit)

    async def create_milestone(
        self, data: MilestoneCreateRequest, project_id: str, user: User
    ) -> Milestone:
        milestone = Milestone(
            project_id=project_id,
            name=data.name,
            description=data.description,
            due_date=data.due_date,
            created_by=user.id,
        )
        return await self.milestone_repo.create(milestone)

    async def update_milestone(
        self, milestone_id: str, data: MilestoneUpdateRequest, user: User
    ) -> Milestone:
        milestone = await self.milestone_repo.get_by_id(milestone_id)
        if not milestone:
            from app.core.exceptions import NotFoundException

            raise NotFoundException("Milestone")

        update_data = data.model_dump(exclude_unset=True)
        return await self.milestone_repo.update(milestone, update_data)

    async def get_project_milestones(
        self, project_id: str
    ) -> list[Milestone]:
        return await self.milestone_repo.get_by_project(project_id)

    async def delete_milestone(
        self, milestone_id: str, user: User
    ) -> None:
        milestone = await self.milestone_repo.get_by_id(milestone_id)
        if not milestone:
            from app.core.exceptions import NotFoundException

            raise NotFoundException("Milestone")

        await self.milestone_repo.soft_delete(milestone)
