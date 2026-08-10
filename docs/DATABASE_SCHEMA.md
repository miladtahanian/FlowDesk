# Database Schema

## ER Diagram Overview

```
tenants ──< users
tenants ──< workspaces
workspaces ──< workspace_members >── users
workspaces ──< projects
projects ──< project_members >── users
projects ──< boards
projects ──< labels
projects ──< milestones
boards ──< board_columns
board_columns ──< tasks
tasks ──< subtasks
tasks ──< checklists
tasks ──< comments >── users
tasks ──< attachments >── users
tasks ──< task_labels >── labels
tasks ──< time_entries >── users
tasks >── users (assignee)
tasks >── users (reporter)
tenants ──< activity_logs >── users
tenants ──< notifications >── users
```

## Tables

### tenants
| Column | Type | Constraints |
|--------|------|------------|
| id | CHAR(36) | PK |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(100) | UNIQUE, INDEX |
| domain | VARCHAR(255) | UNIQUE, NULLABLE |
| logo_url | VARCHAR(500) | NULLABLE |
| description | TEXT | NULLABLE |
| plan | VARCHAR(50) | DEFAULT 'free' |
| max_members | VARCHAR(50) | DEFAULT '10' |
| max_workspaces | VARCHAR(50) | DEFAULT '5' |
| max_projects | VARCHAR(50) | DEFAULT '20' |
| is_active | BOOLEAN | DEFAULT TRUE |
| settings | TEXT | NULLABLE |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |
| deleted_at | DATETIME | NULLABLE |

### users
| Column | Type | Constraints |
|--------|------|------------|
| id | CHAR(36) | PK |
| tenant_id | CHAR(36) | FK → tenants.id, INDEX |
| email | VARCHAR(255) | UNIQUE, INDEX |
| username | VARCHAR(100) | UNIQUE, INDEX |
| full_name | VARCHAR(255) | NOT NULL |
| hashed_password | VARCHAR(255) | NOT NULL |
| avatar_url | VARCHAR(500) | NULLABLE |
| role | ENUM | NOT NULL |
| is_active | BOOLEAN | DEFAULT TRUE |
| is_verified | BOOLEAN | DEFAULT FALSE |
| mfa_enabled | BOOLEAN | DEFAULT FALSE |
| mfa_secret | VARCHAR(255) | NULLABLE |
| last_login_at | DATETIME | NULLABLE |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |
| deleted_at | DATETIME | NULLABLE |

### workspaces
| Column | Type | Constraints |
|--------|------|------------|
| id | CHAR(36) | PK |
| tenant_id | CHAR(36) | FK → tenants.id, INDEX |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(100) | INDEX |
| description | TEXT | NULLABLE |
| color | VARCHAR(7) | DEFAULT '#3B82F6' |
| icon | VARCHAR(50) | DEFAULT 'folder' |
| is_archived | BOOLEAN | DEFAULT FALSE |
| created_by | CHAR(36) | FK → users.id |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |
| deleted_at | DATETIME | NULLABLE |

### projects
| Column | Type | Constraints |
|--------|------|------------|
| id | CHAR(36) | PK |
| workspace_id | CHAR(36) | FK → workspaces.id, INDEX |
| name | VARCHAR(255) | NOT NULL |
| slug | VARCHAR(100) | INDEX |
| description | TEXT | NULLABLE |
| color | VARCHAR(7) | DEFAULT '#10B981' |
| icon | VARCHAR(50) | DEFAULT 'project' |
| status | VARCHAR(50) | DEFAULT 'planning' |
| priority | VARCHAR(50) | DEFAULT 'medium' |
| start_date | DATETIME | NULLABLE |
| end_date | DATETIME | NULLABLE |
| budget | INT | NULLABLE |
| is_archived | BOOLEAN | DEFAULT FALSE |
| created_by | CHAR(36) | FK → users.id |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |
| deleted_at | DATETIME | NULLABLE |

### boards
| Column | Type | Constraints |
|--------|------|------------|
| id | CHAR(36) | PK |
| project_id | CHAR(36) | FK → projects.id, INDEX |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | NULLABLE |
| type | VARCHAR(50) | DEFAULT 'kanban' |
| is_default | BOOLEAN | DEFAULT FALSE |
| is_archived | BOOLEAN | DEFAULT FALSE |
| created_by | CHAR(36) | FK → users.id |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |
| deleted_at | DATETIME | NULLABLE |

### board_columns
| Column | Type | Constraints |
|--------|------|------------|
| id | CHAR(36) | PK |
| board_id | CHAR(36) | FK → boards.id, INDEX |
| name | VARCHAR(255) | NOT NULL |
| color | VARCHAR(7) | DEFAULT '#6B7280' |
| position | INT | DEFAULT 0 |
| wip_limit | INT | NULLABLE |
| is_default | BOOLEAN | DEFAULT FALSE |
| is_archived | BOOLEAN | DEFAULT FALSE |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |
| deleted_at | DATETIME | NULLABLE |

### tasks
| Column | Type | Constraints |
|--------|------|------------|
| id | CHAR(36) | PK |
| column_id | CHAR(36) | FK → board_columns.id, INDEX |
| parent_task_id | CHAR(36) | FK → tasks.id, INDEX |
| title | VARCHAR(500) | NOT NULL |
| description | TEXT | NULLABLE |
| position | INT | DEFAULT 0 |
| priority | VARCHAR(50) | DEFAULT 'medium' |
| due_date | DATETIME | NULLABLE |
| start_date | DATETIME | NULLABLE |
| estimated_hours | INT | NULLABLE |
| actual_hours | INT | DEFAULT 0 |
| assignee_id | CHAR(36) | FK → users.id, INDEX |
| reporter_id | CHAR(36) | FK → users.id |
| is_completed | BOOLEAN | DEFAULT FALSE |
| completed_at | DATETIME | NULLABLE |
| is_archived | BOOLEAN | DEFAULT FALSE |
| created_at | DATETIME | NOT NULL |
| updated_at | DATETIME | NOT NULL |
| deleted_at | DATETIME | NULLABLE |

### Additional Tables
- **subtasks** - Task sub-items with position ordering
- **checklists** - Task checklists with completion tracking
- **comments** - Threaded comments with author tracking
- **attachments** - File attachments with metadata
- **labels** - Project-scoped labels with colors
- **task_labels** - Many-to-many task-label association
- **time_entries** - Time tracking per task
- **activity_logs** - Audit trail for all actions
- **notifications** - User notifications with read status
- **milestones** - Project milestones with due dates
- **workspace_members** - Workspace membership
- **project_members** - Project membership
