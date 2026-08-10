from pydantic import EmailStr, Field
from app.schemas.base import BaseSchema


class RegisterRequest(BaseSchema):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    tenant_name: str = Field(..., min_length=1, max_length=255)


class LoginRequest(BaseSchema):
    email: EmailStr
    password: str


class TokenResponse(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseSchema):
    refresh_token: str


class ForgotPasswordRequest(BaseSchema):
    email: EmailStr


class ResetPasswordRequest(BaseSchema):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class VerifyEmailRequest(BaseSchema):
    token: str


class ChangePasswordRequest(BaseSchema):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
