from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException
from app.repositories.board import BoardRepository, BoardColumnRepository
from app.models.board import Board, BoardColumn
from app.models.user import User
from app.schemas.board import BoardCreateRequest, BoardUpdateRequest


DEFAULT_COLUMNS = [
    {"name": "To Do", "color": "#6B7280", "position": 0},
    {"name": "In Progress", "color": "#3B82F6", "position": 1},
    {"name": "Review", "color": "#F59E0B", "position": 2},
    {"name": "Done", "color": "#10B981", "position": 3},
]


class BoardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.board_repo = BoardRepository(db)
        self.column_repo = BoardColumnRepository(db)

    async def get_by_id(self, board_id: str) -> Board:
        board = await self.board_repo.get_with_columns(board_id)
        if not board:
            raise NotFoundException("Board")
        return board

    async def get_by_project(self, project_id: str) -> list[Board]:
        return await self.board_repo.get_by_project(project_id)

    async def create(
        self, data: BoardCreateRequest, project_id: str, user: User
    ) -> Board:
        board = Board(
            project_id=project_id,
            name=data.name,
            description=data.description,
            type=data.type or "kanban",
            created_by=user.id,
        )
        board = await self.board_repo.create(board)

        for col_data in DEFAULT_COLUMNS:
            column = BoardColumn(
                board_id=board.id,
                name=col_data["name"],
                color=col_data["color"],
                position=col_data["position"],
                is_default=True,
            )
            await self.column_repo.create(column)

        return await self.board_repo.get_with_columns(board.id)

    async def update(
        self, board_id: str, data: BoardUpdateRequest, user: User
    ) -> Board:
        board = await self.get_by_id(board_id)
        update_data = data.model_dump(exclude_unset=True)
        return await self.board_repo.update(board, update_data)

    async def delete(self, board_id: str, user: User) -> None:
        board = await self.get_by_id(board_id)
        await self.board_repo.soft_delete(board)

    async def create_column(
        self, board_id: str, name: str, color: str, user: User
    ) -> BoardColumn:
        board = await self.get_by_id(board_id)

        existing_columns = await self.column_repo.get_by_board(board_id)
        max_position = max((c.position for c in existing_columns), default=0)

        column = BoardColumn(
            board_id=board_id,
            name=name,
            color=color or "#6B7280",
            position=max_position + 1,
        )
        return await self.column_repo.create(column)

    async def update_column(
        self, column_id: str, name: str = None, color: str = None
    ) -> BoardColumn:
        column = await self.column_repo.get_by_id(column_id)
        if not column:
            raise NotFoundException("Column")

        update_data = {}
        if name is not None:
            update_data["name"] = name
        if color is not None:
            update_data["color"] = color

        if update_data:
            column = await self.column_repo.update(column, update_data)

        return column

    async def delete_column(self, column_id: str) -> None:
        column = await self.column_repo.get_by_id(column_id)
        if not column:
            raise NotFoundException("Column")

        if column.is_default:
            raise ForbiddenException("Cannot delete default columns")

        from app.repositories.task import TaskRepository

        task_repo = TaskRepository(self.db)
        tasks = await task_repo.get_by_column(column_id)
        if tasks:
            raise ForbiddenException(
                "Cannot delete column with existing tasks"
            )

        await self.column_repo.delete(column)

    async def reorder_columns(
        self, board_id: str, column_ids: list[str]
    ) -> list[BoardColumn]:
        columns = await self.column_repo.get_by_board(board_id)

        column_map = {c.id: c for c in columns}

        for idx, col_id in enumerate(column_ids):
            if col_id in column_map:
                column_map[col_id].position = idx

        await self.db.flush()

        return sorted(columns, key=lambda c: c.position)

    async def get_columns_with_tasks(self, board_id: str) -> list[dict]:
        board = await self.board_repo.get_with_columns(board_id)
        if not board:
            raise NotFoundException("Board")

        result = []
        for column in board.columns:
            tasks_data = []
            for task in column.tasks:
                tasks_data.append({
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "position": task.position,
                    "priority": task.priority,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "assignee_id": task.assignee_id,
                    "reporter_id": task.reporter_id,
                    "is_completed": task.is_completed,
                    "created_at": task.created_at.isoformat(),
                })

            result.append({
                "id": column.id,
                "name": column.name,
                "color": column.color,
                "position": column.position,
                "wip_limit": column.wip_limit,
                "tasks": tasks_data,
            })

        return sorted(result, key=lambda c: c["position"])
