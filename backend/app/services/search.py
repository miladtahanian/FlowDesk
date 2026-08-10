from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.workspace import Workspace
from app.models.project import Project
from app.models.board import Board
from app.models.task import Task
from app.models.user import User
from typing import Optional


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def global_search(
        self,
        tenant_id: str,
        query: str,
        entity_type: Optional[str] = None,
        limit: int = 20,
    ) -> dict:
        results = {
            "workspaces": [],
            "projects": [],
            "boards": [],
            "tasks": [],
            "users": [],
        }

        if not entity_type or entity_type == "workspaces":
            results["workspaces"] = await self._search_workspaces(
                tenant_id, query, limit
            )

        if not entity_type or entity_type == "projects":
            results["projects"] = await self._search_projects(
                tenant_id, query, limit
            )

        if not entity_type or entity_type == "boards":
            results["boards"] = await self._search_boards(
                tenant_id, query, limit
            )

        if not entity_type or entity_type == "tasks":
            results["tasks"] = await self._search_tasks(
                tenant_id, query, limit
            )

        if not entity_type or entity_type == "users":
            results["users"] = await self._search_users(
                tenant_id, query, limit
            )

        return results

    async def _search_workspaces(
        self, tenant_id: str, query: str, limit: int
    ) -> list[dict]:
        result = await self.db.execute(
            select(Workspace).where(
                Workspace.tenant_id == tenant_id,
                Workspace.deleted_at.is_(None),
                or_(
                    Workspace.name.ilike(f"%{query}%"),
                    Workspace.description.ilike(f"%{query}%"),
                ),
            ).limit(limit)
        )
        workspaces = result.scalars().all()

        return [
            {
                "id": w.id,
                "name": w.name,
                "description": w.description,
                "color": w.color,
                "type": "workspace",
            }
            for w in workspaces
        ]

    async def _search_projects(
        self, tenant_id: str, query: str, limit: int
    ) -> list[dict]:
        result = await self.db.execute(
            select(Project)
            .join(Workspace, Project.workspace_id == Workspace.id)
            .where(
                Workspace.tenant_id == tenant_id,
                Project.deleted_at.is_(None),
                or_(
                    Project.name.ilike(f"%{query}%"),
                    Project.description.ilike(f"%{query}%"),
                ),
            ).limit(limit)
        )
        projects = result.scalars().all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "color": p.color,
                "status": p.status,
                "type": "project",
            }
            for p in projects
        ]

    async def _search_boards(
        self, tenant_id: str, query: str, limit: int
    ) -> list[dict]:
        result = await self.db.execute(
            select(Board)
            .join(Project, Board.project_id == Project.id)
            .join(Workspace, Project.workspace_id == Workspace.id)
            .where(
                Workspace.tenant_id == tenant_id,
                Board.deleted_at.is_(None),
                or_(
                    Board.name.ilike(f"%{query}%"),
                    Board.description.ilike(f"%{query}%"),
                ),
            ).limit(limit)
        )
        boards = result.scalars().all()

        return [
            {
                "id": b.id,
                "name": b.name,
                "description": b.description,
                "type": "board",
                "board_type": b.type,
            }
            for b in boards
        ]

    async def _search_tasks(
        self, tenant_id: str, query: str, limit: int
    ) -> list[dict]:
        from app.models.board import BoardColumn

        result = await self.db.execute(
            select(Task)
            .join(BoardColumn, Task.column_id == BoardColumn.id)
            .join(Board, BoardColumn.board_id == Board.id)
            .join(Project, Board.project_id == Project.id)
            .join(Workspace, Project.workspace_id == Workspace.id)
            .where(
                Workspace.tenant_id == tenant_id,
                Task.deleted_at.is_(None),
                or_(
                    Task.title.ilike(f"%{query}%"),
                    Task.description.ilike(f"%{query}%"),
                ),
            ).limit(limit)
        )
        tasks = result.scalars().all()

        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "priority": t.priority,
                "is_completed": t.is_completed,
                "type": "task",
            }
            for t in tasks
        ]

    async def _search_users(
        self, tenant_id: str, query: str, limit: int
    ) -> list[dict]:
        result = await self.db.execute(
            select(User).where(
                User.tenant_id == tenant_id,
                User.deleted_at.is_(None),
                or_(
                    User.full_name.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                    User.username.ilike(f"%{query}%"),
                ),
            ).limit(limit)
        )
        users = result.scalars().all()

        return [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "username": u.username,
                "avatar_url": u.avatar_url,
                "type": "user",
            }
            for u in users
        ]
