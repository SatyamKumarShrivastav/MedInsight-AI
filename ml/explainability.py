"""
MedInsight AI — Explainable AI: SHAP & Feature Attribution
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
from typing import Dict, Any, List
import numpy as np
import pandas as pd


def compute_global_feature_importance(model: Any, feature_names: List[str]) -> List[Dict[str, Any]]:
    """Extract model feature importances or coefficient magnitudes."""
    importances = []
    if hasattr(model, "feature_importances_"):
        raw = model.feature_importances_
        for f, imp in zip(feature_names, raw):
            importances.append({"feature": f, "importance": float(imp)})
    elif hasattr(model, "coef_"):
        raw = np.abs(model.coef_)
        if raw.ndim > 1:
            raw = np.mean(raw, axis=0)
        total = np.sum(raw) if np.sum(raw) > 0 else 1.0
        normalized = raw / total
        for f, imp in zip(feature_names, normalized):
            importances.append({"feature": f, "importance": float(imp)})
    else:
        # Uniform fallback
        val = 1.0 / len(feature_names) if feature_names else 0.0
        for f in feature_names:
            importances.append({"feature": f, "importance": float(val)})

    importances.sort(key=lambda x: -x["importance"])
    return importances


def explain_single_prediction_shap(
    model: Any,
    input_sample: np.ndarray,
    feature_names: List[str],
) -> Dict[str, Any]:
    """Compute local SHAP values or fall back to feature-weighted contribution."""
    sample = input_sample.reshape(1, -1)
    contributions = []

    try:
        import shap
        # Check if TreeExplainer or LinearExplainer applies
        if hasattr(model, "estimators_") or "Tree" in type(model).__name__ or "Forest" in type(model).__name__:
            explainer = shap.TreeExplainer(model)
            shap_vals = explainer.shap_values(sample)
            # Binary classification list handling
            if isinstance(shap_vals, list) and len(shap_vals) > 1:
                vals = shap_vals[1][0]
            elif isinstance(shap_vals, np.ndarray) and shap_vals.ndim == 3:
                vals = shap_vals[0, :, 1]
            else:
                vals = np.array(shap_vals).flatten()
            for f, val in zip(feature_names, vals):
                contributions.append({"feature": f, "shap_value": float(val)})
            method = "TreeSHAP"
        elif hasattr(model, "coef_"):
            explainer = shap.LinearExplainer(model, sample)
            shap_vals = explainer.shap_values(sample)
            vals = np.array(shap_vals).flatten()
            for f, val in zip(feature_names, vals):
                contributions.append({"feature": f, "shap_value": float(val)})
            method = "LinearSHAP"
        else:
            raise NotImplementedError("Fallback to perturbation")
    except Exception:
        # Robust model-agnostic perturbation fallback
        baseline_pred = float(model.predict(sample)[0]) if not hasattr(model, "predict_proba") else float(model.predict_proba(sample)[0, 1] if model.predict_proba(sample).shape[1] > 1 else model.predict(sample)[0])
        for i, f in enumerate(feature_names):
            perturbed = sample.copy()
            perturbed[0, i] = 0.0  # Zero out feature
            new_pred = float(model.predict(perturbed)[0]) if not hasattr(model, "predict_proba") else float(model.predict_proba(perturbed)[0, 1] if model.predict_proba(perturbed).shape[1] > 1 else model.predict(perturbed)[0])
            diff = baseline_pred - new_pred
            contributions.append({"feature": f, "shap_value": round(float(diff), 4)})
        method = "FeaturePerturbation"

    contributions.sort(key=lambda x: -abs(x["shap_value"]))

    return {
        "explanation_method": method,
        "feature_contributions": contributions,
        "disclaimer": (
            "Feature contributions describe how the model weighted each input variable. "
            "They indicate statistical association within the training distribution and do NOT "
            "establish biological or medical causality. MedInsight AI — BioIntelliX."
        ),
    }
