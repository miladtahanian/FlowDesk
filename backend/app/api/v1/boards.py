from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.repositories.board import BoardRepository, BoardColumnRepository
from app.schemas.board import (
    BoardCreateRequest, BoardUpdateRequest, BoardResponse, BoardDetailResponse,
    ColumnCreateRequest, ColumnUpdateRequest, ColumnResponse,
)
from app.api.deps import get_current_user
from app.models.user import User
from app.models.board import Board, BoardColumn

router = APIRouter()


@router.get("/project/{project_id}", response_model=list[BoardResponse])
async def list_boards(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        board_repo = BoardRepository(db)
        boards = await board_repo.get_by_project(project_id)
        return [BoardResponse.model_validate(b) for b in boards]
    except Exception as e:
        import structlog
        logger = structlog.get_logger()
        logger.error("error_fetching_boards", project_id=project_id, error=str(e))
        raise


@router.post("/project/{project_id}", response_model=BoardResponse)
async def create_board(
    project_id: str,
    data: BoardCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board_repo = BoardRepository(db)

    board = Board(
        project_id=project_id,
        name=data.name,
        description=data.description,
        type=data.type or "kanban",
        is_default=data.is_default or False,
        created_by=current_user.id,
    )
    board = await board_repo.create(board)

    default_columns = [
        ("To Do", "#6B7280", 0),
        ("In Progress", "#3B82F6", 1),
        ("Review", "#F59E0B", 2),
        ("Done", "#10B981", 3),
    ]
    col_repo = BoardColumnRepository(db)
    for name, color, pos in default_columns:
        col = BoardColumn(
            board_id=board.id,
            name=name,
            color=color,
            position=pos,
            is_default=True,
        )
        await col_repo.create(col)

    return BoardResponse.model_validate(board)


@router.get("/{board_id}", response_model=BoardDetailResponse)
async def get_board(
    board_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board_repo = BoardRepository(db)
    board = await board_repo.get_with_columns(board_id)
    if not board:
        raise NotFoundException("Board")
    return BoardDetailResponse.model_validate(board)


@router.put("/{board_id}", response_model=BoardResponse)
async def update_board(
    board_id: str,
    data: BoardUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board_repo = BoardRepository(db)
    board = await board_repo.get_by_id(board_id)
    if not board:
        raise NotFoundException("Board")
    updated = await board_repo.update(board, data.model_dump(exclude_unset=True))
    return BoardResponse.model_validate(updated)


@router.delete("/{board_id}")
async def delete_board(
    board_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    board_repo = BoardRepository(db)
    board = await board_repo.get_by_id(board_id)
    if not board:
        raise NotFoundException("Board")
    await board_repo.soft_delete(board)
    return {"message": "Board deleted"}


@router.post("/{board_id}/columns", response_model=ColumnResponse)
async def create_column(
    board_id: str,
    data: ColumnCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    col_repo = BoardColumnRepository(db)
    col = BoardColumn(
        board_id=board_id,
        name=data.name,
        color=data.color or "#6B7280",
        position=data.position or 0,
        wip_limit=data.wip_limit,
    )
    col = await col_repo.create(col)
    return ColumnResponse.model_validate(col)


@router.put("/columns/{column_id}", response_model=ColumnResponse)
async def update_column(
    column_id: str,
    data: ColumnUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    col_repo = BoardColumnRepository(db)
    col = await col_repo.get_by_id(column_id)
    if not col:
        raise NotFoundException("Column")
    updated = await col_repo.update(col, data.model_dump(exclude_unset=True))
    return ColumnResponse.model_validate(updated)


@router.delete("/columns/{column_id}")
async def delete_column(
    column_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    col_repo = BoardColumnRepository(db)
    col = await col_repo.get_by_id(column_id)
    if not col:
        raise NotFoundException("Column")
    await col_repo.soft_delete(col)
    return {"message": "Column deleted"}
