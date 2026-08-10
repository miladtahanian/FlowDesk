from fastapi import Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.repositories.user import UserRepository

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    return user


async def get_current_active_user(
    current_user=Depends(get_current_user),
):
    if not current_user.is_verified:
        raise UnauthorizedException("Email not verified")
    return current_user


async def require_admin(
    current_user=Depends(get_current_user),
):
    if current_user.role not in ("super_admin", "admin"):
        raise ForbiddenException("Admin access required")
    return current_user
