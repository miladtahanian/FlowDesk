from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.models.workspace import Workspace
from app.models.board import Board

router = APIRouter()


@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    results = {"tasks": [], "projects": [], "workspaces": [], "boards": []}

    task_query = select(Task).where(
        Task.title.ilike(f"%{q}%"),
        Task.deleted_at.is_(None),
    ).limit(10)
    tasks = (await db.execute(task_query)).scalars().all()
    results["tasks"] = [{"id": t.id, "title": t.title, "type": "task"} for t in tasks]

    project_query = select(Project).where(
        Project.name.ilike(f"%{q}%"),
        Project.deleted_at.is_(None),
    ).limit(10)
    projects = (await db.execute(project_query)).scalars().all()
    results["projects"] = [{"id": p.id, "name": p.name, "type": "project"} for p in projects]

    ws_query = select(Workspace).where(
        Workspace.name.ilike(f"%{q}%"),
        Workspace.deleted_at.is_(None),
        Workspace.tenant_id == current_user.tenant_id,
    ).limit(10)
    workspaces = (await db.execute(ws_query)).scalars().all()
    results["workspaces"] = [{"id": w.id, "name": w.name, "type": "workspace"} for w in workspaces]

    board_query = select(Board).where(
        Board.name.ilike(f"%{q}%"),
        Board.deleted_at.is_(None),
    ).limit(10)
    boards = (await db.execute(board_query)).scalars().all()
    results["boards"] = [{"id": b.id, "name": b.name, "type": "board"} for b in boards]

    return results
