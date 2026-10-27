"""
MedInsight AI — Data Preprocessing API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import os, joblib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset, DatasetStatus
from app.models.__init_models__ import PreprocessingJob, JobStatus, ActivityLog

router = APIRouter(prefix="/preprocessing", tags=["Preprocessing"])


class PreprocessingConfig(BaseModel):
    missing_strategy: str = "mean"          # mean, median, mode, drop_row, drop_col, constant
    missing_constant: Optional[float] = 0.0
    remove_duplicates: bool = True
    encoding: str = "label"                  # label, onehot, none
    scaling: str = "standard"                # standard, minmax, none
    outlier_strategy: str = "none"           # none, clip, remove_iqr
    test_size: float = 0.2
    random_state: int = 42
    target_column: Optional[str] = None
    drop_columns: Optional[List[str]] = []
    categorical_columns: Optional[List[str]] = None
    numeric_columns: Optional[List[str]] = None


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="preprocessing",
                       resource_id=resource_id, details=details))
    db.commit()


@router.post("/{dataset_id}/run")
def run_preprocessing(
    dataset_id: int,
    config: PreprocessingConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    # Create job record
    job = PreprocessingJob(
        dataset_id=dataset_id,
        config_json=config.model_dump(),
        status=JobStatus.RUNNING,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        # Load data
        if ds.file_format == "csv":
            df = pd.read_csv(ds.file_path)
        else:
            df = pd.read_excel(ds.file_path)

        original_shape = df.shape
        log_steps = []

        # Drop user-specified columns
        if config.drop_columns:
            df = df.drop(columns=[c for c in config.drop_columns if c in df.columns], errors="ignore")
            log_steps.append(f"Dropped columns: {config.drop_columns}")

        # Remove duplicates
        if config.remove_duplicates:
            before = len(df)
            df = df.drop_duplicates()
            removed = before - len(df)
            log_steps.append(f"Removed {removed} duplicate rows.")

        # Identify column types
        if config.numeric_columns is not None:
            num_cols = [c for c in config.numeric_columns if c in df.columns]
        else:
            num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if config.categorical_columns is not None:
            cat_cols = [c for c in config.categorical_columns if c in df.columns]
        else:
            cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        # Exclude target
        if config.target_column:
            num_cols = [c for c in num_cols if c != config.target_column]
            cat_cols = [c for c in cat_cols if c != config.target_column]

        # Missing value handling — numeric
        if config.missing_strategy == "mean" and num_cols:
            imp = SimpleImputer(strategy="mean")
            df[num_cols] = imp.fit_transform(df[num_cols])
        elif config.missing_strategy == "median" and num_cols:
            imp = SimpleImputer(strategy="median")
            df[num_cols] = imp.fit_transform(df[num_cols])
        elif config.missing_strategy == "constant" and num_cols:
            df[num_cols] = df[num_cols].fillna(config.missing_constant)
        elif config.missing_strategy == "drop_row":
            before = len(df)
            df = df.dropna()
            log_steps.append(f"Dropped {before - len(df)} rows with any missing values.")
        elif config.missing_strategy == "drop_col":
            empty_cols = [c for c in df.columns if df[c].isnull().all()]
            df = df.drop(columns=empty_cols)
            log_steps.append(f"Dropped fully-empty columns: {empty_cols}")

        # Missing value handling — categorical
        if cat_cols:
            imp_cat = SimpleImputer(strategy="most_frequent")
            df[cat_cols] = imp_cat.fit_transform(df[cat_cols])

        log_steps.append(f"Missing value strategy: {config.missing_strategy}")

        # Outlier handling
        if config.outlier_strategy == "clip" and num_cols:
            for c in num_cols:
                q1 = df[c].quantile(0.25)
                q3 = df[c].quantile(0.75)
                iqr = q3 - q1
                df[c] = df[c].clip(lower=q1 - 1.5*iqr, upper=q3 + 1.5*iqr)
            log_steps.append("Clipped outliers using IQR method.")
        elif config.outlier_strategy == "remove_iqr" and num_cols:
            before = len(df)
            mask = pd.Series([True] * len(df), index=df.index)
            for c in num_cols:
                q1 = df[c].quantile(0.25)
                q3 = df[c].quantile(0.75)
                iqr = q3 - q1
                mask &= (df[c] >= q1 - 1.5*iqr) & (df[c] <= q3 + 1.5*iqr)
            df = df[mask]
            log_steps.append(f"Removed {before - len(df)} outlier rows.")

        # Encoding
        encoders = {}
        if config.encoding == "label" and cat_cols:
            for c in cat_cols:
                le = LabelEncoder()
                df[c] = le.fit_transform(df[c].astype(str))
                encoders[c] = {"type": "label", "classes": le.classes_.tolist()}
            log_steps.append("Applied label encoding to categorical columns.")
        elif config.encoding == "onehot" and cat_cols:
            df = pd.get_dummies(df, columns=cat_cols, drop_first=False)
            log_steps.append("Applied one-hot encoding to categorical columns.")

        # Scaling
        scaler = None
        if config.scaling == "standard" and num_cols:
            scaler = StandardScaler()
            valid_num = [c for c in num_cols if c in df.columns]
            df[valid_num] = scaler.fit_transform(df[valid_num])
            log_steps.append("Applied standard scaling to numeric columns.")
        elif config.scaling == "minmax" and num_cols:
            scaler = MinMaxScaler()
            valid_num = [c for c in num_cols if c in df.columns]
            df[valid_num] = scaler.fit_transform(df[valid_num])
            log_steps.append("Applied min-max normalization to numeric columns.")

        # Save processed dataset
        out_name = f"preprocessed_{dataset_id}_{job.id}.csv"
        out_path = os.path.join(settings.UPLOAD_DIR, out_name)
        df.to_csv(out_path, index=False)

        # Save pipeline artifact
        pipeline_data = {
            "config": config.model_dump(),
            "encoders": encoders,
            "num_cols": num_cols,
            "cat_cols": cat_cols,
            "scaler_type": config.scaling,
            "log_steps": log_steps,
        }
        pipe_name = f"pipeline_{dataset_id}_{job.id}.joblib"
        pipe_path = os.path.join(settings.ARTIFACT_DIR, pipe_name)
        joblib.dump(pipeline_data, pipe_path)

        # Update job
        job.status = JobStatus.COMPLETED
        job.pipeline_path = pipe_path
        job.completed_at = datetime.utcnow()
        db.commit()
        _log(db, current_user.id, "PREPROCESSING_COMPLETE", job.id, {"dataset_id": dataset_id})

        return {
            "job_id": job.id,
            "status": "COMPLETED",
            "original_shape": list(original_shape),
            "processed_shape": list(df.shape),
            "log_steps": log_steps,
            "output_path": out_name,
            "columns": df.columns.tolist(),
            "sample_preview": df.head(5).fillna("").to_dict(orient="records"),
        }

    except Exception as e:
        job.status = JobStatus.FAILED
        job.error_message = str(e)
        db.commit()
        raise HTTPException(500, f"Preprocessing failed: {e}")


@router.get("/{dataset_id}/jobs")
def list_jobs(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    jobs = (
        db.query(PreprocessingJob)
        .filter(PreprocessingJob.dataset_id == dataset_id)
        .order_by(PreprocessingJob.created_at.desc())
        .all()
    )
    return [
        {
            "id": j.id,
            "status": j.status,
            "config": j.config_json,
            "created_at": j.created_at,
            "completed_at": j.completed_at,
            "error": j.error_message,
        }
        for j in jobs
    ]
