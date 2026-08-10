from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import create_tokens, verify_password, get_password_hash, decode_token
from app.core.exceptions import BadRequestException, UnauthorizedException, ConflictException
from app.repositories.user import UserRepository
from app.repositories.tenant import TenantRepository
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshTokenRequest, ForgotPasswordRequest, ChangePasswordRequest,
)
from app.schemas.user import UserResponse
from app.api.deps import get_current_user
from app.utils.helpers import generate_slug

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    tenant_repo = TenantRepository(db)

    if await user_repo.get_by_email(data.email):
        raise ConflictException("Email already registered")

    if await user_repo.get_by_username(data.username):
        raise ConflictException("Username already taken")

    from app.models.tenant import Tenant
    from app.models.user import User, UserRole

    slug = generate_slug(data.tenant_name)
    if await tenant_repo.get_by_slug(slug):
        slug = f"{slug}-{generate_slug(data.username)}"

    tenant = Tenant(name=data.tenant_name, slug=slug)
    tenant = await tenant_repo.create(tenant)

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
    user = await user_repo.create(user)
    await db.commit()

    tokens = create_tokens(user.id, tenant.id)
    return TokenResponse(**tokens)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(data.email)

    if not user or not verify_password(data.password, user.hashed_password):
        raise BadRequestException("Invalid email or password")

    if not user.is_active:
        raise BadRequestException("Account is deactivated")

    from datetime import datetime, timezone
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    tokens = create_tokens(user.id, user.tenant_id)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)

    if payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid token type")

    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    tokens = create_tokens(user_id, tenant_id)
    return TokenResponse(**tokens)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise BadRequestException("Current password is incorrect")

    user_repo = UserRepository(db)
    current_user.hashed_password = get_password_hash(data.new_password)
    await db.flush()

    return {"message": "Password changed successfully"}
