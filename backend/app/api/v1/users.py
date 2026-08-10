from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import NotFoundException, ForbiddenException
from app.repositories.user import UserRepository
from app.schemas.user import UserResponse, UserUpdateRequest, UserListResponse
from app.api.deps import get_current_user, require_admin
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(db)
    users, total = await user_repo.get_multi(
        skip=skip,
        limit=limit,
        filters=[User.tenant_id == current_user.tenant_id, User.deleted_at.is_(None)],
    )
    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user or user.tenant_id != current_user.tenant_id:
        raise NotFoundException("User")
    return UserResponse.model_validate(user)


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(db)
    update_data = data.model_dump(exclude_unset=True)
    update_data.pop("role", None)
    update_data.pop("is_active", None)
    updated = await user_repo.update(current_user, update_data)
    return UserResponse.model_validate(updated)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user or user.tenant_id != current_user.tenant_id:
        raise NotFoundException("User")
    update_data = data.model_dump(exclude_unset=True)
    updated = await user_repo.update(user, update_data)
    return UserResponse.model_validate(updated)
