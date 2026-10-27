"""
MedInsight AI — Unit Tests: Data Quality Engine & Preprocessing
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import pytest
import numpy as np
import pandas as pd
from app.api.v1.quality import compute_quality


def test_data_quality_missing_and_duplicates():
    df = pd.DataFrame({
        "patient_id": [1, 2, 3, 3, 4],
        "systolic_bp": [120, np.nan, 140, 140, 130],
        "glucose": [90, 105, np.nan, np.nan, 110],
    })
    report = compute_quality(df)
    assert "quality_score" in report
    assert "missing_pct" in report
    assert "duplicate_count" in report
    assert "issues" in report
    assert "recommendations" in report
    assert report["duplicate_count"] == 1
    assert report["missing_pct"] > 0
    assert 0.0 <= report["quality_score"] <= 100.0


def test_data_quality_clean_dataset():
    df = pd.DataFrame({
        "feature_a": [1.0, 2.0, 3.0, 4.0, 5.0],
        "feature_b": [10, 20, 30, 40, 50],
    })
    report = compute_quality(df)
    assert report["duplicate_count"] == 0
    assert report["missing_pct"] == 0.0
    assert report["quality_score"] >= 90.0
