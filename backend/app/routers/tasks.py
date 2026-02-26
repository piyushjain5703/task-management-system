import uuid
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import get_current_user
from app.deps.database import get_db
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskDetailResponse
from app.schemas.user import UserResponse
from app.services import task_service
from app.services.email_service import send_task_assignment_email
from app.utils.response import success_response, paginated_response, message_response

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.post("/bulk", response_model=None)
async def bulk_create_tasks(
    tasks: List[TaskCreate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    created = await task_service.bulk_create_tasks(db, tasks, current_user.id)
    return success_response(
        [TaskResponse.model_validate(t).model_dump(mode="json") for t in created]
    )


@router.post("/", response_model=None)
async def create_task(
    data: TaskCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.create_task(db, data, current_user.id)

    if task.assignee and task.assigned_to != current_user.id:
        background_tasks.add_task(
            send_task_assignment_email,
            recipient_email=task.assignee.email,
            recipient_name=task.assignee.name,
            task_title=task.title,
            assigner_name=current_user.name,
        )

    return success_response(TaskResponse.model_validate(task).model_dump(mode="json"))


@router.get("/", response_model=None)
async def list_tasks(
    status: Optional[str] = Query(None, pattern="^(TODO|IN_PROGRESS|DONE)$"),
    priority: Optional[str] = Query(None, pattern="^(LOW|MEDIUM|HIGH)$"),
    search: Optional[str] = Query(None, max_length=200),
    sort_by: str = Query("created_at", pattern="^(created_at|updated_at|title|status|priority|due_date)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    tags: Optional[str] = Query(None),
    assigned_to: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tags_list = [t.strip() for t in tags.split(",")] if tags else None
    tasks, total = await task_service.list_tasks(
        db,
        status=status,
        priority=priority,
        search=search,
        sort_by=sort_by,
        order=order,
        page=page,
        limit=limit,
        tags=tags_list,
        assigned_to=assigned_to,
    )
    return paginated_response(
        data=[TaskResponse.model_validate(t).model_dump(mode="json") for t in tasks],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/users", response_model=None)
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    users = await task_service.get_all_users(db)
    return success_response(
        [UserResponse.model_validate(u).model_dump(mode="json") for u in users]
    )


@router.get("/{task_id}", response_model=None)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get_task(db, task_id)
    return success_response(TaskDetailResponse.model_validate(task).model_dump(mode="json"))


@router.put("/{task_id}", response_model=None)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    old_task = await task_service.get_task(db, task_id)
    old_assignee_id = old_task.assigned_to

    task = await task_service.update_task(db, task_id, data, current_user.id)

    if (
        task.assignee
        and task.assigned_to != old_assignee_id
        and task.assigned_to != current_user.id
    ):
        background_tasks.add_task(
            send_task_assignment_email,
            recipient_email=task.assignee.email,
            recipient_name=task.assignee.name,
            task_title=task.title,
            assigner_name=current_user.name,
        )

    return success_response(TaskResponse.model_validate(task).model_dump(mode="json"))


@router.delete("/{task_id}", response_model=None)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await task_service.delete_task(db, task_id, current_user.id)
    return message_response("Task deleted successfully")
