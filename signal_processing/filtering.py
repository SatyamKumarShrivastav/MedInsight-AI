"""
MedInsight AI — Biomedical Signal Processing: Digital Filtering & Preprocessing
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import numpy as np
from scipy import signal as sp_signal


def butter_bandpass(lowcut: float, highcut: float, fs: float, order: int = 4):
    """Design a Butterworth bandpass filter."""
    nyquist = 0.5 * fs
    low = lowcut / nyquist
    high = highcut / nyquist
    # Ensure bounds remain within (0, 1)
    low = max(0.001, min(0.99, low))
    high = max(low + 0.001, min(0.999, high))
    b, a = sp_signal.butter(order, [low, high], btype="bandpass")
    return b, a


def bandpass_filter(data: np.ndarray, lowcut: float, highcut: float, fs: float, order: int = 4) -> np.ndarray:
    """Apply zero-phase forward-backward Butterworth bandpass filter."""
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    return sp_signal.filtfilt(b, a, data)


def notch_filter(data: np.ndarray, cutoff_freq: float = 50.0, fs: float = 250.0, quality_factor: float = 30.0) -> np.ndarray:
    """Apply an IIR notch filter to remove power-line interference (50 Hz or 60 Hz)."""
    nyquist = 0.5 * fs
    if cutoff_freq >= nyquist:
        return data.copy()
    w0 = cutoff_freq / nyquist
    b, a = sp_signal.iirnotch(w0, quality_factor)
    return sp_signal.filtfilt(b, a, data)


def remove_baseline_wander(data: np.ndarray, fs: float = 250.0) -> np.ndarray:
    """Remove low-frequency respiration baseline wander using two successive median filters."""
    # First median filter window ~ 200 ms
    w1 = int(0.2 * fs)
    if w1 % 2 == 0:
        w1 += 1
    # Second median filter window ~ 600 ms
    w2 = int(0.6 * fs)
    if w2 % 2 == 0:
        w2 += 1

    baseline = sp_signal.medfilt(data, kernel_size=min(w1, len(data) if len(data) % 2 != 0 else len(data) - 1))
    baseline = sp_signal.medfilt(baseline, kernel_size=min(w2, len(data) if len(data) % 2 != 0 else len(data) - 1))
    return data - baseline


def normalize_signal(data: np.ndarray, method: str = "zscore") -> np.ndarray:
    """Normalize signal: 'zscore' or 'minmax'."""
    if method == "minmax":
        d_min = np.min(data)
        d_max = np.max(data)
        if d_max - d_min == 0:
            return np.zeros_like(data)
        return (data - d_min) / (d_max - d_min)
    std = np.std(data)
    if std == 0:
        return np.zeros_like(data)
    return (data - np.mean(data)) / std
