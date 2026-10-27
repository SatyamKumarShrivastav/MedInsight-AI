"""
MedInsight AI — Machine Learning Package
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from .trainer import build_estimator, train_and_evaluate_pipeline
from .evaluator import evaluate_classification, evaluate_regression
from .explainability import compute_global_feature_importance, explain_single_prediction_shap

__all__ = [
    "build_estimator",
    "train_and_evaluate_pipeline",
    "evaluate_classification",
    "evaluate_regression",
    "compute_global_feature_importance",
    "explain_single_prediction_shap",
]
