from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.repositories.project import ProjectRepository, ProjectMemberRepository
from app.repositories.board import BoardRepository
from app.repositories.invitation import ProjectInvitationRepository
from app.models.project import Project, ProjectMember, ProjectInvitation
from app.models.user import User
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectResponse,
)
from app.utils.helpers import generate_slug


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.project_repo = ProjectRepository(db)
        self.member_repo = ProjectMemberRepository(db)
        self.board_repo = BoardRepository(db)
        self.invitation_repo = ProjectInvitationRepository(db)

    async def get_by_id(self, project_id: str) -> Project:
        project = await self.project_repo.get_with_boards(project_id)
        if not project:
            raise NotFoundException("Project")
        return project

    async def get_by_workspace(
        self, workspace_id: str, skip: int = 0, limit: int = 100
    ) -> list[Project]:
        return await self.project_repo.get_by_workspace(workspace_id, skip, limit)

    async def create(
        self, data: ProjectCreateRequest, workspace_id: str, user: User
    ) -> Project:
        slug = generate_slug(data.name)
        existing = await self.project_repo.get_by_slug(workspace_id, slug)
        if existing:
            slug = f"{slug}-{generate_slug(user.username)}"
            if await self.project_repo.get_by_slug(workspace_id, slug):
                raise ConflictException("Project name already taken")

        project = Project(
            workspace_id=workspace_id,
            name=data.name,
            slug=slug,
            description=data.description,
            color=data.color or "#10B981",
            icon=data.icon or "project",
            status=data.status or "planning",
            priority=data.priority or "medium",
            start_date=data.start_date,
            end_date=data.end_date,
            budget=data.budget,
            created_by=user.id,
        )
        project = await self.project_repo.create(project)

        member = ProjectMember(
            project_id=project.id,
            user_id=user.id,
            role="admin",
        )
        await self.member_repo.create(member)

        return project

    async def update(
        self, project_id: str, data: ProjectUpdateRequest, user: User
    ) -> Project:
        project = await self.get_by_id(project_id)
        update_data = data.model_dump(exclude_unset=True)

        if "name" in update_data:
            slug = generate_slug(update_data["name"])
            existing = await self.project_repo.get_by_slug(
                project.workspace_id, slug
            )
            if existing and existing.id != project.id:
                raise ConflictException("Project name already taken")
            update_data["slug"] = slug

        return await self.project_repo.update(project, update_data)

    async def delete(self, project_id: str, user: User) -> None:
        project = await self.get_by_id(project_id)

        boards = await self.board_repo.get_by_project(project_id)
        if boards:
            raise ForbiddenException(
                "Cannot delete project with existing boards"
            )

        await self.project_repo.soft_delete(project)

    async def get_members(self, project_id: str) -> list[ProjectMember]:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(ProjectMember)
            .options(selectinload(ProjectMember.user))
            .where(ProjectMember.project_id == project_id)
        )
        return list(result.scalars().all())

    async def add_member(
        self,
        project_id: str,
        invitation_code: str,
        current_user: User,
    ) -> ProjectMember:
        from app.repositories.user import UserRepository

        user_repo = UserRepository(self.db)
        target_user = await user_repo.get_by_username(invitation_code)

        if not target_user:
            target_user = await user_repo.get_by_email(invitation_code)

        if not target_user:
            raise NotFoundException("User not found with this code")

        project = await self.get_by_id(project_id)
        if target_user.tenant_id != project.workspace_id:
            raise ForbiddenException("User is not in the same organization")

        existing = await self.member_repo.get_by_project_and_user(
            project_id, target_user.id
        )
        if existing:
            raise ConflictException("User is already a member")

        member = ProjectMember(
            project_id=project_id,
            user_id=target_user.id,
            role="member",
        )
        return await self.member_repo.create(member)

    async def remove_member(
        self, project_id: str, user_id: str, current_user: User
    ) -> None:
        member = await self.member_repo.get_by_project_and_user(
            project_id, user_id
        )
        if not member:
            raise NotFoundException("Member")

        if member.role == "admin":
            admin_count = await self._count_admins(project_id)
            if admin_count <= 1:
                raise ForbiddenException("Cannot remove the last admin")

        await self.member_repo.delete(member)

    async def _count_admins(self, project_id: str) -> int:
        from sqlalchemy import select, func

        result = await self.db.execute(
            select(func.count()).select_from(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.role == "admin",
            )
        )
        return result.scalar() or 0

    async def create_invitation(
        self,
        project_id: str,
        email: str,
        current_user: User,
    ) -> ProjectInvitation:
        existing = await self.invitation_repo.get_pending_by_project_and_email(
            project_id, email
        )
        if existing:
            raise ConflictException("Invitation already pending")

        import secrets

        invitation = ProjectInvitation(
            project_id=project_id,
            invited_by=current_user.id,
            email=email,
            invitation_code=secrets.token_urlsafe(6).upper(),
            status="pending",
        )
        return await self.invitation_repo.create(invitation)

    async def accept_invitation(
        self, invitation_id: str, current_user: User
    ) -> ProjectMember:
        invitation = await self.invitation_repo.get_by_id(invitation_id)
        if not invitation:
            raise NotFoundException("Invitation")

        if invitation.email != current_user.email:
            raise ForbiddenException("This invitation is not for you")

        if invitation.status != "pending":
            raise ForbiddenException("Invitation already processed")

        from datetime import datetime, timezone

        invitation.status = "accepted"
        invitation.responded_at = datetime.now(timezone.utc)
        await self.db.flush()

        existing = await self.member_repo.get_by_project_and_user(
            invitation.project_id, current_user.id
        )
        if existing:
            raise ConflictException("Already a member")

        member = ProjectMember(
            project_id=invitation.project_id,
            user_id=current_user.id,
            role="member",
        )
        return await self.member_repo.create(member)

    async def decline_invitation(
        self, invitation_id: str, current_user: User
    ) -> None:
        invitation = await self.invitation_repo.get_by_id(invitation_id)
        if not invitation:
            raise NotFoundException("Invitation")

        if invitation.email != current_user.email:
            raise ForbiddenException("This invitation is not for you")

        from datetime import datetime, timezone

        invitation.status = "declined"
        invitation.responded_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def get_invitations(self, project_id: str) -> list[ProjectInvitation]:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(ProjectInvitation)
            .options(selectinload(ProjectInvitation.inviter))
            .where(ProjectInvitation.project_id == project_id)
            .order_by(ProjectInvitation.created_at.desc())
        )
        return list(result.scalars().all())
