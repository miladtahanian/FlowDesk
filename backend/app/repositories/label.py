from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.models.label import Label, TaskLabel
from app.repositories.base import BaseRepository


class LabelRepository(BaseRepository[Label]):
    def __init__(self, db: AsyncSession):
        super().__init__(Label, db)

    async def get_by_project(self, project_id: str) -> list[Label]:
        result = await self.db.execute(
            select(Label)
            .where(Label.project_id == project_id)
            .order_by(Label.name)
        )
        return list(result.scalars().all())


class TaskLabelRepository(BaseRepository[TaskLabel]):
    def __init__(self, db: AsyncSession):
        super().__init__(TaskLabel, db)

    async def get_by_task(self, task_id: str) -> list[TaskLabel]:
        result = await self.db.execute(
            select(TaskLabel)
            .where(TaskLabel.task_id == task_id)
        )
        return list(result.scalars().all())

    async def get_by_label(self, label_id: str) -> list[TaskLabel]:
        result = await self.db.execute(
            select(TaskLabel)
            .where(TaskLabel.label_id == label_id)
        )
        return list(result.scalars().all())

    async def remove_by_task(self, task_id: str) -> None:
        entries = await self.get_by_task(task_id)
        for entry in entries:
            await self.db.delete(entry)
        await self.db.flush()
