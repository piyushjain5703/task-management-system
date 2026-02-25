from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, status_code: int, message: str, code: str = "ERROR"):
        self.code = code
        super().__init__(status_code=status_code, detail=message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            code="NOT_FOUND",
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            code="FORBIDDEN",
        )


class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=message,
            code="BAD_REQUEST",
        )


class ConflictException(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            code="CONFLICT",
        )
