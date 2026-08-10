from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.project import Project, ProjectMember
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db: AsyncSession):
        super().__init__(Project, db)

    async def get_by_workspace(self, workspace_id: str, skip: int = 0, limit: int = 100) -> list[Project]:
        result = await self.db.execute(
            select(Project)
            .where(Project.workspace_id == workspace_id, Project.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_slug(self, workspace_id: str, slug: str) -> Optional[Project]:
        result = await self.db.execute(
            select(Project).where(
                Project.workspace_id == workspace_id,
                Project.slug == slug,
                Project.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_with_boards(self, project_id: str) -> Optional[Project]:
        result = await self.db.execute(
            select(Project)
            .options(selectinload(Project.boards), selectinload(Project.members).selectinload(ProjectMember.user))
            .where(Project.id == project_id)
        )
        return result.scalar_one_or_none()


class ProjectMemberRepository(BaseRepository[ProjectMember]):
    def __init__(self, db: AsyncSession):
        super().__init__(ProjectMember, db)

    async def get_by_project_and_user(self, project_id: str, user_id: str) -> Optional[ProjectMember]:
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()
