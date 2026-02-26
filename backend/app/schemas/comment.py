import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    task_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
