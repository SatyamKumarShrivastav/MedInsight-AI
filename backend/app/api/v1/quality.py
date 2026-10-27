"""
MedInsight AI — Data Quality Analysis API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.__init_models__ import DataQualityReport, ActivityLog

router = APIRouter(prefix="/quality", tags=["Data Quality"])


def _load_df(ds: Dataset) -> pd.DataFrame:
    if ds.file_format == "csv":
        return pd.read_csv(ds.file_path)
    return pd.read_excel(ds.file_path)


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="quality", resource_id=resource_id, details=details))
    db.commit()


def compute_quality(df: pd.DataFrame) -> dict:
    """Compute comprehensive data quality metrics."""
    total_cells = df.size
    n_rows, n_cols = df.shape

    # Missing values
    missing_per_col = df.isnull().sum()
    total_missing = int(missing_per_col.sum())
    missing_pct = round(total_missing / total_cells * 100, 2) if total_cells > 0 else 0

    # Duplicates
    duplicate_count = int(df.duplicated().sum())

    # Column-level quality
    column_quality = []
    issues = []
    warnings = []

    for col in df.columns:
        series = df[col]
        col_missing = int(series.isnull().sum())
        col_missing_pct = round(col_missing / n_rows * 100, 2) if n_rows > 0 else 0
        col_unique = int(series.nunique())
        is_numeric = pd.api.types.is_numeric_dtype(series)
        is_constant = col_unique <= 1
        is_mostly_empty = col_missing_pct > 80

        col_info = {
            "name": col,
            "dtype": str(series.dtype),
            "null_count": col_missing,
            "null_pct": col_missing_pct,
            "unique_count": col_unique,
            "is_constant": is_constant,
            "is_mostly_empty": is_mostly_empty,
        }

        if is_numeric:
            non_null = series.dropna()
            if len(non_null) > 0:
                col_info["min"] = float(non_null.min())
                col_info["max"] = float(non_null.max())
                col_info["mean"] = float(non_null.mean())
                col_info["std"] = float(non_null.std())
                # IQR outliers
                q1 = float(non_null.quantile(0.25))
                q3 = float(non_null.quantile(0.75))
                iqr = q3 - q1
                outlier_count = int(((non_null < q1 - 1.5 * iqr) | (non_null > q3 + 1.5 * iqr)).sum())
                col_info["outlier_candidates"] = outlier_count

        column_quality.append(col_info)

        # Issues
        if col_missing_pct > 50:
            issues.append(f"Column '{col}' has {col_missing_pct}% missing values.")
        elif col_missing_pct > 20:
            warnings.append(f"Column '{col}' has {col_missing_pct}% missing values.")
        if is_constant:
            issues.append(f"Column '{col}' is constant (all values identical).")
        if is_mostly_empty:
            warnings.append(f"Column '{col}' is mostly empty ({col_missing_pct}%).")

    if duplicate_count > 0:
        warnings.append(f"Found {duplicate_count} duplicate rows.")

    # Quality score: start at 100, deduct per issue
    score = 100.0
    score -= missing_pct * 0.5          # up to 50 pts
    score -= min(duplicate_count / max(n_rows, 1) * 20, 20)  # up to 20 pts
    score -= len(issues) * 5            # 5 pts per critical issue
    score -= len(warnings) * 2         # 2 pts per warning
    score = max(0.0, min(100.0, score))

    recommendations = []
    if missing_pct > 0:
        recommendations.append("Handle missing values via imputation or removal before modeling.")
    if duplicate_count > 0:
        recommendations.append("Remove or investigate duplicate records.")
    for c in column_quality:
        if c["is_constant"]:
            recommendations.append(f"Drop constant column '{c['name']}' — it provides no predictive value.")

    return {
        "n_rows": n_rows,
        "n_cols": n_cols,
        "total_missing": total_missing,
        "missing_pct": missing_pct,
        "duplicate_count": duplicate_count,
        "quality_score": round(score, 1),
        "issues": issues,
        "warnings": warnings,
        "column_quality": column_quality,
        "recommendations": recommendations,
    }


@router.post("/{dataset_id}/run")
def run_quality_analysis(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    try:
        df = _load_df(ds)
        result = compute_quality(df)
    except Exception as e:
        raise HTTPException(500, f"Quality analysis failed: {e}")

    report = DataQualityReport(
        dataset_id=dataset_id,
        quality_score=result["quality_score"],
        missing_pct=result["missing_pct"],
        duplicate_count=result["duplicate_count"],
        total_issues=len(result["issues"]),
        issues_json={"issues": result["issues"], "warnings": result["warnings"]},
        column_quality_json=result["column_quality"],
        recommendations=result["recommendations"],
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    _log(db, current_user.id, "QUALITY_ANALYSIS", report.id, {"dataset_id": dataset_id})
    return {**result, "report_id": report.id}


@router.get("/{dataset_id}/reports")
def list_quality_reports(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    reports = (
        db.query(DataQualityReport)
        .filter(DataQualityReport.dataset_id == dataset_id)
        .order_by(DataQualityReport.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "quality_score": r.quality_score,
            "missing_pct": r.missing_pct,
            "duplicate_count": r.duplicate_count,
            "total_issues": r.total_issues,
            "created_at": r.created_at,
        }
        for r in reports
    ]


@router.get("/report/{report_id}")
def get_quality_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.query(DataQualityReport).filter(DataQualityReport.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")
    ds = db.query(Dataset).filter(Dataset.id == r.dataset_id).first()
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    return {
        "id": r.id,
        "dataset_id": r.dataset_id,
        "quality_score": r.quality_score,
        "missing_pct": r.missing_pct,
        "duplicate_count": r.duplicate_count,
        "total_issues": r.total_issues,
        "issues": r.issues_json,
        "column_quality": r.column_quality_json,
        "recommendations": r.recommendations,
        "created_at": r.created_at,
    }
