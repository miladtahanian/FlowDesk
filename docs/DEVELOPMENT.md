# Development Guide

## Prerequisites

- Docker & Docker Compose v2+
- Node.js 20+ (for frontend local dev)
- Python 3.12+ (for backend local dev)
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repo-url>
cd FlowDesk
```

### 2. Start Services

```bash
docker-compose up -d mysql redis minio
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 5. Access Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| MinIO Console | http://localhost:9001 |

## Development Workflow

### Creating a New Feature

1. Create a branch: `git checkout -b feature/my-feature`
2. Backend changes:
   - Add/update models in `app/models/`
   - Create schemas in `app/schemas/`
   - Add repository in `app/repositories/`
   - Add routes in `app/api/v1/`
   - Create migration: `alembic revision --autogenerate -m "description"`
3. Frontend changes:
   - Add types in `src/types/`
   - Create components in `src/components/`
   - Add pages in `src/app/`
   - Create hooks in `src/hooks/`
4. Test your changes
5. Submit a PR

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "add feature x"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Running Tests

```bash
# Backend
cd backend
pytest --cov=app tests/ -v

# Frontend
cd frontend
npm run lint
npm run type-check
```

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | MySQL connection string | mysql+aiomysql://flowdesk:password@localhost:3306/flowdesk |
| REDIS_URL | Redis connection string | redis://localhost:6379/0 |
| SECRET_KEY | JWT signing key | (change in production) |
| MINIO_ENDPOINT | MinIO server address | localhost:9000 |
| SMTP_HOST | Email SMTP host | smtp.gmail.com |

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:8000/api/v1 |

## Troubleshooting

### MySQL Connection Issues
- Ensure MySQL container is running: `docker-compose ps`
- Check logs: `docker-compose logs mysql`

### Port Conflicts
- Check if ports 3000, 8000, 3306, 6379, 9000 are available
- Modify ports in `docker-compose.yml` if needed

### Migration Errors
- Reset database: `docker-compose down -v && docker-compose up -d mysql`
- Re-run migrations: `alembic upgrade head`
