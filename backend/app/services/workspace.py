from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.repositories.workspace import WorkspaceRepository, WorkspaceMemberRepository
from app.repositories.project import ProjectRepository
from app.models.workspace import Workspace, WorkspaceMember
from app.models.user import User
from app.schemas.workspace import (
    WorkspaceCreateRequest,
    WorkspaceUpdateRequest,
    WorkspaceResponse,
    WorkspaceDetailResponse,
)
from app.utils.helpers import generate_slug


class WorkspaceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.workspace_repo = WorkspaceRepository(db)
        self.member_repo = WorkspaceMemberRepository(db)
        self.project_repo = ProjectRepository(db)

    async def get_by_id(self, workspace_id: str) -> Workspace:
        workspace = await self.workspace_repo.get_with_members(workspace_id)
        if not workspace:
            raise NotFoundException("Workspace")
        return workspace

    async def get_user_workspaces(
        self, tenant_id: str, user_id: str, skip: int = 0, limit: int = 100
    ) -> list[Workspace]:
        return await self.workspace_repo.get_by_tenant(tenant_id, skip, limit)

    async def create(
        self, data: WorkspaceCreateRequest, user: User
    ) -> Workspace:
        slug = generate_slug(data.name)
        existing = await self.workspace_repo.get_by_slug(user.tenant_id, slug)
        if existing:
            slug = f"{slug}-{generate_slug(user.username)}"
            if await self.workspace_repo.get_by_slug(user.tenant_id, slug):
                raise ConflictException("Workspace name already taken")

        workspace = Workspace(
            tenant_id=user.tenant_id,
            name=data.name,
            slug=slug,
            description=data.description,
            color=data.color or "#3B82F6",
            icon=data.icon or "folder",
            created_by=user.id,
        )
        workspace = await self.workspace_repo.create(workspace)

        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role="admin",
        )
        await self.member_repo.create(member)

        return workspace

    async def update(
        self, workspace_id: str, data: WorkspaceUpdateRequest, user: User
    ) -> Workspace:
        workspace = await self.get_by_id(workspace_id)
        self._check_permission(workspace, user)

        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            slug = generate_slug(update_data["name"])
            existing = await self.workspace_repo.get_by_slug(
                workspace.tenant_id, slug
            )
            if existing and existing.id != workspace.id:
                raise ConflictException("Workspace name already taken")
            update_data["slug"] = slug

        return await self.workspace_repo.update(workspace, update_data)

    async def delete(self, workspace_id: str, user: User) -> None:
        workspace = await self.get_by_id(workspace_id)
        self._check_permission(workspace, user)

        projects = await self.project_repo.get_by_workspace(workspace_id)
        if projects:
            raise ForbiddenException(
                "Cannot delete workspace with existing projects"
            )

        await self.workspace_repo.soft_delete(workspace)

    async def add_member(
        self, workspace_id: str, user_id: str, role: str, current_user: User
    ) -> WorkspaceMember:
        workspace = await self.get_by_id(workspace_id)
        self._check_permission(workspace, current_user)

        existing = await self.member_repo.get_by_workspace_and_user(
            workspace_id, user_id
        )
        if existing:
            raise ConflictException("User is already a member")

        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
        )
        return await self.member_repo.create(member)

    async def remove_member(
        self, workspace_id: str, user_id: str, current_user: User
    ) -> None:
        workspace = await self.get_by_id(workspace_id)
        self._check_permission(workspace, current_user)

        if current_user.id == user_id:
            raise ForbiddenException("Cannot remove yourself")

        member = await self.member_repo.get_by_workspace_and_user(
            workspace_id, user_id
        )
        if not member:
            raise NotFoundException("Member")

        await self.member_repo.delete(member)

    def _check_permission(self, workspace: Workspace, user: User) -> None:
        if workspace.tenant_id != user.tenant_id:
            raise ForbiddenException("Access denied")
