"""
MedInsight AI — Explainable AI (SHAP) API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import joblib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.__init_models__ import MLModel, Prediction, PredictionExplanation, JobStatus, Experiment, ActivityLog

router = APIRouter(prefix="/xai", tags=["Explainable AI"])


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="xai",
                       resource_id=resource_id, details=details))
    db.commit()


class ExplainRequest(BaseModel):
    model_id: int
    input_data: Optional[Dict[str, Any]] = None  # for local explanation
    prediction_id: Optional[int] = None           # use saved prediction's input
    max_display: int = 15


@router.post("/explain")
def explain(
    req: ExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = db.query(MLModel).filter(MLModel.id == req.model_id).first()
    if not m:
        raise HTTPException(404, "Model not found")
    if m.status != JobStatus.COMPLETED or not m.artifact_path:
        raise HTTPException(400, "Model not ready")
    exp = m.experiment
    if current_user.role.value != "ADMIN" and exp.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    # Resolve input
    if req.prediction_id:
        pred = db.query(Prediction).filter(Prediction.id == req.prediction_id).first()
        if not pred:
            raise HTTPException(404, "Prediction not found")
        input_data = pred.input_json
    elif req.input_data:
        input_data = req.input_data
    else:
        raise HTTPException(400, "Provide input_data or prediction_id")

    try:
        artifact = joblib.load(m.artifact_path)
        model = artifact["model"]
        feature_names = artifact["feature_names"]
        task_type = artifact.get("task_type", "CLASSIFICATION")
    except Exception as e:
        raise HTTPException(500, f"Failed to load model: {e}")

    # Build input df
    try:
        row = {f: input_data.get(f, 0) for f in feature_names}
        input_df = pd.DataFrame([row])
    except Exception as e:
        raise HTTPException(400, f"Input preparation failed: {e}")

    # Try SHAP
    shap_available = False
    shap_values_list = []
    base_value = None
    explanation_method = "feature_importance_fallback"

    try:
        import shap
        shap_available = True

        model_type = type(model).__name__.lower()

        if any(t in model_type for t in ["forest", "tree", "xgb", "lgbm", "gradient"]):
            explainer = shap.TreeExplainer(model)
            sv = explainer.shap_values(input_df)
            base_value = float(explainer.expected_value[0]) if isinstance(explainer.expected_value, (list, np.ndarray)) else float(explainer.expected_value)
        elif "linear" in model_type or "logistic" in model_type:
            explainer = shap.LinearExplainer(model, input_df)
            sv = explainer.shap_values(input_df)
            base_value = 0.0
        else:
            # KernelExplainer — slow but universal
            def predict_fn(X):
                if task_type == "CLASSIFICATION" and hasattr(model, "predict_proba"):
                    return model.predict_proba(pd.DataFrame(X, columns=feature_names))[:, 1]
                return model.predict(pd.DataFrame(X, columns=feature_names))
            explainer = shap.KernelExplainer(predict_fn, input_df)
            sv = explainer.shap_values(input_df, nsamples=50)
            base_value = float(explainer.expected_value)

        if isinstance(sv, list):
            sv_arr = np.array(sv[1]) if len(sv) > 1 else np.array(sv[0])
        else:
            sv_arr = np.array(sv)

        if sv_arr.ndim == 2:
            sv_arr = sv_arr[0]

        shap_values_list = [
            {"feature": f, "shap_value": float(v)}
            for f, v in zip(feature_names, sv_arr)
        ]
        shap_values_list.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        explanation_method = "SHAP"

    except Exception as shap_err:
        # Fallback: model feature importance
        explanation_method = f"feature_importance_fallback (SHAP error: {str(shap_err)[:100]})"
        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
            shap_values_list = [
                {"feature": f, "shap_value": float(v)}
                for f, v in sorted(zip(feature_names, fi), key=lambda x: -x[1])
            ]
        elif hasattr(model, "coef_"):
            coef = model.coef_
            if len(coef.shape) > 1:
                coef = coef.mean(axis=0)
            shap_values_list = [
                {"feature": f, "shap_value": float(v)}
                for f, v in sorted(zip(feature_names, coef.flatten()), key=lambda x: -abs(x[1]))
            ]

    top_features = shap_values_list[:req.max_display]

    # Save explanation if prediction_id provided
    if req.prediction_id:
        existing = db.query(PredictionExplanation).filter(PredictionExplanation.prediction_id == req.prediction_id).first()
        if not existing:
            expl_rec = PredictionExplanation(
                prediction_id=req.prediction_id,
                method=explanation_method,
                shap_values_json=top_features,
                base_value=base_value,
            )
            db.add(expl_rec)
            db.commit()

    _log(db, current_user.id, "XAI_EXPLAIN", req.model_id, {"method": explanation_method})

    return {
        "model_id": req.model_id,
        "explanation_method": explanation_method,
        "base_value": base_value,
        "feature_contributions": top_features,
        "input_data": input_data,
        "disclaimer": (
            "Feature contributions describe how this model generates its output for this input. "
            "They do not establish biological causation or clinical significance. "
            "— MedInsight AI, BioIntelliX"
        ),
    }


@router.get("/global/{model_id}")
def global_importance(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return global feature importance for a trained model."""
    m = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not m:
        raise HTTPException(404, "Model not found")
    exp = m.experiment
    if current_user.role.value != "ADMIN" and exp.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    if not m.artifact_path:
        raise HTTPException(400, "No artifact found")

    try:
        artifact = joblib.load(m.artifact_path)
        model = artifact["model"]
        feature_names = artifact["feature_names"]
    except Exception as e:
        raise HTTPException(500, f"Load failed: {e}")

    importance = []
    if hasattr(model, "feature_importances_"):
        importance = [
            {"feature": f, "importance": float(v)}
            for f, v in sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1])
        ]
    elif hasattr(model, "coef_"):
        coef = model.coef_
        if len(coef.shape) > 1:
            coef = np.abs(coef).mean(axis=0)
        importance = [
            {"feature": f, "importance": float(abs(v))}
            for f, v in sorted(zip(feature_names, coef.flatten()), key=lambda x: -x[1])
        ]

    return {
        "model_id": model_id,
        "algorithm": m.algorithm,
        "feature_importance": importance,
        "note": "Global feature importance. Does not imply biological causation.",
    }
