"""
MedInsight AI — Biomedical Signal Processing: Feature Extraction & Peak Detection
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from scipy import signal as sp_signal
from scipy.fft import fft, fftfreq


def extract_time_domain_features(data: np.ndarray) -> Dict[str, float]:
    """Calculate standard statistical and morphological time-domain features."""
    s = pd.Series(data)
    mean_val = float(np.mean(data))
    std_val = float(np.std(data))
    min_val = float(np.min(data))
    max_val = float(np.max(data))
    rms_val = float(np.sqrt(np.mean(data ** 2)))
    peak_to_peak = float(max_val - min_val)
    zero_crossings = int(np.sum(np.diff(np.sign(data)) != 0))

    return {
        "mean": mean_val,
        "std": std_val,
        "min": min_val,
        "max": max_val,
        "peak_to_peak": peak_to_peak,
        "rms": rms_val,
        "skewness": float(s.skew()) if not pd.isna(s.skew()) else 0.0,
        "kurtosis": float(s.kurt()) if not pd.isna(s.kurt()) else 0.0,
        "zero_crossings": zero_crossings,
    }


def extract_frequency_domain_features(data: np.ndarray, fs: float) -> Dict[str, float]:
    """Calculate spectral features including dominant frequency, total power, and spectral bands."""
    n = len(data)
    if n < 4:
        return {"dominant_freq_hz": 0.0, "spectral_energy": 0.0}

    # Welch Power Spectral Density
    freqs, psd = sp_signal.welch(data, fs=fs, nperseg=min(256, n))
    dominant_freq = float(freqs[np.argmax(psd)]) if len(psd) > 0 else 0.0
    total_power = float(np.sum(psd))

    features = {
        "dominant_freq_hz": dominant_freq,
        "spectral_energy": total_power,
    }

    # Standard Heart Rate Variability (HRV) / ECG spectral bands
    # Very Low Frequency: 0.003 - 0.04 Hz
    # Low Frequency (LF): 0.04 - 0.15 Hz (sympathetic + parasympathetic)
    # High Frequency (HF): 0.15 - 0.4 Hz (vagal / parasympathetic)
    if fs >= 50:
        vlf_mask = (freqs >= 0.003) & (freqs < 0.04)
        lf_mask = (freqs >= 0.04) & (freqs < 0.15)
        hf_mask = (freqs >= 0.15) & (freqs < 0.4)

        power_vlf = float(np.sum(psd[vlf_mask])) if vlf_mask.any() else 0.0
        power_lf = float(np.sum(psd[lf_mask])) if lf_mask.any() else 0.0
        power_hf = float(np.sum(psd[hf_mask])) if hf_mask.any() else 0.0

        features["power_vlf"] = power_vlf
        features["power_lf"] = power_lf
        features["power_hf"] = power_hf
        features["lf_hf_ratio"] = float(power_lf / power_hf) if power_hf > 0 else 0.0

    return features


def detect_r_peaks(data: np.ndarray, fs: float, distance_ms: float = 300.0) -> List[int]:
    """
    Pan-Tompkins inspired R-peak detection:
    1. Bandpass filter / Derivative
    2. Squaring function
    3. Moving window integrator
    4. Adaptive threshold peak detection
    """
    if len(data) < int(fs * 0.5):
        return []

    # Differentiation to highlight QRS slope
    diff = np.diff(data)
    # Squaring to emphasize large differences
    squared = diff ** 2
    # Moving window integration (~150 ms window)
    window_len = int(0.15 * fs)
    if window_len < 1:
        window_len = 1
    integrated = np.convolve(squared, np.ones(window_len) / window_len, mode="same")

    # Min distance between adjacent heartbeats in samples
    min_dist = int((distance_ms / 1000.0) * fs)
    threshold = float(np.mean(integrated) + 0.5 * np.std(integrated))

    peaks, _ = sp_signal.find_peaks(integrated, height=threshold, distance=max(1, min_dist))
    return [int(p) for p in peaks]


def calculate_hrv_metrics(r_peak_indices: List[int], fs: float) -> Dict[str, float]:
    """Compute Time-Domain Heart Rate Variability (HRV) metrics from detected R-peaks."""
    if len(r_peak_indices) < 2:
        return {
            "num_beats": len(r_peak_indices),
            "estimated_bpm": 0.0,
            "mean_rr_ms": 0.0,
            "sdnn_ms": 0.0,
            "rmssd_ms": 0.0,
            "pnn50": 0.0,
        }

    # RR intervals in milliseconds
    rr_intervals = np.diff(r_peak_indices) * (1000.0 / fs)
    mean_rr = float(np.mean(rr_intervals))
    sdnn = float(np.std(rr_intervals))
    # Successive differences
    successive_diffs = np.diff(rr_intervals)
    rmssd = float(np.sqrt(np.mean(successive_diffs ** 2))) if len(successive_diffs) > 0 else 0.0
    nn50 = int(np.sum(np.abs(successive_diffs) > 50)) if len(successive_diffs) > 0 else 0
    pnn50 = float(nn50 / len(successive_diffs)) if len(successive_diffs) > 0 else 0.0
    bpm = float(60000.0 / mean_rr) if mean_rr > 0 else 0.0

    return {
        "num_beats": len(r_peak_indices),
        "estimated_bpm": round(bpm, 1),
        "mean_rr_ms": round(mean_rr, 2),
        "sdnn_ms": round(sdnn, 2),
        "rmssd_ms": round(rmssd, 2),
        "pnn50": round(pnn50, 4),
    }
