import os
import uuid
from typing import List

import aiofiles
from fastapi import UploadFile
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models.file import File
from app.models.task import Task
from app.utils.exceptions import (
    NotFoundException,
    ForbiddenException,
    BadRequestException,
)

settings = get_settings()

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".txt", ".csv", ".json", ".xml", ".md",
    ".zip", ".tar", ".gz", ".rar",
}


async def _get_task_or_404(db: AsyncSession, task_id: uuid.UUID) -> Task:
    result = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.is_deleted == False))  # noqa: E712
    )
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundException("Task not found")
    return task


def _validate_file(upload: UploadFile) -> None:
    if not upload.filename:
        raise BadRequestException("File must have a name")

    ext = os.path.splitext(upload.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestException(
            f"File type '{ext}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )


async def upload_files(
    db: AsyncSession,
    task_id: uuid.UUID,
    uploads: List[UploadFile],
    user_id: uuid.UUID,
) -> List[File]:
    await _get_task_or_404(db, task_id)

    if not uploads:
        raise BadRequestException("No files provided")

    saved: List[File] = []

    for upload in uploads:
        _validate_file(upload)

        content = await upload.read()
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise BadRequestException(
                f"File '{upload.filename}' exceeds the {settings.MAX_UPLOAD_SIZE // (1024 * 1024)}MB limit"
            )

        ext = os.path.splitext(upload.filename)[1].lower()
        stored_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        file_record = File(
            filename=stored_name,
            original_name=upload.filename,
            mime_type=upload.content_type or "application/octet-stream",
            size=len(content),
            task_id=task_id,
            uploaded_by=user_id,
        )
        db.add(file_record)
        saved.append(file_record)

    await db.flush()

    file_ids = [f.id for f in saved]
    result = await db.execute(
        select(File)
        .options(selectinload(File.uploader))
        .where(File.id.in_(file_ids))
        .order_by(File.created_at.asc())
    )
    return list(result.scalars().all())


async def get_file(
    db: AsyncSession, task_id: uuid.UUID, file_id: uuid.UUID
) -> File:
    await _get_task_or_404(db, task_id)

    result = await db.execute(
        select(File).where(and_(File.id == file_id, File.task_id == task_id))
    )
    file = result.scalar_one_or_none()
    if not file:
        raise NotFoundException("File not found")

    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    if not os.path.isfile(file_path):
        raise NotFoundException("File not found on disk")

    return file


async def delete_file(
    db: AsyncSession,
    task_id: uuid.UUID,
    file_id: uuid.UUID,
    user_id: uuid.UUID,
) -> None:
    task = await _get_task_or_404(db, task_id)

    result = await db.execute(
        select(File).where(and_(File.id == file_id, File.task_id == task_id))
    )
    file = result.scalar_one_or_none()
    if not file:
        raise NotFoundException("File not found")

    if file.uploaded_by != user_id and task.created_by != user_id:
        raise ForbiddenException("Only the uploader or task creator can delete this file")

    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    if os.path.isfile(file_path):
        os.remove(file_path)

    await db.delete(file)
    await db.flush()
