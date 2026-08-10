from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, ForbiddenException
from app.repositories.tenant import TenantRepository
from app.repositories.user import UserRepository
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantResponse, TenantUpdateRequest


class TenantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.tenant_repo = TenantRepository(db)
        self.user_repo = UserRepository(db)

    async def get_by_id(self, tenant_id: str) -> Tenant:
        tenant = await self.tenant_repo.get_by_id(tenant_id)
        if not tenant:
            raise NotFoundException("Tenant")
        return tenant

    async def get_current_tenant(self, user: User) -> Tenant:
        tenant = await self.tenant_repo.get_by_id(user.tenant_id)
        if not tenant:
            raise NotFoundException("Tenant")
        return tenant

    async def update_tenant(
        self, tenant: Tenant, data: TenantUpdateRequest
    ) -> Tenant:
        update_data = data.model_dump(exclude_unset=True)
        updated = await self.tenant_repo.update(tenant, update_data)
        return updated

    async def get_tenant_stats(self, tenant_id: str) -> dict:
        from app.repositories.workspace import WorkspaceRepository
        from app.repositories.project import ProjectRepository
        from app.repositories.board import BoardRepository
        from app.repositories.task import TaskRepository

        workspace_repo = WorkspaceRepository(self.db)
        project_repo = ProjectRepository(self.db)
        user_repo = UserRepository(self.db)

        workspaces = await workspace_repo.get_by_tenant(tenant_id)
        users = await user_repo.get_by_tenant(tenant_id)

        total_projects = 0
        for ws in workspaces:
            projects = await project_repo.get_by_workspace(ws.id)
            total_projects += len(projects)

        return {
            "total_workspaces": len(workspaces),
            "total_users": len(users),
            "total_projects": total_projects,
        }

    async def deactivate_tenant(self, tenant_id: str) -> None:
        tenant = await self.get_by_id(tenant_id)
        await self.tenant_repo.update(tenant, {"is_active": False})

    async def activate_tenant(self, tenant_id: str) -> None:
        tenant = await self.get_by_id(tenant_id)
        await self.tenant_repo.update(tenant, {"is_active": True})
