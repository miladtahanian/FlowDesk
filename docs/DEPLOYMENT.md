# Deployment Guide

How to build and run FlowDesk using Docker.

---

## Prerequisites

- **Docker** v20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** v2+ ([Install Compose](https://docs.docker.com/compose/install/))
- **Git**

---

## Quick Start

```bash
git clone https://github.com/flowdesk/flowdesk.git
cd FlowDesk
docker compose up -d
```

That's it. The first build takes 3-5 minutes. Subsequent starts take ~30 seconds.

---

## Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| MySQL | flowdesk-mysql | 3306 | Database |
| Redis | flowdesk-redis | 6379 | Cache & sessions |
| MinIO | flowdesk-minio | 9000, 9001 | Object storage (S3-compatible) |
| Backend | flowdesk-backend | 8000 | FastAPI REST API |
| Frontend | flowdesk-frontend | 3000 | Next.js application |

---

## Environment Variables

### Backend

Create `backend/.env` or pass via `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `dev-secret-key-change-in-production` | JWT signing key |
| `DATABASE_URL` | `mysql+aiomysql://flowdesk:password@mysql:3306/flowdesk` | Database URL |
| `REDIS_URL` | `redis://redis:6379/0` | Redis URL |
| `MINIO_ENDPOINT` | `minio:9000` | MinIO endpoint |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `minioadmin` | MinIO secret key |
| `MINIO_BUCKET` | `flowdesk` | Bucket name |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed origins |
| `ENVIRONMENT` | `development` | Environment name |
| `DEBUG` | `true` | Debug mode |

### Frontend

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API URL |

---

## Docker Commands

### Start Services

```bash
# Start all services in background
docker compose up -d

# Start with build (rebuild images)
docker compose up -d --build

# Start in foreground (see logs)
docker compose up
```

### Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Access Services

```bash
# Backend shell
docker compose exec backend bash

# MySQL CLI
docker compose exec mysql mysql -u flowdesk -p flowdesk

# Redis CLI
docker compose exec redis redis-cli
```

### Rebuild

```bash
# Rebuild specific service
docker compose build backend
docker compose build frontend

# Rebuild all
docker compose build --no-cache
```

---

## Production Deployment

### Using Production Compose

```bash
# Set required environment variables
export SECRET_KEY=$(openssl rand -hex 32)
export MYSQL_PASSWORD=$(openssl rand -hex 16)
export DOMAIN=yourdomain.com

# Start with production config
docker compose -f docker/docker-compose.prod.yml up -d --build
```

### Environment Variables for Production

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | **Required.** Random 64-character hex string |
| `MYSQL_ROOT_PASSWORD` | **Required.** Strong MySQL root password |
| `MYSQL_PASSWORD` | **Required.** MySQL user password |
| `DOMAIN` | **Required.** Your domain name |
| `MINIO_ROOT_USER` | MinIO access key |
| `MINIO_ROOT_PASSWORD` | MinIO secret key |

### Generate Secure Keys

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate MySQL password
openssl rand -hex 16
```

### SSL/TLS Setup

The production nginx config expects SSL certificates:

1. Place your certificates in `docker/ssl/`:
   ```bash
   mkdir -p docker/ssl
   cp /path/to/cert.pem docker/ssl/cert.pem
   cp /path/to/key.pem docker/ssl/key.pem
   ```

2. Or use Let's Encrypt:
   ```bash
   # Install certbot
   sudo apt install certbot

   # Get certificate
   sudo certbot certonly --standalone -d yourdomain.com

   # Copy to docker/ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/key.pem
   ```

---

## Data Persistence

Docker volumes preserve data across container restarts:

| Volume | Container | Data |
|--------|-----------|------|
| `mysql_data` | flowdesk-mysql | Database files |
| `redis_data` | flowdesk-redis | Cache data |
| `minio_data` | flowdesk-minio | Uploaded files |

### Backup

```bash
# MySQL backup
docker compose exec mysql mysqldump -u flowdesk -p flowdesk > backup.sql

# Redis backup
docker compose exec redis redis-cli BGSAVE

# MinIO backup
docker run --rm -v flowdesk_minio_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/minio-backup.tar.gz /data
```

### Restore

```bash
# MySQL restore
cat backup.sql | docker compose exec -T mysql mysql -u flowdesk -p flowdesk
```

---

## Troubleshooting

### Container won't start

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs <service_name>

# Check if port is in use
netstat -tlnp | grep :3000
```

### Database connection failed

```bash
# Wait for MySQL healthcheck
docker compose up -d
docker compose exec mysql mysqladmin ping -h localhost

# Check MySQL logs
docker compose logs mysql
```

### Frontend can't reach backend

Ensure `NEXT_PUBLIC_API_URL` matches your backend URL. In Docker, use the service name:

```
NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
```

For browser access, use:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Fresh Start

```bash
docker compose down -v
docker compose up -d --build
```
