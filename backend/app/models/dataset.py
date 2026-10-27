"""
MedInsight AI — SQLAlchemy ORM Models: Dataset
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class DatasetStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    ERROR = "ERROR"


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    source = Column(String(500), nullable=True)
    file_format = Column(String(20), nullable=False)  # csv, xlsx
    file_path = Column(String(1000), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    num_rows = Column(Integer, nullable=True)
    num_columns = Column(Integer, nullable=True)
    encoding = Column(String(50), default="utf-8")
    license_info = Column(String(500), nullable=True)
    version = Column(Integer, default=1)
    status = Column(Enum(DatasetStatus), default=DatasetStatus.UPLOADED)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="datasets")
    columns_info = relationship("DatasetColumn", back_populates="dataset", cascade="all, delete-orphan")
    quality_reports = relationship("DataQualityReport", back_populates="dataset")
    preprocessing_jobs = relationship("PreprocessingJob", back_populates="dataset")
    experiments = relationship("Experiment", back_populates="dataset")
    anomaly_jobs = relationship("AnomalyJob", back_populates="dataset")
    signal_jobs = relationship("SignalAnalysisJob", back_populates="dataset")


class DatasetColumn(Base):
    __tablename__ = "dataset_columns"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    name = Column(String(255), nullable=False)
    dtype = Column(String(50), nullable=True)
    null_count = Column(Integer, default=0)
    unique_count = Column(Integer, nullable=True)
    min_value = Column(Float, nullable=True)
    max_value = Column(Float, nullable=True)
    mean_value = Column(Float, nullable=True)
    std_value = Column(Float, nullable=True)
    sample_values = Column(JSON, nullable=True)

    dataset = relationship("Dataset", back_populates="columns_info")
