#!/usr/bin/env python3
"""
MedInsight AI — Synthetic Heart Disease Dataset Generator
BioIntelliX | Team led by Mr. S. K. Shrivastav

Generates a synthetic biomedical dataset for demonstration purposes.
NOT real patient data. For research and testing only.
"""
import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)
N = 500

# Demographics
ages = np.random.normal(54, 9, N).clip(25, 80).astype(int)
sexes = np.random.choice([0, 1], N, p=[0.32, 0.68])  # 0=Female, 1=Male

# Biomedical measurements
# Higher age + male -> higher risk
risk_score = (ages - 25) / 55 * 0.5 + sexes * 0.2 + np.random.normal(0, 0.15, N)
risk_score = np.clip(risk_score, 0, 1)

systolic_bp = (110 + risk_score * 60 + np.random.normal(0, 12, N)).clip(90, 200).astype(int)
diastolic_bp = (70 + risk_score * 30 + np.random.normal(0, 8, N)).clip(60, 130).astype(int)
cholesterol = (150 + risk_score * 130 + np.random.normal(0, 25, N)).clip(100, 350).astype(int)
glucose = (80 + risk_score * 80 + np.random.normal(0, 15, N)).clip(60, 250).astype(int)

# BMI
heights_cm = np.random.normal(168, 9, N).clip(150, 195)
weights_kg = np.random.normal(72, 14, N).clip(45, 130)
bmi = (weights_kg / (heights_cm / 100) ** 2).round(1)

# Heart rate
max_hr = (220 - ages - risk_score * 30 + np.random.normal(0, 12, N)).clip(80, 200).astype(int)
resting_hr = (65 + risk_score * 25 + np.random.normal(0, 8, N)).clip(45, 110).astype(int)

# Chest pain type (0-3)
chest_pain = np.where(
    risk_score > 0.7,
    np.random.choice([2, 3], N),
    np.random.choice([0, 1, 2], N, p=[0.5, 0.3, 0.2])
)

# ST segment (exercise ECG feature)
st_depression = (risk_score * 3 + np.random.normal(0, 0.5, N)).clip(0, 6.2).round(1)

# Number of major vessels (0-3)
num_vessels = np.where(risk_score > 0.6, np.random.choice([1, 2, 3], N), np.random.choice([0, 1], N, p=[0.7, 0.3]))

# Thalassemia (1=normal, 2=fixed defect, 3=reversable defect)
thal = np.where(risk_score > 0.65, np.random.choice([2, 3], N), np.random.choice([1, 3], N, p=[0.7, 0.3]))

# Target: 0 = No disease, 1 = Disease present
# Using logistic-like probability
prob = 1 / (1 + np.exp(-5 * (risk_score - 0.45)))
target = (np.random.random(N) < prob).astype(int)

# Introduce ~3% missing values for realism
def add_missing(arr, pct=0.03):
    result = arr.astype(float)
    mask = np.random.random(len(arr)) < pct
    result[mask] = np.nan
    return result

df = pd.DataFrame({
    "age": ages,
    "sex": sexes,
    "chest_pain_type": chest_pain,
    "resting_bp_systolic": systolic_bp,
    "resting_bp_diastolic": diastolic_bp,
    "cholesterol": add_missing(cholesterol),
    "fasting_blood_glucose": glucose,
    "max_heart_rate": max_hr,
    "resting_heart_rate": resting_hr,
    "bmi": add_missing(bmi),
    "st_depression": add_missing(st_depression),
    "num_major_vessels": num_vessels,
    "thalassemia": thal,
    "height_cm": heights_cm.round(1),
    "weight_kg": weights_kg.round(1),
    "heart_disease": target,
})

output_path = Path(__file__).parent / "synthetic_heart_disease.csv"
df.to_csv(output_path, index=False)

print(f"Synthetic dataset saved: {output_path}")
print(f"Shape: {df.shape}")
print(f"Target distribution:\n{df['heart_disease'].value_counts()}")
print(f"Missing values:\n{df.isnull().sum()[df.isnull().sum() > 0]}")
print("\nDISCLAIMER: This is a synthetic dataset generated for research demonstration.")
print("It does NOT represent real patient data.")
