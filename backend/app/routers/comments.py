import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import get_current_user
from app.deps.database import get_db
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.services import comment_service
from app.utils.response import success_response, message_response

router = APIRouter(prefix="/api/tasks/{task_id}/comments", tags=["Comments"])


@router.post("/", response_model=None)
async def add_comment(
    task_id: uuid.UUID,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await comment_service.create_comment(db, task_id, data, current_user.id)
    return success_response(CommentResponse.model_validate(comment).model_dump(mode="json"))


@router.get("/", response_model=None)
async def list_comments(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comments = await comment_service.list_comments(db, task_id)
    return success_response(
        [CommentResponse.model_validate(c).model_dump(mode="json") for c in comments]
    )


@router.put("/{comment_id}", response_model=None)
async def update_comment(
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await comment_service.update_comment(
        db, task_id, comment_id, data, current_user.id
    )
    return success_response(CommentResponse.model_validate(comment).model_dump(mode="json"))


@router.delete("/{comment_id}", response_model=None)
async def delete_comment(
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await comment_service.delete_comment(db, task_id, comment_id, current_user.id)
    return message_response("Comment deleted successfully")
