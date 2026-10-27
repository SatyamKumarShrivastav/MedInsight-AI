"""
MedInsight AI — Database Connection (MySQL via SQLAlchemy)
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import logging

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_database():
    """Ensure the medinsight_ai database exists."""
    import pymysql
    import urllib.parse
    try:
        conn = pymysql.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            port=settings.DB_PORT,
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        conn.commit()
        conn.close()
        logger.info(f"Database '{settings.DB_NAME}' ready.")
    except Exception as e:
        logger.error(f"Could not create database: {e}")
        raise


def init_db():
    """Create all tables if they don't exist."""
    # Import the models package — its __init__.py imports all ORM classes
    # (User, Dataset, DataQualityReport, Experiment, MLModel, etc.)
    # so that SQLAlchemy's Base.metadata sees every table.
    import app.models  # noqa: F401
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("All tables created/verified.")
    except Exception as e:
        logger.error(f"Table creation failed: {e}")
        raise
