from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.models.activity import ActivityLog, Notification, TimeEntry, Milestone
from app.repositories.base import BaseRepository


class ActivityLogRepository(BaseRepository[ActivityLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(ActivityLog, db)

    async def get_by_tenant(self, tenant_id: str, skip: int = 0, limit: int = 50) -> list[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog)
            .where(ActivityLog.tenant_id == tenant_id)
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_entity(self, entity_type: str, entity_id: str) -> list[ActivityLog]:
        result = await self.db.execute(
            select(ActivityLog)
            .where(ActivityLog.entity_type == entity_type, ActivityLog.entity_id == entity_id)
            .order_by(ActivityLog.created_at.desc())
        )
        return list(result.scalars().all())


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 50) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_unread_count(self, user_id: str) -> int:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(None))
        )
        return len(result.scalars().all())


class TimeEntryRepository(BaseRepository[TimeEntry]):
    def __init__(self, db: AsyncSession):
        super().__init__(TimeEntry, db)

    async def get_by_task(self, task_id: str) -> list[TimeEntry]:
        result = await self.db.execute(
            select(TimeEntry)
            .where(TimeEntry.task_id == task_id)
            .order_by(TimeEntry.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_user(self, user_id: str, skip: int = 0, limit: int = 100) -> list[TimeEntry]:
        result = await self.db.execute(
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id)
            .order_by(TimeEntry.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


class MilestoneRepository(BaseRepository[Milestone]):
    def __init__(self, db: AsyncSession):
        super().__init__(Milestone, db)

    async def get_by_project(self, project_id: str) -> list[Milestone]:
        result = await self.db.execute(
            select(Milestone)
            .where(Milestone.project_id == project_id, Milestone.deleted_at.is_(None))
            .order_by(Milestone.due_date)
        )
        return list(result.scalars().all())
