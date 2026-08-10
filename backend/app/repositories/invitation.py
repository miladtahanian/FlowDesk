from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.models.project import ProjectInvitation
from app.repositories.base import BaseRepository


class ProjectInvitationRepository(BaseRepository[ProjectInvitation]):
    def __init__(self, db: AsyncSession):
        super().__init__(ProjectInvitation, db)

    async def get_by_project(self, project_id: str) -> list[ProjectInvitation]:
        result = await self.db.execute(
            select(ProjectInvitation)
            .where(ProjectInvitation.project_id == project_id)
            .order_by(ProjectInvitation.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_pending_by_project_and_email(self, project_id: str, email: str) -> Optional[ProjectInvitation]:
        result = await self.db.execute(
            select(ProjectInvitation).where(
                ProjectInvitation.project_id == project_id,
                ProjectInvitation.email == email,
                ProjectInvitation.status == "pending",
            )
        )
        return result.scalar_one_or_none()

    async def get_pending_by_user(self, user_id: str) -> list[ProjectInvitation]:
        from app.models.user import User
        result = await self.db.execute(
            select(ProjectInvitation)
            .join(User, User.email == ProjectInvitation.email)
            .where(
                User.id == user_id,
                ProjectInvitation.status == "pending",
            )
            .order_by(ProjectInvitation.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_code(self, invitation_code: str) -> Optional[ProjectInvitation]:
        result = await self.db.execute(
            select(ProjectInvitation).where(
                ProjectInvitation.invitation_code == invitation_code,
                ProjectInvitation.status == "pending",
            )
        )
        return result.scalar_one_or_none()
