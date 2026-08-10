from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.repositories.label import LabelRepository, TaskLabelRepository
from app.schemas.label import (
    LabelCreateRequest, LabelUpdateRequest, LabelResponse,
    TaskLabelCreateRequest, TimeEntryCreateRequest, TimeEntryResponse,
    MilestoneCreateRequest, MilestoneUpdateRequest, MilestoneResponse,
)
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/project/{project_id}", response_model=list[LabelResponse])
async def list_labels(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    label_repo = LabelRepository(db)
    labels = await label_repo.get_by_project(project_id)
    return [LabelResponse.model_validate(l) for l in labels]


@router.post("/project/{project_id}", response_model=LabelResponse)
async def create_label(
    project_id: str,
    data: LabelCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    label_repo = LabelRepository(db)
    from app.models.label import Label
    label = Label(project_id=project_id, name=data.name, color=data.color or "#3B82F6")
    label = await label_repo.create(label)
    return LabelResponse.model_validate(label)


@router.put("/{label_id}", response_model=LabelResponse)
async def update_label(
    label_id: str,
    data: LabelUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    label_repo = LabelRepository(db)
    label = await label_repo.get_by_id(label_id)
    if not label:
        raise NotFoundException("Label")
    updated = await label_repo.update(label, data.model_dump(exclude_unset=True))
    return LabelResponse.model_validate(updated)


@router.delete("/{label_id}")
async def delete_label(
    label_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    label_repo = LabelRepository(db)
    label = await label_repo.get_by_id(label_id)
    if not label:
        raise NotFoundException("Label")
    await label_repo.delete(label)
    return {"message": "Label deleted"}


@router.post("/task/assign")
async def assign_label_to_task(
    data: TaskLabelCreateRequest,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tl_repo = TaskLabelRepository(db)
    from app.models.label import TaskLabel
    tl = TaskLabel(task_id=task_id, label_id=data.label_id)
    await tl_repo.create(tl)
    return {"message": "Label assigned"}


@router.post("/task/remove")
async def remove_label_from_task(
    data: TaskLabelCreateRequest,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tl_repo = TaskLabelRepository(db)
    await tl_repo.remove_by_task(task_id)
    return {"message": "Label removed"}


@router.post("/time", response_model=TimeEntryResponse)
async def create_time_entry(
    data: TimeEntryCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.activity import TimeEntry
    from app.repositories.activity import TimeEntryRepository
    te_repo = TimeEntryRepository(db)
    te = TimeEntry(
        task_id=data.task_id,
        user_id=current_user.id,
        description=data.description,
        start_time=data.start_time,
        end_time=data.end_time,
        duration=data.duration or 0,
    )
    te = await te_repo.create(te)
    return TimeEntryResponse.model_validate(te)


@router.get("/time/task/{task_id}", response_model=list[TimeEntryResponse])
async def list_time_entries_by_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.repositories.activity import TimeEntryRepository
    te_repo = TimeEntryRepository(db)
    entries = await te_repo.get_by_task(task_id)
    return [TimeEntryResponse.model_validate(e) for e in entries]


@router.post("/milestones/project/{project_id}", response_model=MilestoneResponse)
async def create_milestone(
    project_id: str,
    data: MilestoneCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.activity import Milestone
    from app.repositories.activity import MilestoneRepository
    m_repo = MilestoneRepository(db)
    ms = Milestone(
        project_id=project_id,
        name=data.name,
        description=data.description,
        due_date=data.due_date,
        created_by=current_user.id,
    )
    ms = await m_repo.create(ms)
    return MilestoneResponse.model_validate(ms)


@router.get("/milestones/project/{project_id}", response_model=list[MilestoneResponse])
async def list_milestones(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.repositories.activity import MilestoneRepository
    m_repo = MilestoneRepository(db)
    milestones = await m_repo.get_by_project(project_id)
    return [MilestoneResponse.model_validate(m) for m in milestones]


@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone(
    milestone_id: str,
    data: MilestoneUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.repositories.activity import MilestoneRepository
    m_repo = MilestoneRepository(db)
    ms = await m_repo.get_by_id(milestone_id)
    if not ms:
        raise NotFoundException("Milestone")
    updated = await m_repo.update(ms, data.model_dump(exclude_unset=True))
    return MilestoneResponse.model_validate(updated)
