"""
MedInsight AI — Predictions API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import joblib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.__init_models__ import MLModel, Experiment, Prediction, JobStatus, ActivityLog

router = APIRouter(prefix="/predictions", tags=["Predictions"])


class PredictionRequest(BaseModel):
    model_id: int
    input_data: Dict[str, Any]


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="prediction",
                       resource_id=resource_id, details=details))
    db.commit()


@router.post("/predict")
def predict(
    req: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = db.query(MLModel).filter(MLModel.id == req.model_id).first()
    if not m:
        raise HTTPException(404, "Model not found")
    if m.status != JobStatus.COMPLETED:
        raise HTTPException(400, "Model is not ready (not trained successfully)")
    if not m.artifact_path:
        raise HTTPException(400, "Model artifact not found")

    exp = m.experiment
    if current_user.role.value != "ADMIN" and exp.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    try:
        artifact = joblib.load(m.artifact_path)
        model = artifact["model"]
        feature_names = artifact["feature_names"]
        task_type = artifact.get("task_type", "CLASSIFICATION")
        target_encoder = artifact.get("target_encoder")
    except Exception as e:
        raise HTTPException(500, f"Failed to load model artifact: {e}")

    # Build input dataframe
    missing_features = [f for f in feature_names if f not in req.input_data]
    if missing_features:
        raise HTTPException(400, f"Missing input features: {missing_features}")

    try:
        input_df = pd.DataFrame([{f: req.input_data[f] for f in feature_names}])
        y_pred = model.predict(input_df)

        output = {}
        if task_type == "CLASSIFICATION":
            pred_class = int(y_pred[0]) if pd.api.types.is_integer_dtype(type(y_pred[0])) else y_pred[0]
            if target_encoder and hasattr(target_encoder, "classes_"):
                try:
                    pred_class_label = str(target_encoder.classes_[pred_class])
                except Exception:
                    pred_class_label = str(pred_class)
            else:
                pred_class_label = str(pred_class)

            output["predicted_class"] = pred_class_label
            output["predicted_class_raw"] = pred_class

            if hasattr(model, "predict_proba"):
                proba = model.predict_proba(input_df)[0]
                if target_encoder and hasattr(target_encoder, "classes_"):
                    output["probabilities"] = {str(target_encoder.classes_[i]): float(p) for i, p in enumerate(proba)}
                else:
                    output["probabilities"] = {str(i): float(p) for i, p in enumerate(proba)}
        else:
            output["predicted_value"] = float(y_pred[0])

        output["model_note"] = (
            "This is a model-generated research estimate. It is not a medical diagnosis, "
            "clinical finding, or healthcare recommendation. — MedInsight AI, BioIntelliX"
        )

        # Save prediction record
        pred_record = Prediction(
            model_id=req.model_id,
            user_id=current_user.id,
            input_json=req.input_data,
            output_json=output,
        )
        db.add(pred_record)
        db.commit()
        db.refresh(pred_record)
        _log(db, current_user.id, "PREDICTION_MADE", pred_record.id, {"model_id": req.model_id})

        return {
            "prediction_id": pred_record.id,
            "model_id": req.model_id,
            "algorithm": m.algorithm,
            "task_type": task_type,
            "input_summary": req.input_data,
            "output": output,
            "timestamp": pred_record.created_at,
        }

    except Exception as e:
        raise HTTPException(500, f"Prediction failed: {e}")


@router.get("/history")
def prediction_history(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    preds = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .offset(skip).limit(limit).all()
    )
    return [
        {
            "id": p.id, "model_id": p.model_id,
            "output": p.output_json, "created_at": p.created_at,
        }
        for p in preds
    ]


@router.get("/{prediction_id}")
def get_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not p:
        raise HTTPException(404, "Prediction not found")
    if current_user.role.value != "ADMIN" and p.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    return {
        "id": p.id, "model_id": p.model_id,
        "input": p.input_json, "output": p.output_json,
        "created_at": p.created_at,
    }
