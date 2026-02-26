import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple

from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.task import Task, TaskStatus, TaskPriority
from app.models.comment import Comment
from app.models.file import File
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.utils.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.utils.sanitize import sanitize_string


async def create_task(db: AsyncSession, data: TaskCreate, user_id: uuid.UUID) -> Task:
    if data.assigned_to:
        assignee = await db.execute(select(User).where(User.id == data.assigned_to))
        if not assignee.scalar_one_or_none():
            raise BadRequestException("Assigned user does not exist")

    sanitized_tags = [sanitize_string(t) for t in data.tags] if data.tags else data.tags

    task = Task(
        title=sanitize_string(data.title),
        description=sanitize_string(data.description) if data.description else data.description,
        status=TaskStatus(data.status) if data.status else TaskStatus.TODO,
        priority=TaskPriority(data.priority) if data.priority else TaskPriority.MEDIUM,
        due_date=data.due_date,
        tags=sanitized_tags,
        assigned_to=data.assigned_to,
        created_by=user_id,
    )
    db.add(task)
    await db.flush()

    result = await db.execute(
        select(Task)
        .options(selectinload(Task.creator), selectinload(Task.assignee))
        .where(Task.id == task.id)
    )
    return result.scalar_one()


async def list_tasks(
    db: AsyncSession,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    page: int = 1,
    limit: int = 10,
    tags: Optional[List[str]] = None,
    assigned_to: Optional[uuid.UUID] = None,
) -> Tuple[List[Task], int]:
    base_query = select(Task).where(Task.is_deleted == False)  # noqa: E712

    if status:
        base_query = base_query.where(Task.status == TaskStatus(status))
    if priority:
        base_query = base_query.where(Task.priority == TaskPriority(priority))
    if search:
        search_filter = or_(
            Task.title.ilike(f"%{search}%"),
            Task.description.ilike(f"%{search}%"),
        )
        base_query = base_query.where(search_filter)
    if tags:
        base_query = base_query.where(Task.tags.overlap(tags))
    if assigned_to:
        base_query = base_query.where(Task.assigned_to == assigned_to)

    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    allowed_sort_fields = {
        "created_at": Task.created_at,
        "updated_at": Task.updated_at,
        "title": Task.title,
        "status": Task.status,
        "priority": Task.priority,
        "due_date": Task.due_date,
    }
    sort_column = allowed_sort_fields.get(sort_by, Task.created_at)

    if order == "asc":
        base_query = base_query.order_by(sort_column.asc())
    else:
        base_query = base_query.order_by(sort_column.desc())

    offset = (page - 1) * limit
    base_query = base_query.offset(offset).limit(limit)
    base_query = base_query.options(selectinload(Task.creator), selectinload(Task.assignee))

    result = await db.execute(base_query)
    tasks = list(result.scalars().all())
    return tasks, total


async def get_task(db: AsyncSession, task_id: uuid.UUID) -> Task:
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.creator),
            selectinload(Task.assignee),
            selectinload(Task.comments).selectinload(Comment.user),
            selectinload(Task.files).selectinload(File.uploader),
        )
        .where(and_(Task.id == task_id, Task.is_deleted == False))  # noqa: E712
    )
    task = result.scalar_one_or_none()
    if not task:
        raise NotFoundException("Task not found")
    return task


async def update_task(
    db: AsyncSession, task_id: uuid.UUID, data: TaskUpdate, user_id: uuid.UUID
) -> Task:
    task = await get_task(db, task_id)

    if task.created_by != user_id and task.assigned_to != user_id:
        raise ForbiddenException("You can only update tasks you created or are assigned to")

    if data.assigned_to:
        assignee = await db.execute(select(User).where(User.id == data.assigned_to))
        if not assignee.scalar_one_or_none():
            raise BadRequestException("Assigned user does not exist")

    update_data = data.model_dump(exclude_unset=True)
    if "title" in update_data and update_data["title"]:
        update_data["title"] = sanitize_string(update_data["title"])
    if "description" in update_data and update_data["description"]:
        update_data["description"] = sanitize_string(update_data["description"])
    if "tags" in update_data and update_data["tags"]:
        update_data["tags"] = [sanitize_string(t) for t in update_data["tags"]]
    if "status" in update_data and update_data["status"]:
        update_data["status"] = TaskStatus(update_data["status"])
    if "priority" in update_data and update_data["priority"]:
        update_data["priority"] = TaskPriority(update_data["priority"])

    for field, value in update_data.items():
        setattr(task, field, value)

    await db.flush()

    result = await db.execute(
        select(Task)
        .options(selectinload(Task.creator), selectinload(Task.assignee))
        .where(Task.id == task_id)
    )
    return result.scalar_one()


async def delete_task(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> None:
    task = await get_task(db, task_id)

    if task.created_by != user_id:
        raise ForbiddenException("Only the task creator can delete this task")

    task.is_deleted = True
    task.deleted_at = datetime.now(timezone.utc)
    await db.flush()


async def bulk_create_tasks(
    db: AsyncSession, tasks_data: List[TaskCreate], user_id: uuid.UUID
) -> List[Task]:
    if len(tasks_data) > 50:
        raise BadRequestException("Cannot create more than 50 tasks at once")

    created_tasks = []
    for data in tasks_data:
        sanitized_tags = [sanitize_string(t) for t in data.tags] if data.tags else data.tags
        task = Task(
            title=sanitize_string(data.title),
            description=sanitize_string(data.description) if data.description else data.description,
            status=TaskStatus(data.status) if data.status else TaskStatus.TODO,
            priority=TaskPriority(data.priority) if data.priority else TaskPriority.MEDIUM,
            due_date=data.due_date,
            tags=sanitized_tags,
            assigned_to=data.assigned_to,
            created_by=user_id,
        )
        db.add(task)
        created_tasks.append(task)

    await db.flush()

    task_ids = [t.id for t in created_tasks]
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.creator), selectinload(Task.assignee))
        .where(Task.id.in_(task_ids))
    )
    return list(result.scalars().all())


async def get_all_users(db: AsyncSession) -> List[User]:
    result = await db.execute(select(User).order_by(User.name))
    return list(result.scalars().all())
