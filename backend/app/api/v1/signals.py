"""
MedInsight AI — Biomedical Signal Analysis API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.__init_models__ import SignalAnalysisJob, JobStatus, ActivityLog

router = APIRouter(prefix="/signals", tags=["Biomedical Signal Analysis"])


def _log(db, user_id, action, resource_id=None, details=None):
    db.add(ActivityLog(user_id=user_id, action=action, resource_type="signal",
                       resource_id=resource_id, details=details))
    db.commit()


def compute_signal_features(data: np.ndarray, fs: float) -> Dict[str, Any]:
    """Time-domain and frequency-domain feature extraction."""
    from scipy import signal as sp_signal
    from scipy.fft import fft, fftfreq

    features = {}
    # Time-domain
    features["mean"] = float(np.mean(data))
    features["std"] = float(np.std(data))
    features["min"] = float(np.min(data))
    features["max"] = float(np.max(data))
    features["range"] = float(np.max(data) - np.min(data))
    features["rms"] = float(np.sqrt(np.mean(data**2)))
    features["peak_to_peak"] = float(np.max(data) - np.min(data))
    features["skewness"] = float(pd.Series(data).skew())
    features["kurtosis"] = float(pd.Series(data).kurt())

    # Zero crossings
    zero_crossings = int(np.sum(np.diff(np.sign(data)) != 0))
    features["zero_crossings"] = zero_crossings

    # Frequency-domain
    n = len(data)
    if n > 1:
        fft_vals = np.abs(fft(data))[:n // 2]
        freqs = fftfreq(n, d=1.0 / fs)[:n // 2]
        features["dominant_freq_hz"] = float(freqs[np.argmax(fft_vals)])
        features["spectral_energy"] = float(np.sum(fft_vals**2))

        # Power bands (ECG-relevant)
        if fs >= 100:
            for band_name, (lo, hi) in [
                ("vlf", (0.003, 0.04)),
                ("lf", (0.04, 0.15)),
                ("hf", (0.15, 0.4)),
            ]:
                mask = (freqs >= lo) & (freqs < hi)
                features[f"power_{band_name}"] = float(np.sum(fft_vals[mask]**2)) if mask.any() else 0.0

    # Peak detection
    try:
        peaks, _ = sp_signal.find_peaks(data, distance=max(1, int(fs * 0.3)))
        features["peak_count"] = int(len(peaks))
        if len(peaks) > 1:
            rr_intervals = np.diff(peaks) / fs
            features["mean_rr_sec"] = float(np.mean(rr_intervals))
            if np.mean(rr_intervals) > 0:
                features["estimated_hr_bpm"] = float(60 / np.mean(rr_intervals))
    except Exception:
        features["peak_count"] = 0

    return features


def apply_bandpass_filter(data: np.ndarray, fs: float, lowcut: float = 0.5, highcut: float = 40.0) -> np.ndarray:
    from scipy.signal import butter, filtfilt
    nyq = 0.5 * fs
    low = max(0.001, lowcut / nyq)
    high = min(0.999, highcut / nyq)
    if low >= high:
        return data
    b, a = butter(4, [low, high], btype="band")
    return filtfilt(b, a, data)


@router.post("/analyze")
async def analyze_signal(
    file: UploadFile = File(...),
    signal_type: str = Form("ECG"),
    sampling_rate: float = Form(250.0),
    channel_column: str = Form(""),
    apply_filter: bool = Form(True),
    lowcut: float = Form(0.5),
    highcut: float = Form(40.0),
    normalize: bool = Form(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ["csv", "txt"]:
        raise HTTPException(400, "Only CSV or TXT signal files are supported")

    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(413, "Signal file too large (max 20 MB)")

    # Save file
    stored_name = f"signal_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
    with open(file_path, "wb") as f:
        f.write(content)

    job = SignalAnalysisJob(
        file_path=file_path,
        signal_type=signal_type.upper(),
        sampling_rate=sampling_rate,
        config_json={"apply_filter": apply_filter, "lowcut": lowcut, "highcut": highcut, "normalize": normalize},
        status=JobStatus.RUNNING,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        try:
            df = pd.read_csv(file_path)
        except Exception:
            df = pd.read_csv(file_path, header=None)
            df.columns = [f"ch_{i}" for i in range(df.shape[1])]

        # Select channel
        if channel_column and channel_column in df.columns:
            channel = channel_column
        else:
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if not numeric_cols:
                raise ValueError("No numeric columns found in signal file")
            channel = numeric_cols[0]

        raw = df[channel].dropna().values.astype(float)
        n_samples = len(raw)

        if n_samples < 10:
            raise ValueError("Signal too short (< 10 samples)")

        # Preview (first 1000 points)
        preview_n = min(1000, n_samples)
        time_axis = (np.arange(preview_n) / sampling_rate).tolist()
        raw_preview = raw[:preview_n].tolist()

        # Apply filter
        if apply_filter:
            try:
                filtered = apply_bandpass_filter(raw, sampling_rate, lowcut, highcut)
            except Exception:
                filtered = raw.copy()
        else:
            filtered = raw.copy()

        # Normalize
        if normalize:
            sig_range = filtered.max() - filtered.min()
            processed = (filtered - filtered.min()) / sig_range if sig_range > 0 else filtered
        else:
            processed = filtered

        processed_preview = processed[:preview_n].tolist()

        # Feature extraction
        features = compute_signal_features(processed, sampling_rate)

        # FFT for visualization
        fft_n = min(n_samples, 2048)
        fft_vals = np.abs(np.fft.fft(processed[:fft_n]))[:fft_n // 2]
        fft_freqs = np.fft.fftfreq(fft_n, d=1.0 / sampling_rate)[:fft_n // 2]
        fft_data = [{"freq": float(f), "magnitude": float(v)} for f, v in zip(fft_freqs[:200], fft_vals[:200])]

        result = {
            "signal_type": signal_type,
            "sampling_rate_hz": sampling_rate,
            "n_samples": n_samples,
            "duration_sec": round(n_samples / sampling_rate, 2),
            "channel": channel,
            "available_channels": df.select_dtypes(include=[np.number]).columns.tolist(),
            "missing_samples": int(df[channel].isnull().sum()),
            "time_axis": time_axis,
            "raw_preview": raw_preview,
            "processed_preview": processed_preview,
            "fft": fft_data,
            "features": features,
            "disclaimer": (
                f"This is a research-oriented signal characterization of an uploaded {signal_type} file. "
                "It is not a clinical interpretation. — MedInsight AI, BioIntelliX"
            ),
        }

        job.status = JobStatus.COMPLETED
        job.results_json = {"features": features, "channel": channel}
        db.commit()
        _log(db, current_user.id, "SIGNAL_ANALYSIS", job.id, {"signal_type": signal_type})

        return result

    except Exception as e:
        job.status = JobStatus.FAILED
        db.commit()
        raise HTTPException(500, f"Signal analysis failed: {e}")


@router.get("/jobs")
def list_signal_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return signal analysis job history for the current user's jobs."""
    # We join via file_path ownership check is not trivial;
    # For simplicity return all jobs for ADMIN, recent 50 for others
    if current_user.role.value == "ADMIN":
        jobs = db.query(SignalAnalysisJob).order_by(SignalAnalysisJob.created_at.desc()).limit(50).all()
    else:
        jobs = (
            db.query(SignalAnalysisJob)
            .filter(SignalAnalysisJob.file_path.contains(f"signal_{current_user.id}_"))
            .order_by(SignalAnalysisJob.created_at.desc())
            .limit(50)
            .all()
        )
    return [
        {
            "id": j.id, "signal_type": j.signal_type,
            "sampling_rate": j.sampling_rate, "status": j.status,
            "created_at": j.created_at,
        }
        for j in jobs
    ]
