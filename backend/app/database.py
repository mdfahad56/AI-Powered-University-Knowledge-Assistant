import os
import shutil
import sys
import warnings
from pathlib import Path
from typing import Generator
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


def build_database_url() -> str:
    database_url = os.getenv("DATABASE_URL") or os.getenv("MYSQL_URL")
    if database_url:
        return database_url

    if any("pytest" in arg.lower() for arg in sys.argv) and not (os.getenv("MYSQL_HOST") or os.getenv("MYSQL_USER") or os.getenv("MYSQL_DATABASE")):
        return "sqlite://"

    mysql_host = os.getenv("MYSQL_HOST")
    if mysql_host:
        mysql_user = quote_plus(os.getenv("MYSQL_USER", "root"))
        mysql_password = quote_plus(os.getenv("MYSQL_PASSWORD", ""))
        mysql_database = quote_plus(os.getenv("MYSQL_DATABASE", "university_assistant"))
        mysql_port = os.getenv("MYSQL_PORT", "3306")
        return f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}"

    storage_dir = os.path.join(os.path.dirname(__file__), "storage")
    os.makedirs(storage_dir, exist_ok=True)
    db_path = os.path.abspath(os.path.join(storage_dir, "university_assistant.db")).replace("\\", "/")
    return f"sqlite:///{db_path}"


def _is_sqlite_url(database_url: str) -> bool:
    return database_url.startswith("sqlite")


def create_engine_with_fallback() -> object:
    database_url = build_database_url()
    engine_kwargs = {
        "pool_pre_ping": True,
        "future": True,
    }
    if _is_sqlite_url(database_url):
        engine_kwargs["poolclass"] = StaticPool
        engine_kwargs["connect_args"] = {"check_same_thread": False}

    engine = create_engine(database_url, **engine_kwargs)

    if database_url.startswith("mysql"):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return engine
        except Exception:
            if "PYTEST_CURRENT_TEST" in os.environ:
                sqlite_url = "sqlite://"
            else:
                storage_dir = os.path.join(os.path.dirname(__file__), "storage")
                os.makedirs(storage_dir, exist_ok=True)
                sqlite_db_path = os.path.abspath(os.path.join(storage_dir, "university_assistant.db")).replace("\\", "/")
                sqlite_url = f"sqlite:///{sqlite_db_path}"
            warnings.warn(
                "MySQL server is not reachable; falling back to SQLite for local/test execution. "
                f"Set MYSQL_HOST/MYSQL_PASSWORD and ensure MySQL is running to use MySQL for persistence.",
                RuntimeWarning,
            )
            sqlite_engine = create_engine(
                sqlite_url,
                pool_pre_ping=True,
                future=True,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False},
            )
            return sqlite_engine

    return engine


engine = create_engine_with_fallback()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def reset_test_storage_if_needed() -> None:
    if "PYTEST_CURRENT_TEST" not in os.environ:
        return

    storage_dir = os.path.join(os.path.dirname(__file__), "storage")
    os.makedirs(storage_dir, exist_ok=True)

    for item_name in ["university_assistant.db", "Question_Papers", "resources"]:
        item_path = os.path.join(storage_dir, item_name)
        if os.path.isdir(item_path):
            for root, dirs, files in os.walk(item_path, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir(item_path)
        elif os.path.exists(item_path):
            os.remove(item_path)

    test_storage_root = os.path.join(os.path.abspath(os.path.join(os.getcwd(), "..")), "test_storage")
    if os.path.exists(test_storage_root):
        shutil.rmtree(test_storage_root, ignore_errors=True)


def init_db() -> None:
    from .models import QuestionPaperResource

    reset_test_storage_if_needed()
    storage_dir = os.path.join(os.path.dirname(__file__), "storage")
    os.makedirs(storage_dir, exist_ok=True)
    if "PYTEST_CURRENT_TEST" in os.environ:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
