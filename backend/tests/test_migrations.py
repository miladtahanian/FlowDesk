from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.core.database import Base
from app.core.config import settings
import os


def run_migrations():
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    command.upgrade(alembic_cfg, "head")


def test_generate_migration():
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    command.revision(alembic_cfg, autogenerate=True, message="initial")
    assert os.path.exists(os.path.join(os.path.dirname(__file__), "..", "alembic", "versions"))


if __name__ == "__main__":
    run_migrations()
