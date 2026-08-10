from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.core.security import get_password_hash
from app.repositories.user import UserRepository
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdateRequest, UserListResponse
from typing import Optional


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_by_id(self, user_id: str) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User")
        return user

    async def get_by_tenant(
        self, tenant_id: str, skip: int = 0, limit: int = 100
    ) -> list[User]:
        return await self.user_repo.get_by_tenant(tenant_id, skip, limit)

    async def get_tenant_users(
        self, tenant_id: str, skip: int = 0, limit: int = 100
    ) -> UserListResponse:
        users = await self.user_repo.get_by_tenant(tenant_id, skip, limit)
        return UserListResponse(
            items=[UserResponse.model_validate(u) for u in users],
            total=len(users),
        )

    async def update_user(
        self, user: User, data: UserUpdateRequest
    ) -> User:
        update_data = data.model_dump(exclude_unset=True)

        if "role" in update_data and update_data["role"]:
            if user.role not in (UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value):
                raise ForbiddenException("Only admins can change roles")

        if "email" in update_data:
            existing = await self.user_repo.get_by_email(update_data["email"])
            if existing and existing.id != user.id:
                raise ConflictException("Email already in use")

        if "username" in update_data:
            existing = await self.user_repo.get_by_username(update_data["username"])
            if existing and existing.id != user.id:
                raise ConflictException("Username already taken")

        updated = await self.user_repo.update(user, update_data)
        return updated

    async def deactivate_user(self, user_id: str, current_user: User) -> None:
        if current_user.id == user_id:
            raise ForbiddenException("Cannot deactivate yourself")

        target_user = await self.get_by_id(user_id)
        if target_user.tenant_id != current_user.tenant_id:
            raise ForbiddenException("Cannot deactivate users from other tenants")

        await self.user_repo.update(target_user, {"is_active": False})

    async def activate_user(self, user_id: str, current_user: User) -> None:
        target_user = await self.get_by_id(user_id)
        if target_user.tenant_id != current_user.tenant_id:
            raise ForbiddenException("Cannot activate users from other tenants")

        await self.user_repo.update(target_user, {"is_active": True})

    async def delete_user(self, user_id: str, current_user: User) -> None:
        if current_user.id == user_id:
            raise ForbiddenException("Cannot delete yourself")

        target_user = await self.get_by_id(user_id)
        if target_user.tenant_id != current_user.tenant_id:
            raise ForbiddenException("Cannot delete users from other tenants")

        await self.user_repo.soft_delete(target_user)

    async def search_users(
        self, tenant_id: str, query: str, limit: int = 20
    ) -> list[User]:
        from sqlalchemy import select

        result = await self.db.execute(
            select(User).where(
                User.tenant_id == tenant_id,
                User.deleted_at.is_(None),
                (
                    User.full_name.ilike(f"%{query}%")
                    | User.email.ilike(f"%{query}%")
                    | User.username.ilike(f"%{query}%")
                ),
            ).limit(limit)
        )
        return list(result.scalars().all())
