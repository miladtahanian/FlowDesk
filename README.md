<div align="center">

# FlowDesk

## SaaS Project Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![Next.js 15](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com/)

A production-ready, multi-tenant SaaS project management platform.
Plan, track, and deliver projects with powerful Kanban boards, real-time collaboration, and insightful analytics.

[Documentation](#getting-started) | [Report Bug](https://github.com/flowdesk/flowdesk/issues)

</div>

---

## Features

- **Multi-Tenant Architecture** — Complete data isolation between organizations
- **Kanban Boards** — Drag-and-drop task management with customizable columns
- **Workspace & Project Management** — Hierarchical organization of work
- **Task Tracking** — Subtasks, checklists, comments, attachments, labels, and time tracking
- **Role-Based Access Control** — Five roles: super_admin, admin, manager, member, viewer
- **Dashboard & Analytics** — Task statistics, completion rates, and recent activity
- **Notifications** — Real-time notifications for assignments, invitations, and mentions
- **Internationalization** — English and Farsi/Persian support with RTL layout
- **Dark/Light Theme** — System-aware theme switching
- **Mobile App** — React Native (Expo) with bottom tab navigation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, React Query |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy (async), Alembic, Pydantic v2 |
| **Database** | MySQL 8.0 |
| **Cache** | Redis 7 |
| **Storage** | MinIO (S3-compatible) |
| **Mobile** | React Native (Expo SDK 52) |
| **Containers** | Docker & Docker Compose |
| **CI/CD** | GitHub Actions |

---

## Getting Started

### Prerequisites

- Docker & Docker Compose v2+

### Quick Start

```bash
git clone https://github.com/flowdesk/flowdesk.git
cd FlowDesk
docker compose up -d
```

### Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |

---

## Project Structure

```
FlowDesk/
├── backend/            # Python FastAPI backend
├── frontend/           # Next.js 15 frontend
├── mobile/             # React Native (Expo) mobile app
├── docker/             # Docker configurations
├── docs/               # Documentation & GitHub Wiki
├── docker-compose.yml  # Development Docker Compose
└── README.md
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](docs/DEPLOYMENT.md) | Build and run with Docker |
| [Development Guide](docs/DEVELOPMENT.md) | Local development setup |
| [Database Schema](docs/DATABASE_SCHEMA.md) | ER diagram and table definitions |
| [GitHub Wiki](docs/Home.md) | Full project documentation |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
