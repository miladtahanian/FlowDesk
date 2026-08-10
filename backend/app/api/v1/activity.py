from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.activity import ActivityLogRepository, NotificationRepository
from app.schemas.activity import ActivityLogResponse, NotificationResponse, NotificationMarkReadRequest
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/logs", response_model=list[ActivityLogResponse])
async def list_activity_logs(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    log_repo = ActivityLogRepository(db)
    logs = await log_repo.get_by_tenant(current_user.tenant_id, skip=skip, limit=limit)
    return [ActivityLogResponse.model_validate(l) for l in logs]


@router.get("/logs/{entity_type}/{entity_id}", response_model=list[ActivityLogResponse])
async def list_entity_activity_logs(
    entity_type: str,
    entity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    log_repo = ActivityLogRepository(db)
    logs = await log_repo.get_by_entity(entity_type, entity_id)
    return [ActivityLogResponse.model_validate(l) for l in logs]


@router.get("/notifications", response_model=list[NotificationResponse])
async def list_notifications(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notif_repo = NotificationRepository(db)
    notifs = await notif_repo.get_by_user(current_user.id, skip=skip, limit=limit)
    return [NotificationResponse.model_validate(n) for n in notifs]


@router.get("/notifications/unread-count")
async def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notif_repo = NotificationRepository(db)
    count = await notif_repo.get_unread_count(current_user.id)
    return {"count": count}


@router.put("/notifications/read")
async def mark_notifications_read(
    data: NotificationMarkReadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    notif_repo = NotificationRepository(db)
    for nid in data.notification_ids:
        notif = await notif_repo.get_by_id(nid)
        if notif and notif.user_id == current_user.id:
            notif.is_read = datetime.now(timezone.utc)
    await db.flush()
    return {"message": "Notifications marked as read"}


@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    notif_repo = NotificationRepository(db)
    notifs = await notif_repo.get_by_user(current_user.id)
    for n in notifs:
        if n.is_read is None:
            n.is_read = datetime.now(timezone.utc)
    await db.flush()
    return {"message": "All notifications marked as read"}
