# TaskFlow — Task Management Platform

A full-featured task management platform with user authentication, task CRUD with filtering and pagination, threaded comments, drag-and-drop file attachments, analytics dashboards with interactive charts, and CSV export — built with FastAPI and React.

## Live Demo

| Service  | URL |
|----------|-----|
| Frontend | [https://tasks-flow-web.netlify.app/login](https://tasks-flow-web.netlify.app/login) |
| Backend  | [https://task-flow-lem9.onrender.com/api/](https://task-flow-lem9.onrender.com/api/) |
| API Docs (Swagger) | [https://task-flow-lem9.onrender.com/docs](https://task-flow-lem9.onrender.com/docs) |
| API Docs (ReDoc) | [https://task-flow-lem9.onrender.com/redoc](https://task-flow-lem9.onrender.com/redoc) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+ · FastAPI · SQLAlchemy 2.0 (async) · Alembic |
| Database | PostgreSQL (asyncpg driver) hosted on [Supabase](https://supabase.com) |
| Auth | JWT (python-jose + passlib/bcrypt) with access & refresh tokens |
| Frontend | React 19 · TypeScript · Vite 7 |
| Charts | Recharts |
| Styling | Custom CSS (no frameworks) with dark mode support |
| Deployment | Netlify (frontend) · Render (backend) |

## Features

### Core
- **Authentication** — Register, login, JWT-based session management (access + refresh tokens), protected routes
- **Task Management** — Create, read, update, soft-delete tasks with status (TODO / In Progress / Done), priority (Low / Medium / High), due dates, tags, and user assignment
- **Bulk Operations** — Bulk-create tasks in a single request
- **Advanced Filtering** — Filter by status, priority, tags, assigned user; full-text search; sort by any field; server-side pagination
- **Comments** — Threaded comments on tasks with edit/delete (author-only)
- **File Attachments** — Drag-and-drop multi-file upload (max 5 MB per file), download, delete; stored on the server filesystem

### Analytics & Reporting
- **Dashboard** — Summary cards, pie chart (tasks by status), bar chart (tasks by priority), line chart (activity trends)
- **Analytics Page** — User performance table, trend charts with configurable date ranges (7 / 14 / 30 / 90 days)
- **CSV Export** — Download all tasks as a CSV file

### Security & Polish
- **Rate Limiting** — `slowapi` rate limiter on auth endpoints (5 reg/min, 10 login/min) and a global default (200 req/min)
- **Input Sanitization** — `bleach` for XSS prevention on all text fields
- **Security Headers** — Custom middleware adding X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, and more
- **CORS** — Configurable allowed origins via environment variable

### UX
- **Dark Mode** — System-preference aware, toggle in the header, persisted in localStorage
- **Markdown Support** — Render Markdown in task descriptions (react-markdown)
- **Toast Notifications** — Success/error feedback for every action
- **Loading Skeletons** — Skeleton placeholders while data loads
- **Confirmation Dialogs** — Destructive actions require explicit confirmation
- **Responsive Design** — Mobile-friendly layout with collapsible navigation
- **404 Page** — Custom not-found page
- **Error Boundary** — Graceful error handling in the React tree

### Bonus
- **Email Notifications** — Optional async SMTP notifications on task assignment (configurable, disabled by default)
- **Docker Support** — Dockerfiles for both services + `docker-compose.yml` with PostgreSQL

## Project Structure

```
task-management-system/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, routers, middleware, exception handlers
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic BaseSettings (typed env config)
│   │   │   ├── database.py      # Async SQLAlchemy engine & session
│   │   │   ├── security.py      # JWT create/decode, password hashing
│   │   │   ├── middleware.py    # Security headers middleware
│   │   │   └── rate_limiter.py  # slowapi rate-limiter setup
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   ├── comment.py
│   │   │   └── file.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   ├── comments.py
│   │   │   ├── files.py
│   │   │   └── analytics.py
│   │   ├── services/            # Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── task_service.py
│   │   │   ├── comment_service.py
│   │   │   ├── file_service.py
│   │   │   ├── analytics_service.py
│   │   │   └── email_service.py
│   │   ├── deps/                # FastAPI dependencies (auth, db session)
│   │   └── utils/               # Helpers, custom exceptions, XSS sanitizer
│   ├── alembic/                 # Database migrations
│   ├── uploads/                 # Uploaded file storage
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/               # Login, Register, Dashboard, TaskList,
│   │   │                        # TaskDetail, Analytics, Profile, NotFound
│   │   ├── components/
│   │   │   ├── auth/            # ProtectedRoute, GuestRoute
│   │   │   ├── tasks/           # TaskCard, TaskForm, TaskFilters, Pagination
│   │   │   ├── comments/        # CommentList, CommentForm
│   │   │   ├── files/           # FileUpload (drag-and-drop), FileList
│   │   │   ├── common/          # Modal, ConfirmDialog, Skeleton, ErrorBoundary
│   │   │   └── layout/          # Header (with theme toggle), Layout
│   │   ├── context/             # AuthContext, ThemeContext, ToastContext
│   │   ├── hooks/               # useAuth, useTheme, useToast
│   │   ├── services/            # Axios API layer (auth, tasks, comments, files, analytics)
│   │   ├── styles/              # CSS variables, global styles, page & component CSS
│   │   └── types/               # TypeScript interfaces & enums
│   ├── Dockerfile
│   ├── netlify.toml
│   ├── nginx.conf
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
├── plan.md
└── README.md
```

## Database Schema

```mermaid
erDiagram
    User ||--o{ Task : creates
    User ||--o{ Task : "assigned to"
    User ||--o{ Comment : writes
    User ||--o{ File : uploads
    Task ||--o{ Comment : has
    Task ||--o{ File : has

    User {
        uuid id PK
        string name
        string email UK
        string password
        string avatar
        datetime created_at
        datetime updated_at
    }
    Task {
        uuid id PK
        string title
        text description
        enum status
        enum priority
        datetime due_date
        array tags
        uuid assigned_to FK
        uuid created_by FK
        boolean is_deleted
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }
    Comment {
        uuid id PK
        text content
        uuid task_id FK
        uuid user_id FK
        datetime created_at
        datetime updated_at
    }
    File {
        uuid id PK
        string filename
        string original_name
        string mime_type
        int size
        uuid task_id FK
        uuid uploaded_by FK
        datetime created_at
    }
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/register` | Register a new user | No |
| `POST` | `/login` | Login (returns access + refresh token) | No |
| `GET`  | `/me` | Get current user profile | Yes |

### Tasks (`/api/tasks`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`    | `/` | List tasks (filter, search, sort, paginate) | Yes |
| `POST`   | `/` | Create a task | Yes |
| `POST`   | `/bulk` | Bulk-create tasks | Yes |
| `GET`    | `/users` | List all users (for assignment dropdown) | Yes |
| `GET`    | `/{id}` | Get task details with comments & files | Yes |
| `PUT`    | `/{id}` | Update a task (creator or assignee) | Yes |
| `DELETE` | `/{id}` | Soft-delete a task | Yes |

### Comments (`/api/tasks/{task_id}/comments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET`    | `/` | List comments for a task | Yes |
| `POST`   | `/` | Add a comment | Yes |
| `PUT`    | `/{comment_id}` | Edit a comment (author only) | Yes |
| `DELETE` | `/{comment_id}` | Delete a comment (author only) | Yes |

### Files (`/api/tasks/{task_id}/files`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST`   | `/` | Upload one or more files (max 5 MB each) | Yes |
| `GET`    | `/{file_id}` | Download / stream a file | Yes |
| `DELETE` | `/{file_id}` | Delete a file (uploader or task creator) | Yes |

### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/overview` | Counts by status, priority, overdue, total | Yes |
| `GET` | `/performance` | Tasks completed per user, avg completion time | Yes |
| `GET` | `/trends` | Tasks created/completed over time (7–365 days) | Yes |
| `GET` | `/export` | Export all tasks as CSV (streamed download) | Yes |

### Utility

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Health check | No |

## Getting Started (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or a [Supabase](https://supabase.com) free-tier project)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/task-management-system.git
cd task-management-system
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL connection string:
#   DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname

alembic upgrade head            # Run migrations
uvicorn app.main:app --reload --port 8000
```

The API is now running at **http://localhost:8000**.
Interactive docs at **http://localhost:8000/docs**.

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Default VITE_API_URL=http://localhost:8000/api (works out of the box)

npm run dev
```

The app is now running at **http://localhost:5173**.

### 4. Docker (optional)

Spin up the entire stack (PostgreSQL + backend + frontend) with a single command:

```bash
docker-compose up --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend  | http://localhost:8000 |
| Postgres | localhost:5432 |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (asyncpg driver) | — |
| `SECRET_KEY` | JWT signing secret | `your-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (minutes) | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL (days) | `7` |
| `UPLOAD_DIR` | Directory for uploaded files | `uploads` |
| `MAX_UPLOAD_SIZE` | Max upload size in bytes | `5242880` (5 MB) |
| `CORS_ORIGINS` | Allowed origins, comma-separated | `http://localhost:5173` |
| `MAIL_ENABLED` | Enable email notifications | `false` |
| `MAIL_USERNAME` | SMTP username | — |
| `MAIL_PASSWORD` | SMTP password | — |
| `MAIL_FROM` | Sender email address | `noreply@taskflow.app` |
| `MAIL_FROM_NAME` | Sender display name | `TaskFlow` |
| `MAIL_SERVER` | SMTP server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_STARTTLS` | Use STARTTLS | `true` |
| `MAIL_SSL_TLS` | Use SSL/TLS | `false` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` |

## Deployment

### Frontend — Netlify

The frontend is deployed on **Netlify** with the following configuration (`netlify.toml`):

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20
- **SPA redirect**: All routes rewrite to `/index.html` (status 200) for client-side routing

Set the `VITE_API_URL` environment variable in Netlify to point to the backend:

```
VITE_API_URL=https://task-flow-lem9.onrender.com/api
```

### Backend — Render

The backend is deployed on **Render** as a Docker web service:

- **Dockerfile**: `backend/Dockerfile` (Python 3.11-slim, installs dependencies, exposes port 8000)
- **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Database**: PostgreSQL hosted on Supabase (connection string set via `DATABASE_URL`)

Configure the following environment variables on Render:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string |
| `SECRET_KEY` | A strong random secret |
| `CORS_ORIGINS` | `https://tasks-flow-web.netlify.app` |
| `MAIL_ENABLED` | `false` (or `true` with SMTP credentials) |

> **Note:** Render's free tier may spin down the backend after inactivity. The first request after idle may take 30–60 seconds while the service restarts.
