"""
MedInsight AI — Synthetic Biomedical Dataset Generator
BioIntelliX | Team led by Mr. S. K. Shrivastav

Generates synthetic heart disease and ECG datasets for demonstration purposes.
These are purely synthetic and do NOT represent real patient data.
"""
import numpy as np
import pandas as pd
import os

np.random.seed(42)

print("Generating synthetic biomedical datasets...")
print("BioIntelliX | MedInsight AI — For research and demonstration only.")
print()


# ── 1. Synthetic Heart Disease Dataset (UCI-inspired, 1000 samples) ───────────
n = 1000

age = np.random.randint(29, 77, n)
sex = np.random.choice([0, 1], n, p=[0.32, 0.68])  # 0=Female, 1=Male
cp = np.random.choice([0, 1, 2, 3], n, p=[0.47, 0.17, 0.28, 0.08])  # chest pain type
trestbps = np.random.normal(131, 17, n).clip(94, 200).astype(int)
chol = np.random.normal(246, 52, n).clip(126, 564).astype(int)
fbs = np.random.choice([0, 1], n, p=[0.85, 0.15])  # fasting blood sugar > 120
restecg = np.random.choice([0, 1, 2], n, p=[0.52, 0.02, 0.46])
thalach = np.random.normal(149, 23, n).clip(71, 202).astype(int)
exang = np.random.choice([0, 1], n, p=[0.67, 0.33])
oldpeak = np.round(np.random.exponential(1.0, n).clip(0, 6.2), 1)
slope = np.random.choice([0, 1, 2], n, p=[0.07, 0.46, 0.47])
ca = np.random.choice([0, 1, 2, 3], n, p=[0.58, 0.22, 0.13, 0.07])
thal = np.random.choice([1, 2, 3], n, p=[0.06, 0.55, 0.39])

# Target: simulate heart disease presence based on risk factors
risk_score = (
    (age > 55).astype(float) * 0.3 +
    (sex == 1).astype(float) * 0.2 +
    (cp == 0).astype(float) * 0.4 +
    (trestbps > 140).astype(float) * 0.2 +
    (chol > 240).astype(float) * 0.1 +
    (fbs == 1).astype(float) * 0.1 +
    (exang == 1).astype(float) * 0.3 +
    (oldpeak > 2).astype(float) * 0.3 +
    (ca > 0).astype(float) * 0.4 +
    (thal == 3).astype(float) * 0.3
)
target = (risk_score + np.random.normal(0, 0.2, n) > 1.2).astype(int)

heart_df = pd.DataFrame({
    "age": age, "sex": sex, "cp": cp, "trestbps": trestbps,
    "chol": chol, "fbs": fbs, "restecg": restecg, "thalach": thalach,
    "exang": exang, "oldpeak": oldpeak, "slope": slope, "ca": ca,
    "thal": thal, "target": target,
})

# Add a few intentional missing values to demonstrate quality engine
mask_chol = np.random.choice(n, 15, replace=False)
heart_df.loc[mask_chol, "chol"] = np.nan
mask_thal = np.random.choice(n, 8, replace=False)
heart_df.loc[mask_thal, "thal"] = np.nan

out_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "synthetic_heart_disease.csv")
os.makedirs(os.path.dirname(out_path), exist_ok=True)
heart_df.to_csv(out_path, index=False)
print(f"[OK] Heart disease dataset: {out_path} -- {len(heart_df)} rows, {len(heart_df.columns)} columns")
print(f"  Target distribution: {heart_df['target'].value_counts().to_dict()}")
print()


# ── 2. Synthetic ECG Signal Dataset (1-lead, 10 seconds @ 250 Hz) ─────────────
fs = 250  # Hz
duration = 10  # seconds
t = np.linspace(0, duration, fs * duration)

