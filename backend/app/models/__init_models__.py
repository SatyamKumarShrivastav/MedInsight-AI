"""
MedInsight AI — SQLAlchemy ORM Models: Quality, Preprocessing, ML, Prediction, Anomaly, Signal, Document, Report, Activity
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


# ── Data Quality ──────────────────────────────────────────────────────────────

class DataQualityReport(Base):
    __tablename__ = "data_quality_reports"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    quality_score = Column(Float, nullable=True)
    missing_pct = Column(Float, default=0.0)
    duplicate_count = Column(Integer, default=0)
    total_issues = Column(Integer, default=0)
    issues_json = Column(JSON, nullable=True)
    column_quality_json = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    dataset = relationship("Dataset", back_populates="quality_reports")


# ── Preprocessing ─────────────────────────────────────────────────────────────

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class PreprocessingJob(Base):
    __tablename__ = "preprocessing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    config_json = Column(JSON, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    result_dataset_id = Column(Integer, nullable=True)
    pipeline_path = Column(String(1000), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)

    dataset = relationship("Dataset", back_populates="preprocessing_jobs")


# ── ML / Experiments ──────────────────────────────────────────────────────────

class TaskType(str, enum.Enum):
    CLASSIFICATION = "CLASSIFICATION"
    REGRESSION = "REGRESSION"


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_type = Column(Enum(TaskType), nullable=False)
    target_column = Column(String(255), nullable=False)
    feature_columns = Column(JSON, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    dataset = relationship("Dataset", back_populates="experiments")
    user = relationship("User", back_populates="experiments")
    models = relationship("MLModel", back_populates="experiment", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="experiment")


class MLModel(Base):
    __tablename__ = "ml_models"

    id = Column(Integer, primary_key=True, index=True)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=False)
    algorithm = Column(String(100), nullable=False)
    hyperparams_json = Column(JSON, nullable=True)
    artifact_path = Column(String(1000), nullable=True)
    pipeline_path = Column(String(1000), nullable=True)
    feature_names = Column(JSON, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    training_duration_sec = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    experiment = relationship("Experiment", back_populates="models")
    metrics = relationship("ModelMetric", back_populates="model", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="model")


class ModelMetric(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=False)
    metric_name = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=True)
    metric_json = Column(JSON, nullable=True)  # for confusion matrix, etc.

    model = relationship("MLModel", back_populates="metrics")


# ── Predictions & Explanations ────────────────────────────────────────────────

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("ml_models.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    input_json = Column(JSON, nullable=False)
    output_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    model = relationship("MLModel", back_populates="predictions")
    user = relationship("User", back_populates="predictions")
    explanation = relationship("PredictionExplanation", back_populates="prediction", uselist=False)


class PredictionExplanation(Base):
    __tablename__ = "prediction_explanations"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"), nullable=False)
    method = Column(String(50), default="SHAP")
    shap_values_json = Column(JSON, nullable=True)
    feature_importance_json = Column(JSON, nullable=True)
    base_value = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    prediction = relationship("Prediction", back_populates="explanation")


# ── Anomaly Detection ─────────────────────────────────────────────────────────

class AnomalyJob(Base):
    __tablename__ = "anomaly_jobs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    algorithm = Column(String(100), nullable=False)
    params_json = Column(JSON, nullable=True)
    feature_columns = Column(JSON, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    anomaly_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    dataset = relationship("Dataset", back_populates="anomaly_jobs")
    results = relationship("AnomalyResult", back_populates="job", cascade="all, delete-orphan")


class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("anomaly_jobs.id"), nullable=False)
    record_index = Column(Integer, nullable=False)
    anomaly_score = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    record_data = Column(JSON, nullable=True)

    job = relationship("AnomalyJob", back_populates="results")


# ── Signal Analysis ───────────────────────────────────────────────────────────

class SignalAnalysisJob(Base):
    __tablename__ = "signal_analysis_jobs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    file_path = Column(String(1000), nullable=True)
    signal_type = Column(String(50), nullable=True)  # ECG, EEG, EMG
    sampling_rate = Column(Float, nullable=True)
    config_json = Column(JSON, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    results_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    dataset = relationship("Dataset", back_populates="signal_jobs")


# ── Research Documents ────────────────────────────────────────────────────────

class DocStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    ERROR = "ERROR"


class ResearchDocument(Base):
    __tablename__ = "research_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    authors = Column(String(500), nullable=True)
    year = Column(Integer, nullable=True)
    source = Column(String(500), nullable=True)
    doi = Column(String(255), nullable=True)
    file_path = Column(String(1000), nullable=False)
    file_format = Column(String(20), nullable=False)  # pdf, txt
    checksum = Column(String(64), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(DocStatus), default=DocStatus.UPLOADED)
    word_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("research_documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    keywords = Column(JSON, nullable=True)
    page_number = Column(Integer, nullable=True)

    document = relationship("ResearchDocument", back_populates="chunks")


# ── Reports ───────────────────────────────────────────────────────────────────

class ReportType(str, enum.Enum):
    PDF = "PDF"
    CSV = "CSV"
    XLSX = "XLSX"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    experiment_id = Column(Integer, ForeignKey("experiments.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_type = Column(Enum(ReportType), default=ReportType.PDF)
    file_path = Column(String(1000), nullable=True)
    content_json = Column(JSON, nullable=True)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())

    experiment = relationship("Experiment", back_populates="reports")
    user = relationship("User", back_populates="reports")


# ── Activity Logs ─────────────────────────────────────────────────────────────

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="activity_logs")
