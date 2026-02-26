from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserRegister
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.utils.exceptions import ConflictException, UnauthorizedException
from app.utils.sanitize import sanitize_string


async def register_user(db: AsyncSession, data: UserRegister) -> User:
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictException("A user with this email already exists")

    user = User(
        name=sanitize_string(data.name),
        email=data.email,
        password=hash_password(data.password),
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password):
        raise UnauthorizedException("Invalid email or password")

    return user


def generate_tokens(user: User) -> dict:
    token_data = {"sub": str(user.id)}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
    }
