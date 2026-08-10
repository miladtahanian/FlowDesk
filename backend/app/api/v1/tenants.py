from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.repositories.tenant import TenantRepository
from app.schemas.tenant import TenantResponse, TenantUpdateRequest
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/current", response_model=TenantResponse)
async def get_current_tenant(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tenant_repo = TenantRepository(db)
    tenant = await tenant_repo.get_by_id(current_user.tenant_id)
    if not tenant:
        raise NotFoundException("Tenant")
    return TenantResponse.model_validate(tenant)


@router.put("/current", response_model=TenantResponse)
async def update_current_tenant(
    data: TenantUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tenant_repo = TenantRepository(db)
    tenant = await tenant_repo.get_by_id(current_user.tenant_id)
    if not tenant:
        raise NotFoundException("Tenant")
    updated = await tenant_repo.update(tenant, data.model_dump(exclude_unset=True))
    return TenantResponse.model_validate(updated)
