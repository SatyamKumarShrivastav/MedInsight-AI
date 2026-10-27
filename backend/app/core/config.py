"""
MedInsight AI — Core Configuration
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "MedInsight AI"
    APP_VERSION: str = "1.0.0"
    TEAM: str = "BioIntelliX"
    LEADER: str = "Mr. S. K. Shrivastav"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database (MySQL)
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str
    DB_NAME: str = os.getenv("DB_NAME", "medinsight_ai")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))

    @property
    def DATABASE_URL(self) -> str:
        import urllib.parse
        pwd = urllib.parse.quote_plus(self.DB_PASSWORD)
        return f"mysql+pymysql://{self.DB_USER}:{pwd}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # File storage
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    ARTIFACT_DIR: str = os.path.join(BASE_DIR, "artifacts")
    REPORT_DIR: str = os.path.join(BASE_DIR, "reports")
    DATASET_DIR: str = os.path.join(BASE_DIR, "datasets")

    # Limits
    MAX_UPLOAD_SIZE_MB: int = 50
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024

    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
