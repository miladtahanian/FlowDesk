from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.repositories.task import TaskRepository, SubtaskRepository, ChecklistRepository, CommentRepository
from app.schemas.task import (
    TaskCreateRequest, TaskUpdateRequest, TaskMoveRequest, TaskResponse, TaskDetailResponse,
    SubtaskCreateRequest, SubtaskUpdateRequest, SubtaskResponse,
    ChecklistCreateRequest, ChecklistUpdateRequest, ChecklistResponse,
    CommentCreateRequest, CommentUpdateRequest, CommentResponse,
)
from app.schemas.base import PaginatedResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/column/{column_id}", response_model=list[TaskResponse])
async def list_tasks_by_column(
    column_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repo = TaskRepository(db)
    tasks = await task_repo.get_by_column(column_id)
    return [TaskResponse.model_validate(t) for t in tasks]


@router.get("/my", response_model=list[TaskResponse])
async def list_my_tasks(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repo = TaskRepository(db)
    tasks = await task_repo.get_by_assignee(current_user.id, skip=skip, limit=limit)
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post("/", response_model=TaskResponse)
async def create_task(
    data: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repo = TaskRepository(db)
    position = await task_repo.get_max_position(data.column_id) + 1

    from app.models.task import Task
    task = Task(
        column_id=data.column_id,
        parent_task_id=data.parent_task_id,
        title=data.title,
        description=data.description,
        position=position,
        priority=data.priority or "medium",
        due_date=data.due_date,
        start_date=data.start_date,
        estimated_hours=data.estimated_hours,
        assignee_id=data.assignee_id,
        reporter_id=current_user.id,
    )
    task = await task_repo.create(task)

    if data.label_ids:
        from app.models.label import TaskLabel
        from app.repositories.label import TaskLabelRepository
        tl_repo = TaskLabelRepository(db)
        for label_id in data.label_ids:
            tl = TaskLabel(task_id=task.id, label_id=label_id)
            await tl_repo.create(tl)

    return TaskResponse.model_validate(task)


@router.get("/{task_id}", response_model=TaskDetailResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repo = TaskRepository(db)
    task = await task_repo.get_with_details(task_id)
    if not task:
        raise NotFoundException("Task")

    result = TaskDetailResponse.model_validate(task)
    result.comments_count = len(task.comments) if task.comments else 0
    return result


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    data: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repo = TaskRepository(db)
    task = await task_repo.get_by_id(task_id)
    if not task:
        raise NotFoundException("Task")

    update_data = data.model_dump(exclude_unset=True)
    label_ids = update_data.pop("label_ids", None)
    updated = await task_repo.update(task, update_data)

    if label_ids is not None:
        from app.repositories.label import TaskLabelRepository
        tl_repo = TaskLabelRepository(db)
        await tl_repo.remove_by_task(task_id)
        from app.models.label import TaskLabel
        for label_id in label_ids:
            tl = TaskLabel(task_id=task_id, label_id=label_id)
            await tl_repo.create(tl)

    return TaskResponse.model_validate(updated)


@router.put("/{task_id}/move", response_model=TaskResponse)
async def move_task(
    task_id: str,
    data: TaskMoveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repo = TaskRepository(db)
    task = await task_repo.get_by_id(task_id)
    if not task:
        raise NotFoundException("Task")

    updated = await task_repo.update(task, {
        "column_id": data.column_id,
        "position": data.position,
    })
    return TaskResponse.model_validate(updated)


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task_repo = TaskRepository(db)
    task = await task_repo.get_by_id(task_id)
    if not task:
        raise NotFoundException("Task")
    await task_repo.soft_delete(task)
    return {"message": "Task deleted"}


@router.post("/{task_id}/subtasks", response_model=SubtaskResponse)
async def create_subtask(
    task_id: str,
    data: SubtaskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subtask_repo = SubtaskRepository(db)
    from app.models.task import Subtask
    subtask = Subtask(task_id=task_id, title=data.title, position=data.position or 0)
    subtask = await subtask_repo.create(subtask)
    return SubtaskResponse.model_validate(subtask)


@router.put("/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(
    subtask_id: str,
    data: SubtaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subtask_repo = SubtaskRepository(db)
    subtask = await subtask_repo.get_by_id(subtask_id)
    if not subtask:
        raise NotFoundException("Subtask")
    updated = await subtask_repo.update(subtask, data.model_dump(exclude_unset=True))
    return SubtaskResponse.model_validate(updated)


@router.delete("/subtasks/{subtask_id}")
async def delete_subtask(
    subtask_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    subtask_repo = SubtaskRepository(db)
    subtask = await subtask_repo.get_by_id(subtask_id)
    if not subtask:
        raise NotFoundException("Subtask")
    await subtask_repo.delete(subtask)
    return {"message": "Subtask deleted"}


@router.post("/{task_id}/checklists", response_model=ChecklistResponse)
async def create_checklist(
    task_id: str,
    data: ChecklistCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    checklist_repo = ChecklistRepository(db)
    from app.models.task import Checklist
    cl = Checklist(task_id=task_id, title=data.title, position=data.position or 0)
    cl = await checklist_repo.create(cl)
    return ChecklistResponse.model_validate(cl)


@router.put("/checklists/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(
    checklist_id: str,
    data: ChecklistUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    checklist_repo = ChecklistRepository(db)
    cl = await checklist_repo.get_by_id(checklist_id)
    if not cl:
        raise NotFoundException("Checklist")
    updated = await checklist_repo.update(cl, data.model_dump(exclude_unset=True))
    return ChecklistResponse.model_validate(updated)


@router.delete("/checklists/{checklist_id}")
async def delete_checklist(
    checklist_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    checklist_repo = ChecklistRepository(db)
    cl = await checklist_repo.get_by_id(checklist_id)
    if not cl:
        raise NotFoundException("Checklist")
    await checklist_repo.delete(cl)
    return {"message": "Checklist deleted"}


@router.get("/{task_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment_repo = CommentRepository(db)
    comments = await comment_repo.get_by_task(task_id)
    return [CommentResponse.model_validate(c) for c in comments]


@router.post("/{task_id}/comments", response_model=CommentResponse)
async def create_comment(
    task_id: str,
    data: CommentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment_repo = CommentRepository(db)
    from app.models.task import Comment
    comment = Comment(
        task_id=task_id,
        author_id=current_user.id,
        content=data.content,
        parent_comment_id=data.parent_comment_id,
    )
    comment = await comment_repo.create(comment)
    return CommentResponse.model_validate(comment)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    data: CommentUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment_repo = CommentRepository(db)
    comment = await comment_repo.get_by_id(comment_id)
    if not comment:
        raise NotFoundException("Comment")
    if comment.author_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only edit your own comments")
    updated = await comment_repo.update(comment, data.model_dump(exclude_unset=True))
    return CommentResponse.model_validate(updated)


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment_repo = CommentRepository(db)
    comment = await comment_repo.get_by_id(comment_id)
    if not comment:
        raise NotFoundException("Comment")
    if comment.author_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("You can only delete your own comments")
    await comment_repo.soft_delete(comment)
    return {"message": "Comment deleted"}
