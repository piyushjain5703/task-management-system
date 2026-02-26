from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limiter import limiter
from app.deps.database import get_db
from app.deps.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserResponse, TokenResponse
from app.services.auth_service import register_user, authenticate_user, generate_tokens
from app.utils.response import success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=None)
@limiter.limit("5/minute")
async def register(request: Request, data: UserRegister, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, data)
    tokens = generate_tokens(user)
    return success_response(TokenResponse(**tokens).model_dump())


@router.post("/login", response_model=None)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user(db, form_data.username, form_data.password)
    tokens = generate_tokens(user)
    return success_response(TokenResponse(**tokens).model_dump())


@router.get("/me", response_model=None)
async def get_me(current_user: User = Depends(get_current_user)):
    return success_response(UserResponse.model_validate(current_user).model_dump())
