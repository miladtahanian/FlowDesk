from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.task import Task
from app.models.project import Project, ProjectMember
from app.models.board import Board
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.repositories.activity import ActivityLogRepository
from typing import Optional
from datetime import datetime, timedelta, timezone


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.activity_repo = ActivityLogRepository(db)

    async def get_workspace_stats(
        self, workspace_id: str, tenant_id: str
    ) -> dict:
        projects = await self._get_workspace_projects(workspace_id)
        project_ids = [p.id for p in projects]

        total_tasks = 0
        completed_tasks = 0
        overdue_tasks = 0
        tasks_by_priority = {"low": 0, "medium": 0, "high": 0, "urgent": 0}
        tasks_by_status = {
            "todo": 0,
            "in_progress": 0,
            "review": 0,
            "done": 0,
        }

        if project_ids:
            boards = await self._get_projects_boards(project_ids)
            board_ids = [b.id for b in boards]

            if board_ids:
                tasks = await self._get_boards_tasks(board_ids)
                total_tasks = len(tasks)

                now = datetime.now(timezone.utc)
                for task in tasks:
                    if task.is_completed:
                        completed_tasks += 1
                        tasks_by_status["done"] += 1
                    elif task.due_date and task.due_date < now:
                        overdue_tasks += 1

                    if task.priority in tasks_by_priority:
                        tasks_by_priority[task.priority] += 1

        members = await self._get_workspace_members(workspace_id)
        total_members = len(members)

        recent_activity = await self.activity_repo.get_by_tenant(
            tenant_id, limit=10
        )

        return {
            "total_projects": len(projects),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "total_members": total_members,
            "tasks_by_priority": tasks_by_priority,
            "tasks_by_status": tasks_by_status,
            "recent_activity": [
                {
                    "id": a.id,
                    "action": a.action,
                    "entity_type": a.entity_type,
                    "entity_name": a.entity_name,
                    "created_at": a.created_at.isoformat(),
                }
                for a in recent_activity
            ],
        }

    async def get_project_stats(self, project_id: str) -> dict:
        boards = await self._get_projects_boards([project_id])
        board_ids = [b.id for b in boards]

        total_tasks = 0
        completed_tasks = 0
        overdue_tasks = 0
        tasks_by_priority = {"low": 0, "medium": 0, "high": 0, "urgent": 0}

        if board_ids:
            tasks = await self._get_boards_tasks(board_ids)
            total_tasks = len(tasks)

            now = datetime.now(timezone.utc)
            for task in tasks:
                if task.is_completed:
                    completed_tasks += 1
                elif task.due_date and task.due_date < now:
                    overdue_tasks += 1

                if task.priority in tasks_by_priority:
                    tasks_by_priority[task.priority] += 1

        completion_rate = (
            (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        )

        return {
            "total_boards": len(boards),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "completion_rate": round(completion_rate, 1),
            "tasks_by_priority": tasks_by_priority,
        }

    async def get_user_dashboard(self, user: User) -> dict:
        assigned_tasks = await self._get_user_assigned_tasks(user.id)
        overdue = 0
        due_soon = 0

        now = datetime.now(timezone.utc)
        soon = now + timedelta(days=7)

        for task in assigned_tasks:
            if not task.is_completed and task.due_date:
                if task.due_date < now:
                    overdue += 1
                elif task.due_date <= soon:
                    due_soon += 1

        return {
            "assigned_tasks": len(assigned_tasks),
            "overdue_tasks": overdue,
            "due_soon": due_soon,
            "completed_tasks": sum(
                1 for t in assigned_tasks if t.is_completed
            ),
        }

    async def _get_workspace_projects(self, workspace_id: str) -> list:
        from app.models.project import Project

        result = await self.db.execute(
            select(Project).where(
                Project.workspace_id == workspace_id,
                Project.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def _get_projects_boards(self, project_ids: list[str]) -> list:
        from app.models.board import Board

        result = await self.db.execute(
            select(Board).where(
                Board.project_id.in_(project_ids),
                Board.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def _get_boards_tasks(self, board_ids: list[str]) -> list:
        from app.models.board import BoardColumn

        result = await self.db.execute(
            select(BoardColumn).where(BoardColumn.board_id.in_(board_ids))
        )
        columns = list(result.scalars().all())
        column_ids = [c.id for c in columns]

        if not column_ids:
            return []

        result = await self.db.execute(
            select(Task).where(
                Task.column_id.in_(column_ids),
                Task.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())

    async def _get_workspace_members(self, workspace_id: str) -> list:
        from app.models.workspace import WorkspaceMember

        result = await self.db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id
            )
        )
        return list(result.scalars().all())

    async def _get_user_assigned_tasks(self, user_id: str) -> list:
        result = await self.db.execute(
            select(Task).where(
                Task.assignee_id == user_id,
                Task.deleted_at.is_(None),
            )
        )
        return list(result.scalars().all())
