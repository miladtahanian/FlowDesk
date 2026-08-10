from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.workspace import Workspace, WorkspaceMember
from app.repositories.base import BaseRepository


class WorkspaceRepository(BaseRepository[Workspace]):
    def __init__(self, db: AsyncSession):
        super().__init__(Workspace, db)

    async def get_by_tenant(self, tenant_id: str, skip: int = 0, limit: int = 100) -> list[Workspace]:
        result = await self.db.execute(
            select(Workspace)
            .where(Workspace.tenant_id == tenant_id, Workspace.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_slug(self, tenant_id: str, slug: str) -> Optional[Workspace]:
        result = await self.db.execute(
            select(Workspace).where(
                Workspace.tenant_id == tenant_id,
                Workspace.slug == slug,
                Workspace.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_with_members(self, workspace_id: str) -> Optional[Workspace]:
        result = await self.db.execute(
            select(Workspace)
            .options(selectinload(Workspace.members).selectinload(WorkspaceMember.user))
            .where(Workspace.id == workspace_id)
        )
        return result.scalar_one_or_none()


class WorkspaceMemberRepository(BaseRepository[WorkspaceMember]):
    def __init__(self, db: AsyncSession):
        super().__init__(WorkspaceMember, db)

    async def get_by_workspace_and_user(self, workspace_id: str, user_id: str) -> Optional[WorkspaceMember]:
        result = await self.db.execute(
            select(WorkspaceMember).where(
                WorkspaceMember.workspace_id == workspace_id,
                WorkspaceMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_members_by_workspace(self, workspace_id: str) -> list[WorkspaceMember]:
        result = await self.db.execute(
            select(WorkspaceMember)
            .options(selectinload(WorkspaceMember.user))
            .where(WorkspaceMember.workspace_id == workspace_id)
        )
        return list(result.scalars().all())
