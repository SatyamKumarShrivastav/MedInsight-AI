# MedInsight AI — Biomedical Signal Processing Guide
**BioIntelliX | Team led by Mr. S. K. Shrivastav**  
*From Biomedical Data to Intelligent Insight.*

---

## 1. Scope & Development Constraint

MedInsight AI is a **purely software-based** platform. It operates directly on uploaded CSV waveforms or public benchmark files (e.g., PTB-XL, MIT-BIH Arrhythmia). It does not require any external physical microcontroller, sensor board, or proprietary acquisition device.

---

## 2. Digital Filtering & Artifact Removal

Physiological signals (ECG, EEG, EMG) are inherently vulnerable to high-frequency electromyographic noise, 50/60 Hz power-line interference, and respiration-induced baseline wander.

### 2.1 Bandpass Filtering
- **Design**: 4th-order zero-phase Butterworth filter.
- **Typical Passband**: 0.5 Hz to 40.0 Hz for diagnostic ECG; 1.0 Hz to 70.0 Hz for EEG.
- **Implementation**: `scipy.signal.filtfilt(b, a, data)` ensures zero phase distortion and preserves critical wave morphology timing.

### 2.2 Notch Filter
- **Design**: IIR notch filter tuned to 50 Hz (or 60 Hz).
- **Quality Factor (Q)**: 30.0 for sharp attenuation of harmonic power-grid hum without eroding adjacent QRS frequency components.

### 2.3 Baseline Wander Correction
- **Method**: Dual median filtering.
- **Kernel 1**: 200 ms window to suppress QRS complexes and P waves.
- **Kernel 2**: 600 ms window to track the slow baseline drift.
- Subtraction of the estimated baseline from the raw signal yields an isoelectric horizontal trace.

---

## 3. Peak Detection & Morphological Segmentation

### 3.1 Pan-Tompkins Algorithm Stages
1. **Bandpass Filtering**: 5–15 Hz emphasis on QRS energy.
2. **Derivative**: Highlights steep rising slope of the R-wave.
3. **Squaring**: Amplifies high-amplitude spikes and forces positive values.
4. **Moving Window Integration**: Smooths high-frequency spikes into a unified energy burst.
5. **Adaptive Thresholding**: Minimum refractory period of 300 ms prevents false triggering on tall T-waves.

---

## 4. Derived Feature Sets

### 4.1 Time-Domain Metrics
- **Mean & Standard Deviation**: Baseline amplitude and variability.
- **RMS (Root Mean Square)**: Signal energy representation.
- **Peak-to-Peak Amplitude**: Diagnostic for low-voltage or hypertrophy conditions.
- **Zero-Crossing Rate**: Quantifies signal oscillations and high-frequency noise.

### 4.2 Frequency-Domain Metrics (Welch PSD)
- **Dominant Frequency**: Peak spectral energy frequency.
- **Spectral Bands**:
  - Very Low Frequency (VLF): 0.003 – 0.04 Hz
  - Low Frequency (LF): 0.04 – 0.15 Hz
  - High Frequency (HF): 0.15 – 0.40 Hz
  - LF/HF Ratio: Standard sympathovagal balance indicator.

### 4.3 Heart Rate Variability (HRV)
- **Estimated BPM**: Calculated from mean RR interval ($60000 / \text{mean\_RR\_ms}$).
- **SDNN**: Standard deviation of NN intervals.
- **RMSSD**: Root mean square of successive differences.
- **pNN50**: Proportion of adjacent RR intervals differing by $> 50$ ms.