# Simulate a simplified ECG-like signal (PQRST complex approximation)
def generate_ecg_beat(t_arr, beat_start, hr_bpm=70):
    interval = 60.0 / hr_bpm
    t_rel = t_arr - beat_start
    mask = (t_rel >= 0) & (t_rel < interval)
    signal = np.zeros_like(t_arr)
    # P wave
    p_center = beat_start + 0.08
    signal += 0.15 * np.exp(-((t_arr - p_center) ** 2) / (2 * 0.005**2)) * (t_arr > beat_start - 0.01)
    # Q wave
    q_center = beat_start + 0.14
    signal -= 0.1 * np.exp(-((t_arr - q_center) ** 2) / (2 * 0.003**2)) * (t_arr > beat_start - 0.01)
    # R wave (tall spike)
    r_center = beat_start + 0.18
    signal += 1.2 * np.exp(-((t_arr - r_center) ** 2) / (2 * 0.003**2)) * (t_arr > beat_start - 0.01)
    # S wave
    s_center = beat_start + 0.22
    signal -= 0.3 * np.exp(-((t_arr - s_center) ** 2) / (2 * 0.004**2)) * (t_arr > beat_start - 0.01)
    # T wave
    t_center = beat_start + 0.36
    signal += 0.3 * np.exp(-((t_arr - t_center) ** 2) / (2 * 0.02**2)) * (t_arr > beat_start - 0.01)
    return signal

ecg = np.zeros(len(t))
heart_rate = 75  # bpm
beat_interval = 60.0 / heart_rate
beat_time = 0.2  # first beat at 0.2s
while beat_time < duration:
    ecg += generate_ecg_beat(t, beat_time, heart_rate)
    beat_time += beat_interval + np.random.normal(0, 0.01)  # slight variation

# Add baseline wander and noise
baseline_wander = 0.05 * np.sin(2 * np.pi * 0.05 * t)
noise = np.random.normal(0, 0.03, len(t))
ecg_signal = ecg + baseline_wander + noise

ecg_df = pd.DataFrame({
    "time_sec": np.round(t, 4),
    "ecg_mv": np.round(ecg_signal, 6),
    "channel": "I",
    "sampling_rate_hz": 250,
})

ecg_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "synthetic_ecg_signal.csv")
ecg_df.to_csv(ecg_path, index=False)
print(f"[OK] ECG signal dataset: {ecg_path} -- {len(ecg_df)} samples @ {fs} Hz, {duration}s duration")
print()


# ── 3. Synthetic Diabetes Dataset (Pima-inspired, 800 samples) ────────────────
n2 = 800
pregnancies = np.random.randint(0, 18, n2)
glucose = np.random.normal(121, 32, n2).clip(44, 199).astype(int)
blood_pressure = np.random.normal(69, 19, n2).clip(24, 122).astype(int)
skin_thickness = np.random.normal(29, 16, n2).clip(7, 99).astype(int)
insulin = np.abs(np.random.normal(80, 115, n2)).clip(14, 846).astype(int)
bmi = np.round(np.random.normal(32, 7, n2).clip(18.2, 67.1), 1)
diabetes_pedigree = np.round(np.random.exponential(0.47, n2).clip(0.08, 2.42), 3)
age2 = np.random.randint(21, 82, n2)

risk2 = (
    (glucose > 140).astype(float) * 0.5 +
    (bmi > 30).astype(float) * 0.3 +
    (age2 > 50).astype(float) * 0.2 +
    (insulin > 200).astype(float) * 0.2
)
outcome = (risk2 + np.random.normal(0, 0.2, n2) > 0.5).astype(int)

diabetes_df = pd.DataFrame({
    "Pregnancies": pregnancies, "Glucose": glucose,
    "BloodPressure": blood_pressure, "SkinThickness": skin_thickness,
    "Insulin": insulin, "BMI": bmi,
    "DiabetesPedigreeFunction": diabetes_pedigree, "Age": age2,
    "Outcome": outcome,
})

diab_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "synthetic_diabetes.csv")
diabetes_df.to_csv(diab_path, index=False)
print(f"[OK] Diabetes dataset: {diab_path} -- {len(diabetes_df)} rows, {len(diabetes_df.columns)} columns")
print(f"  Outcome distribution: {diabetes_df['Outcome'].value_counts().to_dict()}")
print()

print("=" * 60)
print("DISCLAIMER: These are synthetic research datasets generated")
print("algorithmically. They do NOT represent real patient data.")
print("Not for clinical or diagnostic use.")
print("BioIntelliX | MedInsight AI — From Biomedical Data to Intelligent Insight.")
print("=" * 60)
