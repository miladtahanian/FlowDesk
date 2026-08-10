from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import NotFoundException, ForbiddenException
from app.repositories.workspace import WorkspaceRepository, WorkspaceMemberRepository
from app.schemas.workspace import (
    WorkspaceCreateRequest, WorkspaceUpdateRequest,
    WorkspaceResponse, WorkspaceDetailResponse, WorkspaceMemberResponse,
)
from app.schemas.base import PaginatedResponse
from app.api.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.utils.helpers import generate_slug

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[WorkspaceResponse])
async def list_workspaces(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws_repo = WorkspaceRepository(db)
    skip = (page - 1) * page_size
    workspaces, total = await ws_repo.get_multi(
        skip=skip,
        limit=page_size,
        filters=[Workspace.tenant_id == current_user.tenant_id, Workspace.deleted_at.is_(None)],
    )
    return PaginatedResponse(
        items=[WorkspaceResponse.model_validate(w) for w in workspaces],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("/", response_model=WorkspaceResponse)
async def create_workspace(
    data: WorkspaceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws_repo = WorkspaceRepository(db)
    slug = generate_slug(data.name)

    workspace = Workspace(
        tenant_id=current_user.tenant_id,
        name=data.name,
        slug=slug,
        description=data.description,
        color=data.color or "#3B82F6",
        icon=data.icon or "folder",
        created_by=current_user.id,
    )
    workspace = await ws_repo.create(workspace)

    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=current_user.id,
        role="admin",
    )
    member_repo = WorkspaceMemberRepository(db)
    await member_repo.create(member)

    return WorkspaceResponse.model_validate(workspace)


@router.get("/{workspace_id}", response_model=WorkspaceDetailResponse)
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws_repo = WorkspaceRepository(db)
    workspace = await ws_repo.get_with_members(workspace_id)
    if not workspace or workspace.tenant_id != current_user.tenant_id or getattr(workspace, "deleted_at", None) is not None:
        raise NotFoundException("Workspace")
    return WorkspaceDetailResponse.model_validate(workspace)


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    data: WorkspaceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws_repo = WorkspaceRepository(db)
    workspace = await ws_repo.get_by_id(workspace_id)
    if not workspace or workspace.tenant_id != current_user.tenant_id or getattr(workspace, "deleted_at", None) is not None:
        raise NotFoundException("Workspace")
    updated = await ws_repo.update(workspace, data.model_dump(exclude_unset=True))
    return WorkspaceResponse.model_validate(updated)


@router.delete("/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ws_repo = WorkspaceRepository(db)
    workspace = await ws_repo.get_by_id(workspace_id)
    if not workspace or workspace.tenant_id != current_user.tenant_id:
        raise NotFoundException("Workspace")
    await ws_repo.soft_delete(workspace)
    return {"message": "Workspace deleted"}
