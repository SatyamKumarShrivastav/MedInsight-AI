"""
MedInsight AI — Exploratory Data Analysis API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import pandas as pd
import numpy as np

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset

router = APIRouter(prefix="/eda", tags=["Exploratory Data Analysis"])


def _load_df(ds: Dataset) -> pd.DataFrame:
    if ds.file_format == "csv":
        return pd.read_csv(ds.file_path)
    return pd.read_excel(ds.file_path)


def _auth_dataset(dataset_id: int, current_user: User, db: Session) -> Dataset:
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    return ds


@router.get("/{dataset_id}/summary")
def summary(dataset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)
    desc = df.describe(include="all").fillna("").to_dict()
    num_stats = {}
    for col in df.select_dtypes(include=[np.number]).columns:
        s = df[col].dropna()
        num_stats[col] = {
            "count": int(s.count()),
            "mean": float(s.mean()),
            "std": float(s.std()),
            "min": float(s.min()),
            "q25": float(s.quantile(0.25)),
            "median": float(s.median()),
            "q75": float(s.quantile(0.75)),
            "max": float(s.max()),
            "skewness": float(s.skew()),
            "kurtosis": float(s.kurt()),
            "missing": int(df[col].isnull().sum()),
        }
    cat_stats = {}
    for col in df.select_dtypes(include=["object", "category"]).columns:
        s = df[col].dropna()
        vc = s.value_counts()
        cat_stats[col] = {
            "count": int(s.count()),
            "unique": int(s.nunique()),
            "top": str(vc.index[0]) if len(vc) > 0 else None,
            "top_freq": int(vc.iloc[0]) if len(vc) > 0 else 0,
            "missing": int(df[col].isnull().sum()),
            "top_10": [{"value": str(k), "count": int(v)} for k, v in vc.head(10).items()],
        }
    return {
        "n_rows": len(df),
        "n_cols": len(df.columns),
        "numeric_stats": num_stats,
        "categorical_stats": cat_stats,
        "dtypes": {c: str(t) for c, t in df.dtypes.items()},
    }


@router.get("/{dataset_id}/histogram")
def histogram(
    dataset_id: int,
    column: str,
    bins: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)
    if column not in df.columns:
        raise HTTPException(400, f"Column '{column}' not found")
    series = df[column].dropna()
    if not pd.api.types.is_numeric_dtype(series):
        raise HTTPException(400, "Histogram requires a numeric column")
    counts, edges = np.histogram(series, bins=min(bins, 50))
    return {
        "column": column,
        "bins": [{"x0": float(edges[i]), "x1": float(edges[i+1]), "count": int(counts[i])} for i in range(len(counts))],
        "sample_size": len(series),
    }


@router.get("/{dataset_id}/boxplot")
def boxplot(
    dataset_id: int,
    column: str,
    group_by: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)
    if column not in df.columns:
        raise HTTPException(400, f"Column '{column}' not found")
    if not pd.api.types.is_numeric_dtype(df[column]):
        raise HTTPException(400, "Boxplot requires a numeric column")

    def box_stats(s: pd.Series) -> dict:
        s = s.dropna()
        q1, q2, q3 = float(s.quantile(0.25)), float(s.quantile(0.5)), float(s.quantile(0.75))
        iqr = q3 - q1
        return {
            "min": float(s.min()),
            "q1": q1, "median": q2, "q3": q3, "max": float(s.max()),
            "mean": float(s.mean()),
            "whisker_low": float(max(s.min(), q1 - 1.5*iqr)),
            "whisker_high": float(min(s.max(), q3 + 1.5*iqr)),
            "outliers": s[(s < q1 - 1.5*iqr) | (s > q3 + 1.5*iqr)].tolist()[:50],
            "n": int(len(s)),
        }

    if group_by and group_by in df.columns:
        groups = {str(k): box_stats(v) for k, v in df.groupby(group_by)[column]}
        return {"column": column, "group_by": group_by, "groups": groups}
    return {"column": column, "stats": box_stats(df[column])}


@router.get("/{dataset_id}/scatter")
def scatter(
    dataset_id: int,
    x_col: str,
    y_col: str,
    color_col: Optional[str] = None,
    sample_n: int = 500,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)
    for c in [x_col, y_col]:
        if c not in df.columns:
            raise HTTPException(400, f"Column '{c}' not found")
    sub = df[[x_col, y_col] + ([color_col] if color_col and color_col in df.columns else [])].dropna()
    if len(sub) > sample_n:
        sub = sub.sample(sample_n, random_state=42)
    return {"x_col": x_col, "y_col": y_col, "points": sub.to_dict(orient="records"), "n": len(sub)}


@router.get("/{dataset_id}/correlation")
def correlation(
    dataset_id: int,
    method: str = "pearson",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)
    num_df = df.select_dtypes(include=[np.number])
    if num_df.shape[1] < 2:
        raise HTTPException(400, "At least 2 numeric columns required for correlation")
    corr = num_df.corr(method=method).fillna(0)
    columns = corr.columns.tolist()
    matrix = [[round(float(corr.loc[r, c]), 4) for c in columns] for r in columns]
    return {"columns": columns, "matrix": matrix, "method": method}


@router.get("/{dataset_id}/missing-heatmap")
def missing_heatmap(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)
    missing_counts = df.isnull().sum().to_dict()
    missing_pct = (df.isnull().sum() / len(df) * 100).round(2).to_dict()
    return {
        "columns": list(missing_counts.keys()),
        "missing_counts": list(missing_counts.values()),
        "missing_pct": list(missing_pct.values()),
    }


@router.get("/{dataset_id}/value-counts")
def value_counts(
    dataset_id: int,
    column: str,
    top_n: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)
    if column not in df.columns:
        raise HTTPException(400, f"Column '{column}' not found")
    vc = df[column].value_counts().head(top_n)
    return {
        "column": column,
        "values": [{"label": str(k), "count": int(v)} for k, v in vc.items()],
        "total_unique": int(df[column].nunique()),
    }


@router.get("/{dataset_id}/biomedical-analytics")
def biomedical_analytics(
    dataset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Auto-detect biomedical fields and compute relevant descriptive statistics."""
    ds = _auth_dataset(dataset_id, current_user, db)
    df = _load_df(ds)

    results = {}
    cols_lower = {c.lower(): c for c in df.columns}

    # Age distribution
    for key in ["age", "age_years", "patient_age"]:
        if key in cols_lower:
            col = cols_lower[key]
            s = df[col].dropna()
            if pd.api.types.is_numeric_dtype(s):
                results["age_distribution"] = {
                    "column": col,
                    "mean": float(s.mean()), "std": float(s.std()),
                    "min": float(s.min()), "max": float(s.max()),
                    "bins": np.histogram(s, bins=10)[0].tolist(),
                    "edges": np.histogram(s, bins=10)[1].tolist(),
                }
            break

    # BMI
    for key in ["bmi", "body_mass_index"]:
        if key in cols_lower:
            col = cols_lower[key]
            s = df[col].dropna()
            if pd.api.types.is_numeric_dtype(s):
                results["bmi_distribution"] = {
                    "column": col,
                    "mean": float(s.mean()), "underweight_pct": float((s < 18.5).mean() * 100),
                    "normal_pct": float(((s >= 18.5) & (s < 25)).mean() * 100),
                    "overweight_pct": float(((s >= 25) & (s < 30)).mean() * 100),
                    "obese_pct": float((s >= 30).mean() * 100),
                }
            break

    # Blood pressure
    for key in ["trestbps", "blood_pressure", "bp", "systolic_bp"]:
        if key in cols_lower:
            col = cols_lower[key]
            s = df[col].dropna()
            if pd.api.types.is_numeric_dtype(s):
                results["blood_pressure"] = {
                    "column": col, "mean": float(s.mean()),
                    "normal_pct": float((s < 120).mean() * 100),
                    "elevated_pct": float(((s >= 120) & (s < 130)).mean() * 100),
                    "high_pct": float((s >= 130).mean() * 100),
                }
            break

    # Glucose / blood sugar
    for key in ["glucose", "blood_glucose", "fbs", "glu"]:
        if key in cols_lower:
            col = cols_lower[key]
            s = df[col].dropna()
            if pd.api.types.is_numeric_dtype(s):
                results["glucose"] = {"column": col, "mean": float(s.mean()), "std": float(s.std())}
            break

    # Cholesterol
    for key in ["chol", "cholesterol", "total_cholesterol"]:
        if key in cols_lower:
            col = cols_lower[key]
            s = df[col].dropna()
            if pd.api.types.is_numeric_dtype(s):
                results["cholesterol"] = {"column": col, "mean": float(s.mean()), "std": float(s.std())}
            break

    # Target/disease distribution
    for key in ["target", "disease", "label", "diagnosis", "outcome", "condition"]:
        if key in cols_lower:
            col = cols_lower[key]
            vc = df[col].value_counts()
            results["target_distribution"] = {
                "column": col,
                "values": [{"label": str(k), "count": int(v)} for k, v in vc.items()],
            }
            break

    return {"dataset_id": dataset_id, "analytics": results, "note": "Descriptive statistics only. Not clinical findings."}
