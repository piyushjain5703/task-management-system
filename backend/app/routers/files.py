import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.deps.auth import get_current_user
from app.deps.database import get_db
from app.models.user import User
from app.schemas.file import FileResponse
from app.services import file_service
from app.utils.response import success_response, message_response

settings = get_settings()

router = APIRouter(prefix="/api/tasks/{task_id}/files", tags=["Files"])


@router.post("/", response_model=None)
async def upload_files(
    task_id: uuid.UUID,
    files: List[UploadFile] = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    saved = await file_service.upload_files(db, task_id, files, current_user.id)
    return success_response(
        [FileResponse.model_validate(f).model_dump(mode="json") for f in saved]
    )


@router.get("/{file_id}", response_class=FastAPIFileResponse)
async def download_file(
    task_id: uuid.UUID,
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file = await file_service.get_file(db, task_id, file_id)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    return FastAPIFileResponse(
        path=file_path,
        filename=file.original_name,
        media_type=file.mime_type,
    )


@router.delete("/{file_id}", response_model=None)
async def delete_file(
    task_id: uuid.UUID,
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await file_service.delete_file(db, task_id, file_id, current_user.id)
    return message_response("File deleted successfully")
