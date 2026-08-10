from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, ConflictException
from app.repositories.label import LabelRepository, TaskLabelRepository
from app.models.label import Label, TaskLabel
from app.models.user import User
from app.schemas.label import LabelCreateRequest, LabelUpdateRequest


class LabelService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.label_repo = LabelRepository(db)
        self.task_label_repo = TaskLabelRepository(db)

    async def get_by_id(self, label_id: str) -> Label:
        label = await self.label_repo.get_by_id(label_id)
        if not label:
            raise NotFoundException("Label")
        return label

    async def get_by_project(self, project_id: str) -> list[Label]:
        return await self.label_repo.get_by_project(project_id)

    async def create(
        self, data: LabelCreateRequest, project_id: str, user: User
    ) -> Label:
        label = Label(
            project_id=project_id,
            name=data.name,
            color=data.color or "#3B82F6",
        )
        return await self.label_repo.create(label)

    async def update(
        self, label_id: str, data: LabelUpdateRequest, user: User
    ) -> Label:
        label = await self.get_by_id(label_id)
        update_data = data.model_dump(exclude_unset=True)
        return await self.label_repo.update(label, update_data)

    async def delete(self, label_id: str, user: User) -> None:
        label = await self.get_by_id(label_id)

        task_labels = await self.task_label_repo.get_by_label(label_id)
        if task_labels:
            for tl in task_labels:
                await self.task_label_repo.delete(tl)

        await self.label_repo.delete(label)

    async def add_to_task(
        self, task_id: str, label_id: str, user: User
    ) -> TaskLabel:
        existing = await self._get_task_label(task_id, label_id)
        if existing:
            raise ConflictException("Label already added to this task")

        task_label = TaskLabel(
            task_id=task_id,
            label_id=label_id,
        )
        return await self.task_label_repo.create(task_label)

    async def remove_from_task(
        self, task_id: str, label_id: str, user: User
    ) -> None:
        task_label = await self._get_task_label(task_id, label_id)
        if task_label:
            await self.task_label_repo.delete(task_label)

    async def _get_task_label(
        self, task_id: str, label_id: str
    ) -> TaskLabel | None:
        from sqlalchemy import select

        result = await self.db.execute(
            select(TaskLabel).where(
                TaskLabel.task_id == task_id,
                TaskLabel.label_id == label_id,
            )
        )
        return result.scalar_one_or_none()
