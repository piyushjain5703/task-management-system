import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserResponse


class FileResponse(BaseModel):
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
