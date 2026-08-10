# API Reference

FlowDesk provides a RESTful API with OpenAPI/Swagger documentation.

**Base URL:** `http://localhost:8000/api/v1`

**Interactive Docs:** http://localhost:8000/docs

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/auth/me` | Get current user |
| `PUT` | `/auth/change-password` | Change password |

---

## Workspaces

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workspaces/` | List workspaces |
| `POST` | `/workspaces/` | Create workspace |
| `GET` | `/workspaces/:id` | Get workspace |
| `PUT` | `/workspaces/:id` | Update workspace |
| `DELETE` | `/workspaces/:id` | Delete workspace |

---

## Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects/workspace/:id` | List projects in workspace |
| `POST` | `/projects/workspace/:id` | Create project |
| `GET` | `/projects/:id` | Get project |
| `PUT` | `/projects/:id` | Update project |
| `DELETE` | `/projects/:id` | Delete project |
| `GET` | `/projects/:id/members` | List project members |
| `POST` | `/projects/:id/invite` | Invite member |
| `POST` | `/projects/:id/invitations/:id/accept` | Accept invitation |
| `POST` | `/projects/:id/invitations/:id/decline` | Decline invitation |
| `DELETE` | `/projects/:id/members/:id` | Remove member |

---

## Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/boards/project/:id` | List boards in project |
| `POST` | `/boards/project/:id` | Create board |
| `GET` | `/boards/:id` | Get board with columns |
| `PUT` | `/boards/:id` | Update board |
| `DELETE` | `/boards/:id` | Delete board |
| `POST` | `/boards/:id/columns` | Add column |
| `PUT` | `/boards/columns/:id` | Update column |
| `DELETE` | `/boards/columns/:id` | Delete column |

---

## Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks/column/:id` | List tasks by column |
| `GET` | `/tasks/my` | List my assigned tasks |
| `POST` | `/tasks/` | Create task |
| `GET` | `/tasks/:id` | Get task detail |
| `PUT` | `/tasks/:id` | Update task |
| `PUT` | `/tasks/:id/move` | Move task between columns |
| `DELETE` | `/tasks/:id` | Delete task |
| `POST` | `/tasks/:id/subtasks` | Add subtask |
| `PUT` | `/tasks/subtasks/:id` | Update subtask |
| `DELETE` | `/tasks/subtasks/:id` | Delete subtask |
| `POST` | `/tasks/:id/checklists` | Add checklist item |
| `PUT` | `/tasks/checklists/:id` | Update checklist item |
| `DELETE` | `/tasks/checklists/:id` | Delete checklist item |
| `GET` | `/tasks/:id/comments` | List comments |
| `POST` | `/tasks/:id/comments` | Add comment |
| `PUT` | `/tasks/comments/:id` | Update comment |
| `DELETE` | `/tasks/comments/:id` | Delete comment |

---

## Labels

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/labels/project/:id` | List labels |
| `POST` | `/labels/project/:id` | Create label |
| `PUT` | `/labels/:id` | Update label |
| `DELETE` | `/labels/:id` | Delete label |

---

## Activity & Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/activity/logs` | List activity logs |
| `GET` | `/activity/logs/:type/:id` | Entity activity logs |
| `GET` | `/activity/notifications` | List notifications |
| `GET` | `/activity/notifications/unread-count` | Unread count |
| `PUT` | `/activity/notifications/read` | Mark as read |
| `PUT` | `/activity/notifications/read-all` | Mark all as read |

---

## Dashboard & Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard/stats` | Dashboard statistics |
| `GET` | `/search/?q=...` | Global search |

---

## Example Requests

### Register

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "username": "johndoe",
    "tenant_name": "My Company"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Create Task

```bash
curl -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "New task",
    "description": "Task description",
    "column_id": "<column-id>",
    "priority": "high"
  }'
```

---

## Error Responses

| Status Code | Description |
|-------------|-------------|
| `400` | Bad request / validation error |
| `401` | Unauthorized (invalid or expired token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `409` | Conflict (e.g., duplicate email) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```
