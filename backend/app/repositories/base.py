from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import TypeVar, Generic, Type, Optional, Sequence
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: str) -> Optional[ModelType]:
        result = await self.db.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: list | None = None,
        order_by: list | None = None,
    ) -> tuple[Sequence[ModelType], int]:
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if filters:
            for f in filters:
                query = query.where(f)
                count_query = count_query.where(f)

        if order_by:
            for o in order_by:
                query = query.order_by(o)
        else:
            # Only order by created_at if the model has this attribute
            if hasattr(self.model, 'created_at'):
                query = query.order_by(self.model.created_at.desc())

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(query.offset(skip).limit(limit))
        return result.scalars().all(), total

    async def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update(self, obj: ModelType, data: dict) -> ModelType:
        for key, value in data.items():
            if value is not None and hasattr(obj, key):
                setattr(obj, key, value)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def delete(self, obj: ModelType) -> None:
        await self.db.delete(obj)
        await self.db.flush()

    async def soft_delete(self, obj: ModelType) -> ModelType:
        from datetime import datetime, timezone
        obj.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def exists(self, filters: list) -> bool:
        query = select(func.count()).select_from(self.model)
        for f in filters:
            query = query.where(f)
        result = await self.db.execute(query)
        return (result.scalar() or 0) > 0
