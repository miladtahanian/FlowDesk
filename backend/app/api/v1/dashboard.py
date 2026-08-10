from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.activity import DashboardStatsResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.workspace import Workspace
from app.models.task import Task
from app.models.board import Board, BoardColumn
from app.models.activity import ActivityLog

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_count = (await db.execute(
        select(func.count()).select_from(Project).where(
            Project.workspace_id == workspace_id,
            Project.deleted_at.is_(None),
        )
    )).scalar() or 0

    project_ids_subq = (
        select(Project.id).where(Project.workspace_id == workspace_id)
    ).subquery()

    board_ids_subq = (
        select(Board.id).where(Board.project_id.in_(select(project_ids_subq.c.id)))
    ).subquery()

    column_ids_subq = (
        select(BoardColumn.id).where(BoardColumn.board_id.in_(select(board_ids_subq.c.id)))
    ).subquery()

    task_count = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id.in_(select(column_ids_subq.c.id)),
            Task.deleted_at.is_(None),
        )
    )).scalar() or 0

    completed_count = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id.in_(select(column_ids_subq.c.id)),
            Task.is_completed == True,
            Task.deleted_at.is_(None),
        )
    )).scalar() or 0

    overdue_count = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id.in_(select(column_ids_subq.c.id)),
            Task.due_date < func.now(),
            Task.is_completed == False,
            Task.deleted_at.is_(None),
        )
    )).scalar() or 0

    member_count = (await db.execute(
        select(func.count()).select_from(User).where(
            User.tenant_id == current_user.tenant_id,
            User.is_active == True,
            User.deleted_at.is_(None),
        )
    )).scalar() or 0

    urgent = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id.in_(select(column_ids_subq.c.id)),
            Task.priority == "urgent",
            Task.deleted_at.is_(None),
        )
    )).scalar() or 0

    high = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id.in_(select(column_ids_subq.c.id)),
            Task.priority == "high",
            Task.deleted_at.is_(None),
        )
    )).scalar() or 0

    medium = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id.in_(select(column_ids_subq.c.id)),
            Task.priority == "medium",
            Task.deleted_at.is_(None),
        )
    )).scalar() or 0

    low = (await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id.in_(select(column_ids_subq.c.id)),
            Task.priority == "low",
            Task.deleted_at.is_(None),
        )
    )).scalar() or 0

    recent = (await db.execute(
        select(ActivityLog)
        .where(ActivityLog.tenant_id == current_user.tenant_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
    )).scalars().all()

    return DashboardStatsResponse(
        total_projects=project_count,
        total_tasks=task_count,
        completed_tasks=completed_count,
        overdue_tasks=overdue_count,
        total_members=member_count,
        tasks_by_priority={"urgent": urgent, "high": high, "medium": medium, "low": low},
        tasks_by_status={"completed": completed_count, "total": task_count},
        recent_activity=[],
    )
