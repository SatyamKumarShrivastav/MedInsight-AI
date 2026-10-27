"""
MedInsight AI — ML Training & Evaluation API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import os, joblib, time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime

from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, mean_absolute_error, mean_squared_error, r2_score
)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier, LGBMRegressor
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.__init_models__ import (
    Experiment, MLModel, ModelMetric, JobStatus, TaskType, ActivityLog
)

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


CLASSIFICATION_MODELS = {
    "logistic_regression": lambda hp: LogisticRegression(max_iter=1000, **hp),
    "decision_tree": lambda hp: DecisionTreeClassifier(**hp),
    "random_forest": lambda hp: RandomForestClassifier(**hp),
    "svm": lambda hp: SVC(probability=True, **hp),
    "knn": lambda hp: KNeighborsClassifier(**hp),
}
REGRESSION_MODELS = {
    "linear_regression": lambda hp: LinearRegression(),
    "random_forest_regressor": lambda hp: RandomForestRegressor(**hp),
    "gradient_boosting": lambda hp: GradientBoostingRegressor(**hp),
}
if HAS_XGB:
    CLASSIFICATION_MODELS["xgboost"] = lambda hp: XGBClassifier(use_label_encoder=False, eval_metric="logloss", **hp)
    REGRESSION_MODELS["xgboost_regressor"] = lambda hp: XGBRegressor(**hp)
if HAS_LGB:
    CLASSIFICATION_MODELS["lightgbm"] = lambda hp: LGBMClassifier(**hp)
    REGRESSION_MODELS["lightgbm_regressor"] = lambda hp: LGBMRegressor(**hp)


class TrainRequest(BaseModel):
    experiment_name: str
    description: Optional[str] = ""
    dataset_id: int
    target_column: str
    feature_columns: Optional[List[str]] = None
    algorithm: str
    task_type: str = "CLASSIFICATION"
    hyperparams: Optional[Dict[str, Any]] = {}
    test_size: float = 0.2
    random_state: int = 42
    cross_validate: bool = False


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="ml",
                       resource_id=resource_id, details=details))
    db.commit()


def _prepare_data(df: pd.DataFrame, target: str, features: Optional[List[str]], task_type: str):
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not found")
    if features:
        features = [f for f in features if f in df.columns and f != target]
    else:
        features = [c for c in df.columns if c != target]

    X = df[features].copy()
    y = df[target].copy()

    # Encode categoricals in X
    encoders = {}
    for col in X.select_dtypes(include=["object", "category"]).columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        encoders[col] = le

    # Impute
    imp = SimpleImputer(strategy="mean")
    X_arr = imp.fit_transform(X)
    X = pd.DataFrame(X_arr, columns=features)

    # Encode target for classification
    target_encoder = None
    if task_type == "CLASSIFICATION" and not pd.api.types.is_numeric_dtype(y):
        target_encoder = LabelEncoder()
        y = target_encoder.fit_transform(y.astype(str))

    return X, y, features, target_encoder


@router.post("/train")
def train_model(
    req: TrainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    task_type = req.task_type.upper()
    algo = req.algorithm.lower()

    if task_type == "CLASSIFICATION":
        if algo not in CLASSIFICATION_MODELS:
            raise HTTPException(400, f"Unknown classification algorithm: {algo}. Available: {list(CLASSIFICATION_MODELS.keys())}")
    else:
        if algo not in REGRESSION_MODELS:
            raise HTTPException(400, f"Unknown regression algorithm: {algo}. Available: {list(REGRESSION_MODELS.keys())}")

    # Create experiment
    exp = Experiment(
        name=req.experiment_name[:255],
        description=req.description[:1000] if req.description else None,
        dataset_id=req.dataset_id,
        user_id=current_user.id,
        task_type=TaskType.CLASSIFICATION if task_type == "CLASSIFICATION" else TaskType.REGRESSION,
        target_column=req.target_column,
        feature_columns=req.feature_columns,
        status=JobStatus.RUNNING,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    ml_model_rec = MLModel(
        experiment_id=exp.id,
        algorithm=algo,
        hyperparams_json=req.hyperparams or {},
        status=JobStatus.RUNNING,
    )
    db.add(ml_model_rec)
    db.commit()
    db.refresh(ml_model_rec)

    try:
        if ds.file_format == "csv":
            df = pd.read_csv(ds.file_path)
        else:
            df = pd.read_excel(ds.file_path)

        X, y, feature_names, target_enc = _prepare_data(df, req.target_column, req.feature_columns, task_type)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=req.test_size, random_state=req.random_state,
            stratify=y if task_type == "CLASSIFICATION" else None
        )

        hp = req.hyperparams or {}
        t0 = time.time()

        if task_type == "CLASSIFICATION":
            model = CLASSIFICATION_MODELS[algo](hp)
        else:
            model = REGRESSION_MODELS[algo](hp)

        model.fit(X_train, y_train)
        duration = time.time() - t0

        # Evaluate
        metrics = {}
        y_pred = model.predict(X_test)

        if task_type == "CLASSIFICATION":
            metrics["accuracy"] = float(accuracy_score(y_test, y_pred))
            avg = "binary" if len(np.unique(y)) == 2 else "weighted"
            metrics["precision"] = float(precision_score(y_test, y_pred, average=avg, zero_division=0))
            metrics["recall"] = float(recall_score(y_test, y_pred, average=avg, zero_division=0))
            metrics["f1_score"] = float(f1_score(y_test, y_pred, average=avg, zero_division=0))
            try:
                if hasattr(model, "predict_proba"):
                    y_prob = model.predict_proba(X_test)
                    if len(np.unique(y)) == 2:
                        metrics["roc_auc"] = float(roc_auc_score(y_test, y_prob[:, 1]))
                    else:
                        metrics["roc_auc"] = float(roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted"))
            except Exception:
                pass
            cm = confusion_matrix(y_test, y_pred).tolist()
            metrics["confusion_matrix"] = cm
            metrics["class_labels"] = [int(c) for c in model.classes_] if hasattr(model, "classes_") else []
        else:
            metrics["mae"] = float(mean_absolute_error(y_test, y_pred))
            metrics["mse"] = float(mean_squared_error(y_test, y_pred))
            metrics["rmse"] = float(np.sqrt(metrics["mse"]))
            metrics["r2"] = float(r2_score(y_test, y_pred))

        if req.cross_validate:
            scoring = "accuracy" if task_type == "CLASSIFICATION" else "r2"
            cv_scores = cross_val_score(model, X, y, cv=5, scoring=scoring)
            metrics["cv_scores"] = cv_scores.tolist()
            metrics["cv_mean"] = float(cv_scores.mean())
            metrics["cv_std"] = float(cv_scores.std())

        # Feature importance
        feat_importance = {}
        if hasattr(model, "feature_importances_"):
            feat_importance = {f: float(v) for f, v in zip(feature_names, model.feature_importances_)}
        elif hasattr(model, "coef_"):
            coef = model.coef_
            if len(coef.shape) > 1:
                coef = np.abs(coef).mean(axis=0)
            feat_importance = {f: float(abs(v)) for f, v in zip(feature_names, coef.flatten())}

        # Save model artifact
        artifact = {
            "model": model,
            "feature_names": feature_names,
            "target_column": req.target_column,
            "task_type": task_type,
            "target_encoder": target_enc,
            "algorithm": algo,
        }
        artifact_name = f"model_{ml_model_rec.id}.joblib"
        artifact_path = os.path.join(settings.ARTIFACT_DIR, artifact_name)
        joblib.dump(artifact, artifact_path)

        # Update DB records
        ml_model_rec.artifact_path = artifact_path
        ml_model_rec.feature_names = feature_names
        ml_model_rec.status = JobStatus.COMPLETED
        ml_model_rec.training_duration_sec = round(duration, 2)
        db.commit()

        # Save individual metrics
        for name, value in metrics.items():
            if isinstance(value, (int, float)):
                db.add(ModelMetric(model_id=ml_model_rec.id, metric_name=name, metric_value=value))
            elif isinstance(value, list):
                db.add(ModelMetric(model_id=ml_model_rec.id, metric_name=name, metric_json={"data": value}))
        db.commit()

        exp.status = JobStatus.COMPLETED
        db.commit()
        _log(db, current_user.id, "MODEL_TRAINED", ml_model_rec.id, {"algorithm": algo, "dataset_id": req.dataset_id})

        return {
            "experiment_id": exp.id,
            "model_id": ml_model_rec.id,
            "algorithm": algo,
            "task_type": task_type,
            "metrics": metrics,
            "feature_importance": dict(sorted(feat_importance.items(), key=lambda x: -x[1])[:20]),
            "training_duration_sec": round(duration, 2),
            "n_train": len(X_train),
            "n_test": len(X_test),
            "feature_names": feature_names,
        }

    except Exception as e:
        ml_model_rec.status = JobStatus.FAILED
        exp.status = JobStatus.FAILED
        db.commit()
        raise HTTPException(500, f"Training failed: {e}")


@router.get("/experiments")
def list_experiments(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Experiment)
    if current_user.role.value != "ADMIN":
        q = q.filter(Experiment.user_id == current_user.id)
    exps = q.order_by(Experiment.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": e.id, "name": e.name, "description": e.description,
            "dataset_id": e.dataset_id, "task_type": e.task_type,
            "target_column": e.target_column, "status": e.status,
            "created_at": e.created_at,
            "model_count": len(e.models),
        }
        for e in exps
    ]


@router.get("/experiments/{experiment_id}")
def get_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(404, "Experiment not found")
    if current_user.role.value != "ADMIN" and exp.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    models_data = []
    for m in exp.models:
        m_metrics = {met.metric_name: (met.metric_value if met.metric_value is not None else met.metric_json) for met in m.metrics}
        models_data.append({
            "id": m.id, "algorithm": m.algorithm,
            "hyperparams": m.hyperparams_json, "status": m.status,
            "training_duration_sec": m.training_duration_sec,
            "feature_names": m.feature_names, "metrics": m_metrics,
            "created_at": m.created_at,
        })
    return {
        "id": exp.id, "name": exp.name, "description": exp.description,
        "dataset_id": exp.dataset_id, "task_type": exp.task_type,
        "target_column": exp.target_column, "feature_columns": exp.feature_columns,
        "status": exp.status, "created_at": exp.created_at, "models": models_data,
    }


@router.get("/models/{model_id}")
def get_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not m:
        raise HTTPException(404, "Model not found")
    exp = m.experiment
    if current_user.role.value != "ADMIN" and exp.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    m_metrics = {met.metric_name: (met.metric_value if met.metric_value is not None else met.metric_json) for met in m.metrics}
    return {
        "id": m.id, "experiment_id": m.experiment_id,
        "algorithm": m.algorithm, "hyperparams": m.hyperparams_json,
        "status": m.status, "training_duration_sec": m.training_duration_sec,
        "feature_names": m.feature_names, "metrics": m_metrics,
        "created_at": m.created_at,
    }


@router.get("/models")
def list_models(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(MLModel).join(Experiment)
    if current_user.role.value != "ADMIN":
        q = q.filter(Experiment.user_id == current_user.id)
    models = q.filter(MLModel.status == JobStatus.COMPLETED).order_by(MLModel.created_at.desc()).offset(skip).limit(limit).all()
    results = []
    for m in models:
        m_metrics = {met.metric_name: met.metric_value for met in m.metrics if met.metric_value is not None}
        results.append({
            "id": m.id, "experiment_id": m.experiment_id,
            "experiment_name": m.experiment.name,
            "algorithm": m.algorithm, "status": m.status,
            "training_duration_sec": m.training_duration_sec,
            "metrics": m_metrics, "created_at": m.created_at,
            "task_type": m.experiment.task_type,
            "target_column": m.experiment.target_column,
        })
    return results


@router.get("/available-algorithms")
def available_algorithms():
    return {
        "classification": list(CLASSIFICATION_MODELS.keys()),
        "regression": list(REGRESSION_MODELS.keys()),
    }
