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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_overview(db)
    return success_response(data)


@router.get("/performance", response_model=None)
async def get_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_performance(db)
    return success_response(data)


@router.get("/trends", response_model=None)
async def get_trends(
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await analytics_service.get_trends(db, days=days)
    return success_response(data)


@router.get("/export", response_model=None)
async def export_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    csv_content = await analytics_service.export_tasks_csv(db)
    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tasks_export.csv"},
    )
