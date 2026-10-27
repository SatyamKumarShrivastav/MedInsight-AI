"""
MedInsight AI — Unit Tests: Biomedical Signal Processing
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import pytest
import numpy as np
from signal_processing.filtering import (
    bandpass_filter,
    notch_filter,
    remove_baseline_wander,
    normalize_signal,
)
from signal_processing.features import (
    extract_time_domain_features,
    extract_frequency_domain_features,
    detect_r_peaks,
    calculate_hrv_metrics,
)


def test_bandpass_and_notch_filtering(sample_ecg_signal):
    raw_ecg, fs = sample_ecg_signal
    # Bandpass filter (0.5 to 40 Hz)
    filtered = bandpass_filter(raw_ecg, lowcut=0.5, highcut=40.0, fs=fs)
    assert len(filtered) == len(raw_ecg)
    assert not np.isnan(filtered).any()

    # 50 Hz notch filter
    notched = notch_filter(filtered, cutoff_freq=50.0, fs=fs)
    assert len(notched) == len(raw_ecg)
    assert not np.isnan(notched).any()


def test_baseline_wander_removal(sample_ecg_signal):
    raw_ecg, fs = sample_ecg_signal
    # Introduce artificial slow baseline drift
    t = np.linspace(0, 5, len(raw_ecg))
    drift = 0.5 * np.sin(2 * np.pi * 0.1 * t)
    drifting_ecg = raw_ecg + drift

    corrected = remove_baseline_wander(drifting_ecg, fs=fs)
    assert len(corrected) == len(raw_ecg)
    assert np.std(corrected) < np.std(drifting_ecg)


def test_signal_normalization():
    data = np.array([10.0, 20.0, 30.0, 40.0, 50.0])
    zscored = normalize_signal(data, method="zscore")
    assert np.isclose(np.mean(zscored), 0.0, atol=1e-5)
    assert np.isclose(np.std(zscored), 1.0, atol=1e-5)

    minmaxed = normalize_signal(data, method="minmax")
    assert np.isclose(np.min(minmaxed), 0.0)
    assert np.isclose(np.max(minmaxed), 1.0)


def test_time_domain_feature_extraction(sample_ecg_signal):
    raw_ecg, _ = sample_ecg_signal
    features = extract_time_domain_features(raw_ecg)
    assert "mean" in features
    assert "rms" in features
    assert "peak_to_peak" in features
    assert "zero_crossings" in features
    assert features["rms"] > 0
    assert features["peak_to_peak"] > 0


def test_frequency_domain_spectral_analysis(sample_ecg_signal):
    raw_ecg, fs = sample_ecg_signal
    features = extract_frequency_domain_features(raw_ecg, fs=fs)
    assert "dominant_freq_hz" in features
    assert "spectral_energy" in features
    assert "power_lf" in features
    assert "power_hf" in features
    assert features["spectral_energy"] > 0


def test_r_peak_detection_and_hrv(sample_ecg_signal):
    raw_ecg, fs = sample_ecg_signal
    peaks = detect_r_peaks(raw_ecg, fs=fs)
    assert isinstance(peaks, list)
    assert len(peaks) > 0

    hrv = calculate_hrv_metrics(peaks, fs=fs)
    assert "estimated_bpm" in hrv
    assert "mean_rr_ms" in hrv
    assert "sdnn_ms" in hrv
    assert hrv["num_beats"] == len(peaks)
