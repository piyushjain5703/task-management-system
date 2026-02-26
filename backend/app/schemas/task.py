import uuid
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(default="TODO", pattern="^(TODO|IN_PROGRESS|DONE)$")
    priority: Optional[str] = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH)$")
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[uuid.UUID] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(default=None, pattern="^(TODO|IN_PROGRESS|DONE)$")
    priority: Optional[str] = Field(default=None, pattern="^(LOW|MEDIUM|HIGH)$")
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[uuid.UUID] = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assigned_to: Optional[uuid.UUID] = None
    created_by: uuid.UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    creator: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class CommentBrief(BaseModel):
    id: uuid.UUID
    content: str
    task_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class FileBrief(BaseModel):
    id: uuid.UUID
    filename: str
    original_name: str
    mime_type: str
    size: int
    task_id: uuid.UUID
    uploaded_by: uuid.UUID
    created_at: datetime
    uploader: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


class TaskDetailResponse(TaskResponse):
    comments: Optional[List[CommentBrief]] = None
    files: Optional[List[FileBrief]] = None

    model_config = {"from_attributes": True}
