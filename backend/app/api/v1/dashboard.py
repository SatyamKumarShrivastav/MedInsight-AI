"""
MedInsight AI — Dashboard API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.__init_models__ import (
    Experiment, MLModel, Prediction, Report, ActivityLog,
    JobStatus, AnomalyJob, SignalAnalysisJob, ResearchDocument
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return dashboard summary metrics derived from actual DB records."""
    is_admin = current_user.role.value == "ADMIN"

    def user_filter(q, model, col="user_id"):
        if is_admin:
            return q
        return q.filter(getattr(model, col) == current_user.id)

    def owner_filter(q, model):
        if is_admin:
            return q
        return q.filter(model.owner_id == current_user.id)

    # Datasets
    n_datasets = owner_filter(db.query(Dataset), Dataset).count()
    n_ready_datasets = owner_filter(db.query(Dataset), Dataset).filter(Dataset.status == "READY").count()

    # Experiments
    n_experiments = user_filter(db.query(Experiment), Experiment).count()
    n_models = (
        db.query(MLModel).join(Experiment)
        .filter(MLModel.status == JobStatus.COMPLETED)
        if is_admin else
        db.query(MLModel).join(Experiment).filter(Experiment.user_id == current_user.id, MLModel.status == JobStatus.COMPLETED)
    ).count()

    # Predictions
    n_predictions = user_filter(db.query(Prediction), Prediction).count()

    # Reports
    n_reports = user_filter(db.query(Report), Report).count()

    # Anomaly jobs
    n_anomaly = (
        db.query(AnomalyJob).join(Dataset)
        if is_admin else
        db.query(AnomalyJob).join(Dataset).filter(Dataset.owner_id == current_user.id)
    ).count()

    # Signal jobs
    n_signals = db.query(SignalAnalysisJob).count() if is_admin else 0

    # Research docs
    n_docs = owner_filter(db.query(ResearchDocument), ResearchDocument).count()

    # Recent activity
    recent_logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )

    # Recent experiments
    recent_exps_q = db.query(Experiment)
    if not is_admin:
        recent_exps_q = recent_exps_q.filter(Experiment.user_id == current_user.id)
    recent_exps = recent_exps_q.order_by(Experiment.created_at.desc()).limit(5).all()

    # Recent predictions
    recent_preds = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(5)
        .all()
    )

    # Dataset format distribution
    ds_query = owner_filter(db.query(Dataset.file_format, func.count(Dataset.id).label("cnt")).group_by(Dataset.file_format), Dataset)
    format_dist = [{"format": r.file_format, "count": r.cnt} for r in ds_query.all()]

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role.value,
            "full_name": current_user.full_name,
        },
        "stats": {
            "datasets": n_datasets,
            "ready_datasets": n_ready_datasets,
            "experiments": n_experiments,
            "trained_models": n_models,
            "predictions": n_predictions,
            "reports": n_reports,
            "anomaly_jobs": n_anomaly,
            "signal_jobs": n_signals,
            "research_documents": n_docs,
        },
        "recent_experiments": [
            {
                "id": e.id, "name": e.name, "status": e.status,
                "task_type": e.task_type, "created_at": e.created_at,
            }
            for e in recent_exps
        ],
        "recent_predictions": [
            {"id": p.id, "model_id": p.model_id, "created_at": p.created_at}
            for p in recent_preds
        ],
        "dataset_format_distribution": format_dist,
        "recent_activity": [
            {
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "created_at": log.created_at,
            }
            for log in recent_logs
        ],
    }
