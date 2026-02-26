import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps.auth import get_current_user
from app.deps.database import get_db
from app.models.user import User
from app.services import analytics_service
from app.utils.response import success_response

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview", response_model=None)
async def get_overview(
    assigned_to: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_overview(db, assigned_to=assigned_to)
    return success_response(data)


@router.get("/performance", response_model=None)
async def get_performance(
    assigned_to: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_performance(db, assigned_to=assigned_to)
    return success_response(data)


@router.get("/trends", response_model=None)
async def get_trends(
    days: int = Query(30, ge=7, le=365),
    assigned_to: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_trends(db, days=days, assigned_to=assigned_to)
    return success_response(data)


@router.get("/export", response_model=None)
async def export_csv(
    assigned_to: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    csv_content = await analytics_service.export_tasks_csv(db, assigned_to=assigned_to)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tasks_export.csv"},
    )
