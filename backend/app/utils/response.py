import math
from typing import Any

from app.schemas.common import (
    SuccessResponse,
    PaginatedResponse,
    PaginationMeta,
    MessageResponse,
)


def success_response(data: Any) -> dict:
    return SuccessResponse(data=data).model_dump()


def paginated_response(data: list, total: int, page: int, limit: int) -> dict:
    return PaginatedResponse(
        data=data,
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=math.ceil(total / limit) if limit > 0 else 0,
        ),
    ).model_dump()


def message_response(message: str) -> dict:
    return MessageResponse(message=message).model_dump()
