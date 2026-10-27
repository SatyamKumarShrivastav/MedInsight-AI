"""
MedInsight AI — Dataset Management API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import os, hashlib, re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset, DatasetColumn, DatasetStatus
from app.models.__init_models__ import ActivityLog

router = APIRouter(prefix="/datasets", tags=["Datasets"])

ALLOWED_EXTENSIONS = {"csv", "xlsx"}
ALLOWED_MIME = {"text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/octet-stream", "application/csv", "text/plain"}


def _safe_filename(name: str) -> str:
    name = os.path.basename(name)
    name = re.sub(r"[^\w\-_.]", "_", name)
    return name[:200]


def _log(db, user_id, action, resource_type=None, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type=resource_type,
                       resource_id=resource_id, details=details))
    db.commit()


class DatasetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    source: Optional[str]
    file_format: str
    file_size_bytes: Optional[int]
    num_rows: Optional[int]
    num_columns: Optional[int]
    status: str
    version: int
    license_info: Optional[str]
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True


class DatasetColumnResponse(BaseModel):
    id: int
    name: str
    dtype: Optional[str]
    null_count: int
    unique_count: Optional[int]
    min_value: Optional[float]
    max_value: Optional[float]
    mean_value: Optional[float]
    std_value: Optional[float]
    sample_values: Optional[list]

    class Config:
        from_attributes = True


@router.post("/upload", response_model=DatasetResponse, status_code=201)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    source: str = Form(""),
    license_info: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}")

    # Read file content
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE_MB} MB.")

    # Safe filename
    safe_name = _safe_filename(file.filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stored_name = f"{current_user.id}_{timestamp}_{safe_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)

    with open(file_path, "wb") as f:
        f.write(content)

    # Parse dataset
    try:
        if ext == "csv":
            df = pd.read_csv(file_path, nrows=50000)  # cap for safety
        else:
            df = pd.read_excel(file_path, nrows=50000)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=422, detail=f"File could not be parsed: {e}")

    num_rows, num_cols = df.shape
    dataset = Dataset(
        name=name[:255],
        description=description[:1000] if description else None,
        source=source[:500] if source else None,
        file_format=ext,
        file_path=file_path,
        file_size_bytes=len(content),
        num_rows=num_rows,
        num_columns=num_cols,
        license_info=license_info[:500] if license_info else None,
        status=DatasetStatus.READY,
        owner_id=current_user.id,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    # Store column metadata
    for col in df.columns:
        series = df[col]
        col_rec = DatasetColumn(
            dataset_id=dataset.id,
            name=str(col)[:255],
            dtype=str(series.dtype),
            null_count=int(series.isnull().sum()),
            unique_count=int(series.nunique()),
            min_value=float(series.min()) if pd.api.types.is_numeric_dtype(series) else None,
            max_value=float(series.max()) if pd.api.types.is_numeric_dtype(series) else None,
            mean_value=float(series.mean()) if pd.api.types.is_numeric_dtype(series) else None,
            std_value=float(series.std()) if pd.api.types.is_numeric_dtype(series) else None,
            sample_values=series.dropna().head(5).astype(str).tolist(),
        )
        db.add(col_rec)
    db.commit()
    _log(db, current_user.id, "DATASET_UPLOAD", "dataset", dataset.id, {"name": name})
    return dataset


@router.get("/", response_model=List[DatasetResponse])
def list_datasets(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Dataset)
    if current_user.role.value != "ADMIN":
        q = q.filter(Dataset.owner_id == current_user.id)
    return q.order_by(Dataset.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    return ds


@router.get("/{dataset_id}/columns", response_model=List[DatasetColumnResponse])
def get_columns(dataset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    return db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).all()


@router.get("/{dataset_id}/preview")
def preview_dataset(
    dataset_id: int,
    rows: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    try:
        if ds.file_format == "csv":
            df = pd.read_csv(ds.file_path, nrows=min(rows, 200))
        else:
            df = pd.read_excel(ds.file_path, nrows=min(rows, 200))
        return {
            "columns": df.columns.tolist(),
            "rows": df.fillna("").astype(str).values.tolist(),
            "total_rows": ds.num_rows,
            "total_columns": ds.num_columns,
        }
    except Exception as e:
        raise HTTPException(500, f"Preview failed: {e}")


@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    try:
        if os.path.exists(ds.file_path):
            os.remove(ds.file_path)
    except Exception:
        pass
    db.delete(ds)
    db.commit()
    _log(db, current_user.id, "DATASET_DELETE", "dataset", dataset_id)
    return {"message": "Dataset deleted"}


@router.put("/{dataset_id}")
def update_dataset(
    dataset_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(404, "Dataset not found")
    if current_user.role.value != "ADMIN" and ds.owner_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    if name:
        ds.name = name[:255]
    if description is not None:
        ds.description = description[:1000]
    db.commit()
    db.refresh(ds)
    return ds
