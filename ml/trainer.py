"""
MedInsight AI — Machine Learning Model Training Orchestrator
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
from typing import Dict, Any, Tuple, Optional
import time
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
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


def build_estimator(algorithm: str, task_type: str = "classification", hyperparams: Optional[Dict[str, Any]] = None):
    """Instantiate a supported scikit-learn, XGBoost, or LightGBM model."""
    hp = hyperparams or {}
    algo = algorithm.lower().strip()

    if task_type.lower() == "classification":
        if algo == "logistic_regression":
            return LogisticRegression(max_iter=hp.get("max_iter", 1000), C=hp.get("C", 1.0), random_state=42)
        elif algo == "decision_tree":
            return DecisionTreeClassifier(max_depth=hp.get("max_depth", 6), min_samples_split=hp.get("min_samples_split", 5), random_state=42)
        elif algo == "random_forest":
            return RandomForestClassifier(n_estimators=hp.get("n_estimators", 100), max_depth=hp.get("max_depth", 8), random_state=42)
        elif algo == "svm":
            return SVC(C=hp.get("C", 1.0), kernel=hp.get("kernel", "rbf"), probability=True, random_state=42)
        elif algo == "knn":
            return KNeighborsClassifier(n_neighbors=hp.get("n_neighbors", 5))
        elif algo == "xgboost" and HAS_XGB:
            return XGBClassifier(n_estimators=hp.get("n_estimators", 100), max_depth=hp.get("max_depth", 6), learning_rate=hp.get("learning_rate", 0.1), eval_metric="logloss", random_state=42)
        elif algo == "lightgbm" and HAS_LGB:
            return LGBMClassifier(n_estimators=hp.get("n_estimators", 100), max_depth=hp.get("max_depth", 6), random_state=42, verbose=-1)
        else:
            return RandomForestClassifier(n_estimators=100, random_state=42)
    else:
        if algo == "linear_regression":
            return LinearRegression()
        elif algo == "random_forest_regressor":
            return RandomForestRegressor(n_estimators=hp.get("n_estimators", 100), max_depth=hp.get("max_depth", 8), random_state=42)
        elif algo == "gradient_boosting":
            return GradientBoostingRegressor(n_estimators=hp.get("n_estimators", 100), random_state=42)
        elif algo == "xgboost_regressor" and HAS_XGB:
            return XGBRegressor(n_estimators=hp.get("n_estimators", 100), random_state=42)
        elif algo == "lightgbm_regressor" and HAS_LGB:
            return LGBMRegressor(n_estimators=hp.get("n_estimators", 100), random_state=42, verbose=-1)
        else:
            return RandomForestRegressor(n_estimators=100, random_state=42)


def train_and_evaluate_pipeline(
    df: pd.DataFrame,
    target_column: str,
    feature_columns: list,
    algorithm: str,
    task_type: str = "classification",
    test_size: float = 0.2,
    hyperparams: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Execute clean end-to-end model training without data leakage."""
    start_time = time.time()
    sub_df = df[feature_columns + [target_column]].dropna(subset=[target_column])
    X = sub_df[feature_columns]
    y = sub_df[target_column]

    # Preprocessing pipelines: separate numeric and categorical
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = [c for c in feature_columns if c not in num_cols]

    # Encode categorical features if present
    X_processed = X.copy()
    label_encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        X_processed[col] = le.fit_transform(X_processed[col].astype(str))
        label_encoders[col] = le

    # Impute missing values
    imputer = SimpleImputer(strategy="median" if num_cols else "most_frequent")
    X_imputed = pd.DataFrame(imputer.fit_transform(X_processed), columns=feature_columns)

    # Train / Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_imputed, y, test_size=test_size, random_state=42,
        stratify=y if task_type == "classification" and len(np.unique(y)) < 10 else None,
    )

    # Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Model training
    model = build_estimator(algorithm, task_type=task_type, hyperparams=hyperparams)
    model.fit(X_train_scaled, y_train)
    duration = time.time() - start_time

    # Cross-validation score (5-fold)
    cv_scores = cross_val_score(
        model, X_train_scaled, y_train, cv=min(5, len(X_train)),
        scoring="accuracy" if task_type == "classification" else "r2",
    )

    y_pred = model.predict(X_test_scaled)
    y_prob = None
    if task_type == "classification" and hasattr(model, "predict_proba"):
        try:
            y_prob = model.predict_proba(X_test_scaled)
        except Exception:
            pass

    return {
        "model": model,
        "scaler": scaler,
        "imputer": imputer,
        "label_encoders": label_encoders,
        "feature_names": feature_columns,
        "target_column": target_column,
        "task_type": task_type,
        "algorithm": algorithm,
        "X_train": X_train_scaled,
        "X_test": X_test_scaled,
        "y_train": y_train,
        "y_test": y_test,
        "y_pred": y_pred,
        "y_prob": y_prob,
        "cv_scores": cv_scores.tolist(),
        "cv_mean": float(np.mean(cv_scores)),
        "training_duration_sec": round(duration, 3),
    }
