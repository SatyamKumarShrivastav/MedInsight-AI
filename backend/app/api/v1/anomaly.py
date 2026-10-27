"""
MedInsight AI — Anomaly Detection API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.__init_models__ import AnomalyJob, AnomalyResult, JobStatus, ActivityLog

router = APIRouter(prefix="/anomaly", tags=["Anomaly Detection"])


class AnomalyConfig(BaseModel):
    algorithm: str = "isolation_forest"   # isolation_forest, lof, ocsvm
    feature_columns: Optional[List[str]] = None
    contamination: float = 0.05
    n_estimators: int = 100               # for IF
    n_neighbors: int = 20                 # for LOF
    random_state: int = 42


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="anomaly",
                       resource_id=resource_id, details=details))
    db.commit()


@router.post("/{dataset_id}/run")
def run_anomaly(
    dataset_id: int,
    config: AnomalyConfig,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    algo = config.algorithm.lower()
    if algo not in ["isolation_forest", "lof", "ocsvm"]:
        raise HTTPException(400, "Algorithm must be one of: isolation_forest, lof, ocsvm")

    job = AnomalyJob(
        dataset_id=dataset_id,
        algorithm=algo,
        params_json=config.model_dump(),
        feature_columns=config.feature_columns,
        status=JobStatus.RUNNING,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        if ds.file_format == "csv":
            df = pd.read_csv(ds.file_path)
        else:
            df = pd.read_excel(ds.file_path)

        # Select features
        if config.feature_columns:
            feat_cols = [c for c in config.feature_columns if c in df.columns]
        else:
            feat_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if not feat_cols:
            raise ValueError("No numeric feature columns available for anomaly detection")

        X = df[feat_cols].copy()
        imp = SimpleImputer(strategy="mean")
        X_arr = imp.fit_transform(X)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_arr)

        # Train detector
        if algo == "isolation_forest":
            detector = IsolationForest(
                n_estimators=config.n_estimators,
                contamination=config.contamination,
                random_state=config.random_state,
            )
            labels = detector.fit_predict(X_scaled)
            scores = detector.score_samples(X_scaled)
        elif algo == "lof":
            detector = LocalOutlierFactor(
                n_neighbors=min(config.n_neighbors, len(X_scaled) - 1),
                contamination=config.contamination,
            )
            labels = detector.fit_predict(X_scaled)
            scores = detector.negative_outlier_factor_
        else:  # ocsvm
            detector = OneClassSVM(nu=config.contamination)
            labels = detector.fit_predict(X_scaled)
            scores = detector.score_samples(X_scaled)

        is_anomaly = labels == -1
        anomaly_count = int(is_anomaly.sum())
        job.anomaly_count = anomaly_count

        # Save top anomaly records
        top_indices = np.where(is_anomaly)[0][:100]
        results_data = []
        for idx in top_indices:
            score = float(scores[idx]) if scores is not None else None
            record_data = {c: (float(df.iloc[idx][c]) if pd.notna(df.iloc[idx][c]) and isinstance(df.iloc[idx][c], (int, float, np.floating, np.integer)) else str(df.iloc[idx][c])) for c in df.columns[:20]}
            ar = AnomalyResult(
                job_id=job.id,
                record_index=int(idx),
                anomaly_score=score,
                is_anomaly=True,
                record_data=record_data,
            )
            db.add(ar)
            results_data.append({
                "record_index": int(idx),
                "anomaly_score": score,
                "record_data": record_data,
            })

        job.status = JobStatus.COMPLETED
        db.commit()
        _log(db, current_user.id, "ANOMALY_DETECTION", job.id, {"dataset_id": dataset_id, "algorithm": algo})

        return {
            "job_id": job.id,
            "algorithm": algo,
            "n_samples": len(df),
            "anomaly_count": anomaly_count,
            "anomaly_pct": round(anomaly_count / len(df) * 100, 2),
            "feature_columns": feat_cols,
            "top_anomalies": results_data[:20],
            "disclaimer": (
                "Records flagged as 'anomaly candidates' show statistically unusual patterns relative to the dataset. "
                "This does not imply a medical condition, disease, or emergency. — MedInsight AI, BioIntelliX"
            ),
        }

    except Exception as e:
        job.status = JobStatus.FAILED
        db.commit()
        raise HTTPException(500, f"Anomaly detection failed: {e}")


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
        db.query(AnomalyJob)
        .filter(AnomalyJob.dataset_id == dataset_id)
        .order_by(AnomalyJob.created_at.desc())
        .all()
    )
    return [
        {
            "id": j.id, "algorithm": j.algorithm,
            "anomaly_count": j.anomaly_count, "status": j.status,
            "created_at": j.created_at,
        }
        for j in jobs
    ]


@router.get("/job/{job_id}/results")
def get_job_results(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(AnomalyJob).filter(AnomalyJob.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    ds = db.query(Dataset).filter(Dataset.id == job.dataset_id).first()
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    results = db.query(AnomalyResult).filter(AnomalyResult.job_id == job_id).limit(100).all()
    return {
        "job_id": job_id,
        "algorithm": job.algorithm,
        "anomaly_count": job.anomaly_count,
        "results": [
            {
                "record_index": r.record_index,
                "anomaly_score": r.anomaly_score,
                "record_data": r.record_data,
            }
            for r in results
        ],
    }
