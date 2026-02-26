import uuid
from typing import List

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment
from app.models.task import Task
from app.schemas.comment import CommentCreate, CommentUpdate
from app.utils.exceptions import NotFoundException, ForbiddenException
from app.utils.sanitize import sanitize_string


async def _get_task_or_404(db: AsyncSession, task_id: uuid.UUID) -> Task:
    result = await db.execute(
        select(Task).where(and_(Task.id == task_id, Task.is_deleted == False))  # noqa: E712
    )
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundException("Task not found")
    return task


async def create_comment(
    db: AsyncSession, task_id: uuid.UUID, data: CommentCreate, user_id: uuid.UUID
) -> Comment:
    await _get_task_or_404(db, task_id)

    comment = Comment(
        content=sanitize_string(data.content),
        task_id=task_id,
        user_id=user_id,
    )
    db.add(comment)
    await db.flush()

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.id == comment.id)
    )
    return result.scalar_one()


async def list_comments(db: AsyncSession, task_id: uuid.UUID) -> List[Comment]:
    await _get_task_or_404(db, task_id)

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
    )
    return list(result.scalars().all())


async def update_comment(
    db: AsyncSession,
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    data: CommentUpdate,
    user_id: uuid.UUID,
) -> Comment:
    await _get_task_or_404(db, task_id)

    result = await db.execute(
        select(Comment).where(
            and_(Comment.id == comment_id, Comment.task_id == task_id)
        )
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise NotFoundException("Comment not found")

    if comment.user_id != user_id:
        raise ForbiddenException("You can only edit your own comments")

    comment.content = sanitize_string(data.content)
    await db.flush()

    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(Comment.id == comment.id)
    )
    return result.scalar_one()


async def delete_comment(
    db: AsyncSession, task_id: uuid.UUID, comment_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    await _get_task_or_404(db, task_id)

    result = await db.execute(
        select(Comment).where(
            and_(Comment.id == comment_id, Comment.task_id == task_id)
        )
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise NotFoundException("Comment not found")

    if comment.user_id != user_id:
        raise ForbiddenException("You can only delete your own comments")

    await db.delete(comment)
    await db.flush()
