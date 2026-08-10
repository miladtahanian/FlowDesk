from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.exceptions import NotFoundException, ForbiddenException
from app.repositories.task import (
    TaskRepository,
    SubtaskRepository,
    ChecklistRepository,
    CommentRepository,
    AttachmentRepository,
)
from app.repositories.board import BoardColumnRepository
from app.repositories.label import TaskLabelRepository
from app.models.task import Task, Subtask, Checklist, Comment, Attachment
from app.models.user import User
from app.schemas.task import (
    TaskCreateRequest,
    TaskUpdateRequest,
    SubtaskCreateRequest,
    ChecklistCreateRequest,
    CommentCreateRequest,
)


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.task_repo = TaskRepository(db)
        self.subtask_repo = SubtaskRepository(db)
        self.checklist_repo = ChecklistRepository(db)
        self.comment_repo = CommentRepository(db)
        self.attachment_repo = AttachmentRepository(db)
        self.column_repo = BoardColumnRepository(db)
        self.task_label_repo = TaskLabelRepository(db)

    async def get_by_id(self, task_id: str) -> Task:
        task = await self.task_repo.get_with_details(task_id)
        if not task:
            raise NotFoundException("Task")
        return task

    async def get_by_column(self, column_id: str) -> list[Task]:
        return await self.task_repo.get_by_column(column_id)

    async def create(
        self, data: TaskCreateRequest, column_id: str, user: User
    ) -> Task:
        column = await self.column_repo.get_by_id(column_id)
        if not column:
            raise NotFoundException("Column")

        max_position = await self.task_repo.get_max_position(column_id)

        task = Task(
            column_id=column_id,
            title=data.title,
            description=data.description,
            position=max_position + 1,
            priority=data.priority or "medium",
            due_date=data.due_date,
            start_date=data.start_date,
            estimated_hours=data.estimated_hours,
            assignee_id=data.assignee_id,
            reporter_id=user.id,
            parent_task_id=data.parent_task_id,
        )
        task = await self.task_repo.create(task)

        if data.label_ids:
            from app.models.label import TaskLabel

            for label_id in data.label_ids:
                task_label = TaskLabel(
                    task_id=task.id,
                    label_id=label_id,
                )
                self.db.add(task_label)
            await self.db.flush()

        return await self.task_repo.get_with_details(task.id)

    async def update(
        self, task_id: str, data: TaskUpdateRequest, user: User
    ) -> Task:
        task = await self.get_by_id(task_id)
        update_data = data.model_dump(exclude_unset=True)

        if "is_completed" in update_data and update_data["is_completed"]:
            from datetime import datetime, timezone

            update_data["completed_at"] = datetime.now(timezone.utc)

        if "label_ids" in update_data:
            label_ids = update_data.pop("label_ids")
            await self.task_label_repo.remove_by_task(task_id)

            if label_ids:
                from app.models.label import TaskLabel

                for label_id in label_ids:
                    task_label = TaskLabel(
                        task_id=task_id,
                        label_id=label_id,
                    )
                    self.db.add(task_label)
                await self.db.flush()

        if update_data:
            task = await self.task_repo.update(task, update_data)

        return await self.task_repo.get_with_details(task_id)

    async def delete(self, task_id: str, user: User) -> None:
        task = await self.get_by_id(task_id)
        await self.task_repo.soft_delete(task)

    async def move_task(
        self,
        task_id: str,
        target_column_id: str,
        position: int,
        user: User,
    ) -> Task:
        task = await self.get_by_id(task_id)

        target_column = await self.column_repo.get_by_id(target_column_id)
        if not target_column:
            raise NotFoundException("Target column")

        source_column_id = task.column_id

        if source_column_id != target_column_id:
            tasks_in_source = await self.task_repo.get_by_column(source_column_id)
            for t in tasks_in_source:
                if t.position > task.position:
                    t.position -= 1

            task.column_id = target_column_id
            task.position = position

            tasks_in_target = await self.task_repo.get_by_column(target_column_id)
            for t in tasks_in_target:
                if t.id != task_id and t.position >= position:
                    t.position += 1
        else:
            tasks_in_column = await self.task_repo.get_by_column(source_column_id)
            old_position = task.position

            if position > old_position:
                for t in tasks_in_column:
                    if old_position < t.position <= position and t.id != task_id:
                        t.position -= 1
            elif position < old_position:
                for t in tasks_in_column:
                    if position <= t.position < old_position and t.id != task_id:
                        t.position += 1

            task.position = position

        await self.db.flush()
        return await self.task_repo.get_with_details(task_id)

    async def get_user_tasks(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> list[Task]:
        return await self.task_repo.get_by_assignee(user_id, skip, limit)

    async def add_subtask(
        self, task_id: str, data: SubtaskCreateRequest, user: User
    ) -> Subtask:
        task = await self.get_by_id(task_id)

        existing = await self.subtask_repo.get_by_task(task_id)
        max_position = max((s.position for s in existing), default=0)

        subtask = Subtask(
            task_id=task_id,
            title=data.title,
            position=max_position + 1,
        )
        return await self.subtask_repo.create(subtask)

    async def toggle_subtask(
        self, subtask_id: str, user: User
    ) -> Subtask:
        subtask = await self.subtask_repo.get_by_id(subtask_id)
        if not subtask:
            raise NotFoundException("Subtask")

        from datetime import datetime, timezone

        subtask.is_completed = not subtask.is_completed
        if subtask.is_completed:
            subtask.completed_at = datetime.now(timezone.utc)
        else:
            subtask.completed_at = None

        await self.db.flush()
        await self.db.refresh(subtask)
        return subtask

    async def delete_subtask(self, subtask_id: str, user: User) -> None:
        subtask = await self.subtask_repo.get_by_id(subtask_id)
        if not subtask:
            raise NotFoundException("Subtask")
        await self.subtask_repo.delete(subtask)

    async def add_checklist(
        self, task_id: str, data: ChecklistCreateRequest, user: User
    ) -> Checklist:
        task = await self.get_by_id(task_id)

        existing = await self.checklist_repo.get_by_task(task_id)
        max_position = max((c.position for c in existing), default=0)

        checklist = Checklist(
            task_id=task_id,
            title=data.title,
            position=max_position + 1,
        )
        return await self.checklist_repo.create(checklist)

    async def toggle_checklist(
        self, checklist_id: str, user: User
    ) -> Checklist:
        checklist = await self.checklist_repo.get_by_id(checklist_id)
        if not checklist:
            raise NotFoundException("Checklist")

        from datetime import datetime, timezone

        checklist.is_completed = not checklist.is_completed
        if checklist.is_completed:
            checklist.completed_at = datetime.now(timezone.utc)
        else:
            checklist.completed_at = None

        await self.db.flush()
        await self.db.refresh(checklist)
        return checklist

    async def delete_checklist(self, checklist_id: str, user: User) -> None:
        checklist = await self.checklist_repo.get_by_id(checklist_id)
        if not checklist:
            raise NotFoundException("Checklist")
        await self.checklist_repo.delete(checklist)

    async def add_comment(
        self, task_id: str, data: CommentCreateRequest, user: User
    ) -> Comment:
        task = await self.get_by_id(task_id)

        comment = Comment(
            task_id=task_id,
            author_id=user.id,
            content=data.content,
            parent_comment_id=data.parent_comment_id,
        )
        return await self.comment_repo.create(comment)

    async def get_comments(self, task_id: str) -> list[Comment]:
        return await self.comment_repo.get_by_task(task_id)

    async def delete_comment(self, comment_id: str, user: User) -> None:
        comment = await self.comment_repo.get_by_id(comment_id)
        if not comment:
            raise NotFoundException("Comment")

        if comment.author_id != user.id:
            raise ForbiddenException("Can only delete your own comments")

        await self.comment_repo.soft_delete(comment)

    async def update_position(
        self, task_id: str, position: int, user: User
    ) -> Task:
        task = await self.get_by_id(task_id)
        task.position = position
        await self.db.flush()
        return await self.task_repo.get_with_details(task_id)
