"""
MedInsight AI — Unit Tests: Machine Learning Training, Evaluation & SHAP XAI
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import pytest
import numpy as np
import pandas as pd
from ml.trainer import build_estimator, train_and_evaluate_pipeline
from ml.evaluator import evaluate_classification, evaluate_regression
from ml.explainability import compute_global_feature_importance, explain_single_prediction_shap


def test_estimator_instantiation():
    rf = build_estimator("random_forest", task_type="classification")
    assert rf is not None
    lr = build_estimator("logistic_regression", task_type="classification")
    assert lr is not None
    reg = build_estimator("linear_regression", task_type="regression")
    assert reg is not None


def test_pipeline_training_and_cross_validation(sample_heart_df):
    feature_cols = ["age", "sex", "cp", "trestbps", "chol", "fbs"]
    res = train_and_evaluate_pipeline(
        df=sample_heart_df,
        target_column="target",
        feature_columns=feature_cols,
        algorithm="random_forest",
        task_type="classification",
    )
    assert res["model"] is not None
    assert len(res["cv_scores"]) > 0
    assert 0.0 <= res["cv_mean"] <= 1.0
    assert len(res["y_pred"]) == len(res["y_test"])
    assert res["training_duration_sec"] > 0


def test_classification_metrics_calculation():
    y_true = np.array([0, 1, 0, 1, 1, 0, 1, 0])
    y_pred = np.array([0, 1, 0, 1, 0, 0, 1, 1])
    metrics = evaluate_classification(y_true, y_pred)
    assert "accuracy" in metrics
    assert "f1" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "confusion_matrix" in metrics
    assert 0.0 <= metrics["accuracy"] <= 1.0


def test_regression_metrics_calculation():
    y_true = np.array([120.0, 140.0, 115.0, 150.0])
    y_pred = np.array([122.0, 138.0, 118.0, 147.0])
    metrics = evaluate_regression(y_true, y_pred)
    assert "mae" in metrics
    assert "rmse" in metrics
    assert "r2" in metrics
    assert metrics["mae"] >= 0


def test_global_feature_importance(sample_heart_df):
    feature_cols = ["age", "sex", "cp", "trestbps", "chol", "fbs"]
    res = train_and_evaluate_pipeline(
        df=sample_heart_df,
        target_column="target",
        feature_columns=feature_cols,
        algorithm="random_forest",
        task_type="classification",
    )
    importances = compute_global_feature_importance(res["model"], feature_cols)
    assert len(importances) == len(feature_cols)
    assert all("feature" in item and "importance" in item for item in importances)
    assert sum(item["importance"] for item in importances) > 0


def test_shap_single_prediction_explanation(sample_heart_df):
    feature_cols = ["age", "sex", "cp", "trestbps", "chol", "fbs"]
    res = train_and_evaluate_pipeline(
        df=sample_heart_df,
        target_column="target",
        feature_columns=feature_cols,
        algorithm="random_forest",
        task_type="classification",
    )
    test_sample = res["X_test"][0]
    explanation = explain_single_prediction_shap(res["model"], test_sample, feature_cols)
    assert "explanation_method" in explanation
    assert "feature_contributions" in explanation
    assert len(explanation["feature_contributions"]) == len(feature_cols)
    assert "disclaimer" in explanation
    assert "BioIntelliX" in explanation["disclaimer"]
