# Architecture

FlowDesk follows a clean, layered architecture with multi-tenant data isolation.

---

## High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend   │────▶│   Database  │
│  (Next.js)   │     │  (FastAPI)  │     │   (MySQL)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
               ┌────▼────┐  ┌────▼────┐
               │  Redis  │  │  MinIO  │
               │ (Cache) │  │ (Files) │
               └─────────┘  └─────────┘
```

---

## Multi-Tenancy

Every entity is scoped to a `tenant_id`, ensuring complete data isolation between organizations.

```
Tenant (Organization)
  ├── User (Members)
  └── Workspace
        └── Project
              ├── Board (Kanban/Scrum/List)
              │     └── BoardColumn
              │           └── Task
              │                 ├── Subtask
              │                 ├── Checklist
              │                 ├── Comment
              │                 ├── Attachment
              │                 ├── Label
              │                 └── TimeEntry
              ├── ProjectMember
              ├── Label
              └── Milestone
```

---

## Backend Layered Architecture

```
API Routes → Services → Repositories → Models
    ↓           ↓           ↓           ↓
Schemas    Business     Data Access   ORM
(Validation) Logic      (SQLAlchemy)
```

### API Routes (`app/api/v1/`)

HTTP request handling, input validation, response formatting. Each resource has its own route file:
- `auth.py` — Login, register, token refresh
- `workspaces.py` — Workspace CRUD
- `projects.py` — Project CRUD, members, invitations
- `boards.py` — Board and column management
- `tasks.py` — Task CRUD, subtasks, checklists, comments
- `labels.py` — Label management
- `users.py` — User management
- `tenants.py` — Tenant management
- `activity.py` — Activity logs, notifications
- `dashboard.py` — Dashboard statistics
- `search.py` — Global search

### Services (`app/services/`)

Business logic, authorization checks, data orchestration. 11 service classes handle domain-specific operations.

### Repositories (`app/repositories/`)

Database queries, data manipulation. Clean data access layer with base repository pattern.

### Models (`app/models/`)

SQLAlchemy ORM models. Async-compatible with MySQL.

### Schemas (`app/schemas/`)

Pydantic v2 models for request/response validation.

---

## Frontend Architecture

### App Router

File-based routing with layouts, loading states, and error boundaries:

```
src/app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout (providers)
├── (auth)/
│   ├── login/page.tsx          # Login page
│   └── register/page.tsx       # Registration page
├── dashboard/page.tsx          # Dashboard with analytics
├── workspaces/
│   ├── page.tsx                # Workspace list
│   └── [workspaceId]/
│       ├── page.tsx            # Workspace detail
│       └── projects/
│           └── [projectId]/
│               ├── page.tsx    # Project detail
│               └── boards/
│                   └── [boardId]/page.tsx  # Board view
├── notifications/page.tsx      # Notifications center
└── settings/page.tsx           # User settings
```

### State Management

- **React Query** — Server state (API data, caching, refetching)
- **Zustand** — Client state (auth, workspace, board, UI, language)

### Custom Hooks

Encapsulated data fetching and business logic:
- `useAuth` — Authentication operations
- `useWorkspaces` — Workspace CRUD
- `useProjects` — Project CRUD
- `useBoards` — Board operations
- `useTasks` — Task operations
- `useNotifications` — Notification management
- `useSearch` — Global search with debounce

---

## Authentication Flow

```
1. User submits email + password
2. Backend validates credentials
3. Backend returns access_token + refresh_token
4. Frontend stores tokens in localStorage
5. Frontend fetches user profile (/auth/me)
6. Frontend fetches tenant info (/tenants/current)
7. Auth state is hydrated in Zustand
```

### Token Refresh

```
1. API request returns 401
2. Frontend sends refresh_token to /auth/refresh
3. New tokens are issued
4. Original request is retried with new token
5. If refresh fails, user is redirected to login
```

---

## Rate Limiting

Configurable per-endpoint rate limits via `RATE_LIMIT_PER_MINUTE`. Login endpoint has stricter limits (5 requests/minute).

---

## Database

### Migrations

```bash
cd backend
alembic upgrade head          # Apply migrations
alembic downgrade -1          # Rollback one step
alembic revision --autogenerate -m "description"  # Create migration
```

### Schema

See [Database Schema](DATABASE_SCHEMA.md) for complete ER diagram and table definitions.
