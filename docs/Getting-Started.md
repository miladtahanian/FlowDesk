# Getting Started

This guide walks you through setting up FlowDesk for the first time.

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2+ | `docker compose version` |
| Git | 2.0+ | `git --version` |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/flowdesk/flowdesk.git
cd FlowDesk
```

### 2. Start with Docker

```bash
docker compose up -d
```

This starts 5 services:
- MySQL (database)
- Redis (cache)
- MinIO (file storage)
- Backend (FastAPI API)
- Frontend (Next.js app)

### 3. Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Docs** | http://localhost:8000/docs |
| **API** | http://localhost:8000/api/v1 |
| **MinIO Console** | http://localhost:9001 |

### 4. Create Your Account

1. Open http://localhost:3000
2. Click **Get Started Free**
3. Enter your email and password
4. You're ready to go!

---

## Local Development

If you prefer running without Docker:

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

---

## Project Structure

```
FlowDesk/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API routes
│   │   ├── core/            # Config, database, security
│   │   ├── middleware/       # Rate limiting, logging, tenant
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── repositories/    # Data access layer
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   ├── alembic/             # Database migrations
│   └── tests/               # Test suite
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # UI components
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # API client, utils
│       ├── stores/          # Zustand state
│       └── types/           # TypeScript types
├── mobile/                  # React Native app
├── docker/                  # Docker configs
└── docs/                    # Documentation
```

---

## Next Steps

- [Architecture Overview](Architecture.md)
- [API Reference](API-Reference.md)
- [Deployment Guide](DEPLOYMENT.md)
