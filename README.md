# Task Management Platform

A full-featured task management application with user authentication, task CRUD, comments, file attachments, and analytics dashboards.

## Tech Stack

- **Backend**: Python 3.11+ / FastAPI / SQLAlchemy 2.0 / PostgreSQL
- **Frontend**: React / TypeScript / Vite
- **Auth**: JWT (python-jose + passlib/bcrypt)
- **Charts**: Recharts
- **Styling**: Custom CSS (no frameworks)

## Project Structure

```
task-management-system/
  backend/           # FastAPI application
    app/
      core/          # Config, database, security
      models/        # SQLAlchemy models
      schemas/       # Pydantic request/response models
      routers/       # API route handlers
      services/      # Business logic
      deps/          # FastAPI dependencies
      utils/         # Helpers, exceptions
    alembic/         # Database migrations
    uploads/         # File upload storage
  frontend/          # React + TypeScript application
    src/
      components/    # Reusable UI components
      pages/         # Page components
      context/       # React context providers
      hooks/         # Custom hooks
      services/      # API service layer
      styles/        # Global CSS and design tokens
      types/         # TypeScript type definitions
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

## Setup

### Database

Create a PostgreSQL database:

```bash
createdb taskmanager
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install

# Copy and configure environment variables
cp .env.example .env

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg) | `postgresql+asyncpg://postgres:postgres@localhost:5432/taskmanager` |
| `SECRET_KEY` | JWT signing key | `dev-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `UPLOAD_DIR` | File upload directory | `uploads` |
| `MAX_UPLOAD_SIZE` | Max upload size in bytes | `5242880` (5MB) |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and get JWT tokens |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/tasks/` | List tasks (filterable, sortable, paginated) |
| `POST` | `/api/tasks/` | Create a task |
| `GET` | `/api/tasks/{id}` | Get task details |
| `PUT` | `/api/tasks/{id}` | Update a task |
| `DELETE` | `/api/tasks/{id}` | Soft-delete a task |
| `POST` | `/api/tasks/bulk` | Bulk create tasks |
| `GET` | `/api/tasks/{id}/comments/` | List task comments |
| `POST` | `/api/tasks/{id}/comments/` | Add a comment |
| `PUT` | `/api/tasks/{id}/comments/{cid}` | Edit a comment |
| `DELETE` | `/api/tasks/{id}/comments/{cid}` | Delete a comment |
| `POST` | `/api/tasks/{id}/files/` | Upload files |
| `GET` | `/api/tasks/{id}/files/{fid}` | Download a file |
| `DELETE` | `/api/tasks/{id}/files/{fid}` | Delete a file |
| `GET` | `/api/analytics/overview` | Task statistics overview |
| `GET` | `/api/analytics/performance` | User performance metrics |
| `GET` | `/api/analytics/trends` | Task creation/completion trends |
| `GET` | `/api/analytics/export` | Export tasks as CSV |
