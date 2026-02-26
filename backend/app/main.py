from contextlib import asynccontextmanager
import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.middleware import SecurityHeadersMiddleware
from app.core.rate_limiter import limiter
from app.routers import auth, tasks, comments, files, analytics
from app.utils.exceptions import AppException

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="Task Management API",
    description="A full-featured task management platform API with JWT authentication, "
    "task CRUD, comments, file uploads, and analytics.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "error": {
                "message": "Too many requests. Please try again later.",
                "code": "RATE_LIMITED",
            },
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        first = errors[0]
        loc = " -> ".join(str(l) for l in first.get("loc", []) if l != "body")
        msg = first.get("msg", "Validation error")
        detail = f"{loc}: {msg}" if loc else msg
    else:
        detail = "Validation error"
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": {
                "message": detail,
                "code": "VALIDATION_ERROR",
            },
        },
    )


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.detail,
                "code": exc.code,
            },
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "message": "Internal server error",
                "code": "INTERNAL_ERROR",
            },
        },
    )


app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(comments.router)
app.include_router(files.router)
app.include_router(analytics.router)


@app.get("/api/health")
async def health_check():
    return {"success": True, "message": "API is running"}
