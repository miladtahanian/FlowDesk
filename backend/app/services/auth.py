from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import (
    create_tokens,
    verify_password,
    get_password_hash,
    decode_token,
)
from app.core.exceptions import (
    BadRequestException,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
)
from app.repositories.user import UserRepository
from app.repositories.tenant import TenantRepository
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    ChangePasswordRequest,
)
from app.schemas.user import UserResponse
from app.utils.helpers import generate_slug
from datetime import datetime, timezone


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.tenant_repo = TenantRepository(db)

    async def register(self, data: RegisterRequest) -> TokenResponse:
        if await self.user_repo.get_by_email(data.email):
            raise ConflictException("Email already registered")

        if await self.user_repo.get_by_username(data.username):
            raise ConflictException("Username already taken")

        slug = generate_slug(data.tenant_name)
        if await self.tenant_repo.get_by_slug(slug):
            slug = f"{slug}-{generate_slug(data.username)}"

        tenant = Tenant(name=data.tenant_name, slug=slug)
        tenant = await self.tenant_repo.create(tenant)

        user = User(
            tenant_id=tenant.id,
            email=data.email,
            username=data.username,
            full_name=data.full_name,
            hashed_password=get_password_hash(data.password),
            role=UserRole.ADMIN.value,
            is_active=True,
            is_verified=True,
        )
        user = await self.user_repo.create(user)

        tokens = create_tokens(user.id, tenant.id)
        return TokenResponse(**tokens)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)

        if not user or not verify_password(data.password, user.hashed_password):
            raise BadRequestException("Invalid email or password")

        if not user.is_active:
            raise BadRequestException("Account is deactivated")

        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        tokens = create_tokens(user.id, user.tenant_id)
        return TokenResponse(**tokens)

    async def refresh_token(self, refresh_token: str) -> TokenResponse:
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid token type")

        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id")

        user = await self.user_repo.get_by_id(user_id)

        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")

        tokens = create_tokens(user_id, tenant_id)
        return TokenResponse(**tokens)

    async def get_current_user(self, user_id: str) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive")
        return user

    async def change_password(
        self, user: User, data: ChangePasswordRequest
    ) -> None:
        if not verify_password(data.current_password, user.hashed_password):
            raise BadRequestException("Current password is incorrect")

        user.hashed_password = get_password_hash(data.new_password)
        await self.db.flush()

    async def forgot_password(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email)
        if not user:
            return
        # In production: generate reset token and send email
        pass

    async def verify_email(self, token: str) -> None:
        # In production: verify email token
        pass
