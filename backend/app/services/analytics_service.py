import csv
import io
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select, func, case, and_, extract, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task, TaskStatus, TaskPriority
from app.models.user import User


async def get_overview(db: AsyncSession) -> dict:
    base = select(Task).where(Task.is_deleted == False)  # noqa: E712

    total_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    status_q = (
        select(Task.status, func.count())
        .where(Task.is_deleted == False)  # noqa: E712
        .group_by(Task.status)
    )
    status_rows = (await db.execute(status_q)).all()
    by_status = {row[0].value: row[1] for row in status_rows}

    priority_q = (
        select(Task.priority, func.count())
        .where(Task.is_deleted == False)  # noqa: E712
        .group_by(Task.priority)
    )
    priority_rows = (await db.execute(priority_q)).all()
    by_priority = {row[0].value: row[1] for row in priority_rows}

    now = datetime.now(timezone.utc)
    overdue_q = (
        select(func.count())
        .select_from(Task)
        .where(
            and_(
                Task.is_deleted == False,  # noqa: E712
                Task.status != TaskStatus.DONE,
                Task.due_date != None,  # noqa: E711
                Task.due_date < now,
            )
        )
    )
    overdue = (await db.execute(overdue_q)).scalar() or 0

    return {
        "total": total,
        "by_status": {
            "TODO": by_status.get("TODO", 0),
            "IN_PROGRESS": by_status.get("IN_PROGRESS", 0),
            "DONE": by_status.get("DONE", 0),
        },
        "by_priority": {
            "LOW": by_priority.get("LOW", 0),
            "MEDIUM": by_priority.get("MEDIUM", 0),
            "HIGH": by_priority.get("HIGH", 0),
        },
        "overdue": overdue,
    }


async def get_performance(db: AsyncSession) -> list[dict]:
    completed_q = (
        select(
            Task.assigned_to,
            User.name,
            func.count().label("completed_tasks"),
            func.avg(
                extract("epoch", Task.updated_at) - extract("epoch", Task.created_at)
            ).label("avg_completion_seconds"),
        )
        .join(User, Task.assigned_to == User.id)
        .where(
            and_(
                Task.is_deleted == False,  # noqa: E712
                Task.status == TaskStatus.DONE,
                Task.assigned_to != None,  # noqa: E711
            )
        )
        .group_by(Task.assigned_to, User.name)
        .order_by(func.count().desc())
    )
    rows = (await db.execute(completed_q)).all()

    results = []
    for row in rows:
        avg_seconds = float(row.avg_completion_seconds or 0)
        avg_hours = round(avg_seconds / 3600, 1)
        results.append(
            {
                "user_id": str(row.assigned_to),
                "user_name": row.name,
                "completed_tasks": row.completed_tasks,
                "avg_completion_time": avg_hours,
            }
        )
    return results


async def get_trends(db: AsyncSession, days: int = 30) -> list[dict]:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days)

    created_day = cast(Task.created_at, Date).label("day")
    created_q = (
        select(created_day, func.count().label("count"))
        .where(
            and_(
                Task.is_deleted == False,  # noqa: E712
                Task.created_at >= start,
            )
        )
        .group_by(created_day)
        .order_by(created_day)
    )
    created_rows = (await db.execute(created_q)).all()

    completed_day = cast(Task.updated_at, Date).label("day")
    completed_q = (
        select(completed_day, func.count().label("count"))
        .where(
            and_(
                Task.is_deleted == False,  # noqa: E712
                Task.status == TaskStatus.DONE,
                Task.updated_at >= start,
            )
        )
        .group_by(completed_day)
        .order_by(completed_day)
    )
    completed_rows = (await db.execute(completed_q)).all()

    created_map = {row.day.isoformat(): row.count for row in created_rows}
    completed_map = {row.day.isoformat(): row.count for row in completed_rows}

    all_dates: set[str] = set()
    current = start.date()
    while current <= now.date():
        all_dates.add(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

    results = []
    for date_str in sorted(all_dates):
        results.append(
            {
                "date": date_str,
                "created": created_map.get(date_str, 0),
                "completed": completed_map.get(date_str, 0),
            }
        )
    return results


async def export_tasks_csv(db: AsyncSession) -> str:
    query = (
        select(Task)
        .where(Task.is_deleted == False)  # noqa: E712
        .order_by(Task.created_at.desc())
    )
    result = await db.execute(query)
    tasks = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "ID",
            "Title",
            "Description",
            "Status",
            "Priority",
            "Due Date",
            "Tags",
            "Created At",
            "Updated At",
        ]
    )

    for task in tasks:
        writer.writerow(
            [
                str(task.id),
                task.title,
                task.description or "",
                task.status.value,
                task.priority.value,
                task.due_date.isoformat() if task.due_date else "",
                ", ".join(task.tags) if task.tags else "",
                task.created_at.isoformat(),
                task.updated_at.isoformat(),
            ]
        )

    return output.getvalue()
