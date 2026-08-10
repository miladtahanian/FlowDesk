from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.task import Task, Subtask, Checklist, Comment, Attachment
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    def __init__(self, db: AsyncSession):
        super().__init__(Task, db)

    async def get_by_column(self, column_id: str, skip: int = 0, limit: int = 100) -> list[Task]:
        result = await self.db.execute(
            select(Task)
            .where(Task.column_id == column_id, Task.deleted_at.is_(None))
            .order_by(Task.position)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_with_details(self, task_id: str) -> Optional[Task]:
        result = await self.db.execute(
            select(Task)
            .options(
                selectinload(Task.assignee),
                selectinload(Task.reporter),
                selectinload(Task.subtasks),
                selectinload(Task.checklists),
                selectinload(Task.comments).selectinload(Comment.author),
                selectinload(Task.attachments),
                selectinload(Task.labels),
                selectinload(Task.time_entries),
            )
            .where(Task.id == task_id)
        )
        return result.scalar_one_or_none()

    async def get_by_assignee(self, user_id: str, skip: int = 0, limit: int = 100) -> list[Task]:
        result = await self.db.execute(
            select(Task)
            .where(Task.assignee_id == user_id, Task.deleted_at.is_(None))
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_max_position(self, column_id: str) -> int:
        result = await self.db.execute(
            select(func.max(Task.position)).where(
                Task.column_id == column_id,
                Task.deleted_at.is_(None),
            )
        )
        return result.scalar() or 0


class SubtaskRepository(BaseRepository[Subtask]):
    def __init__(self, db: AsyncSession):
        super().__init__(Subtask, db)

    async def get_by_task(self, task_id: str) -> list[Subtask]:
        result = await self.db.execute(
            select(Subtask)
            .where(Subtask.task_id == task_id)
            .order_by(Subtask.position)
        )
        return list(result.scalars().all())


class ChecklistRepository(BaseRepository[Checklist]):
    def __init__(self, db: AsyncSession):
        super().__init__(Checklist, db)

    async def get_by_task(self, task_id: str) -> list[Checklist]:
        result = await self.db.execute(
            select(Checklist)
            .where(Checklist.task_id == task_id)
            .order_by(Checklist.position)
        )
        return list(result.scalars().all())


class CommentRepository(BaseRepository[Comment]):
    def __init__(self, db: AsyncSession):
        super().__init__(Comment, db)

    async def get_by_task(self, task_id: str) -> list[Comment]:
        result = await self.db.execute(
            select(Comment)
            .options(selectinload(Comment.author))
            .where(Comment.task_id == task_id, Comment.deleted_at.is_(None))
            .order_by(Comment.created_at)
        )
        return list(result.scalars().all())


class AttachmentRepository(BaseRepository[Attachment]):
    def __init__(self, db: AsyncSession):
        super().__init__(Attachment, db)

    async def get_by_task(self, task_id: str) -> list[Attachment]:
        result = await self.db.execute(
            select(Attachment)
            .where(Attachment.task_id == task_id)
            .order_by(Attachment.created_at.desc())
        )
        return list(result.scalars().all())
