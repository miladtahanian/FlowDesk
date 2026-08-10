from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional
from app.models.board import Board, BoardColumn
from app.repositories.base import BaseRepository


class BoardRepository(BaseRepository[Board]):
    def __init__(self, db: AsyncSession):
        super().__init__(Board, db)

    async def get_by_project(self, project_id: str) -> list[Board]:
        result = await self.db.execute(
            select(Board)
            .where(Board.project_id == project_id, Board.deleted_at.is_(None))
            .order_by(Board.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_with_columns(self, board_id: str) -> Optional[Board]:
        result = await self.db.execute(
            select(Board)
            .options(
                selectinload(Board.columns)
                .selectinload(BoardColumn.tasks)
            )
            .where(Board.id == board_id)
        )
        return result.scalar_one_or_none()


class BoardColumnRepository(BaseRepository[BoardColumn]):
    def __init__(self, db: AsyncSession):
        super().__init__(BoardColumn, db)

    async def get_by_board(self, board_id: str) -> list[BoardColumn]:
        result = await self.db.execute(
            select(BoardColumn)
            .where(BoardColumn.board_id == board_id, BoardColumn.deleted_at.is_(None))
            .order_by(BoardColumn.position)
        )
        return list(result.scalars().all())
