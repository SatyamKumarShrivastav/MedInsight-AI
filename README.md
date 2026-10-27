# MedInsight AI
### An Explainable AI-Powered Biomedical Data Analytics and Predictive Decision-Support Platform

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0%2B-646CFF.svg)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg)](https://www.mysql.com/)
[![Tests](https://img.shields.io/badge/Pytest-30%20Passed%20(100%25)-brightgreen.svg)](tests/)
[![License](https://img.shields.io/badge/License-Academic%20Research-lightgrey.svg)](#-academic--clinical-disclaimer)

**Tagline:** *From Biomedical Data to Intelligent Insight.*  
**Engineering & Research Organization:** **BioIntelliX**  
**Project Leadership:** Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**)  
**Comprehensive System Specification:** Detailed formulas, schemas, and architectural breakdowns can be found in [`Project_Details.md`](Project_Details.md).

---

## 🔬 Project Overview

**MedInsight AI** is an academic and research-oriented software platform engineered to transform raw biomedical datasets and physiological waveforms into reliable, explainable, and reproducible clinical decision-support insights.

Healthcare artificial intelligence frequently suffers from the **"Black-Box" opacity dilemma**, **data leakage** across processing steps, and **workflow fragmentation** across disparate tools. MedInsight AI bridges these gaps in a unified, **software-only architecture**:
* **Pure Software Signal Processing**: Operates on digital waveform files (ECG, EEG, EMG in CSV format; PTB-XL, MIT-BIH) with zero hardware or sensor board dependency.
* **Leakage-Free ML Workflows**: Strict separation where imputers, normalizers, and scalers are fitted exclusively on training splits during 5-fold cross-validation.
* **Transparent Explainability (XAI)**: Exact local instance attributions via TreeSHAP and LinearSHAP, signed directional risk contributions, and global feature rankings.
* **Evidence-Grounded Research Assistant**: Hierarchical literature chunking and TF-IDF retrieval anchored strictly to peer-reviewed 2025–2026 academic literature with traceable DOIs and PMIDs.
* **Multi-Network RBAC Governance**: Granular role-based privileges with a strict localhost-only physical console constraint for the CEO super-admin role, two-phase password change approvals, and immutable activity auditing.

---

## 🏛️ System Architecture

MedInsight AI is organized into a **4-tier layered architecture**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER 1: DATA SOURCES                            │
│  - Tabular Clinical Records (UCI Heart Disease, Diabetes, MIMIC-IV)     │
│  - Physiological Waveforms (ECG, EEG, EMG CSV formats; PTB-XL, MIT-BIH) │
│  - Academic Literature (2025–2026 Reference Papers PDF / TXT)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             TIER 2: INGESTION, VALIDATION & PREPROCESSING              │
│  - Data Quality Engine: Missingness diagnostics, duplicate checks      │
│  - Signal Processing Engine: Zero-phase Butterworth, 50 Hz Notch       │
│  - Dual-Stage Median Baseline Wander Removal (200 ms & 600 ms kernels)  │
│  - Tabular Pipeline: Median imputation, categorical encoding, scaling  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 TIER 3: ANALYTICS, ML & EXPLAINABILITY                 │
│  - Biomedical Analytics: Lipid profiles, glycemic index, blood pressure│
│  - Model Training: Random Forest, SVM, KNN, Logistic, XGBoost, LGBM    │
│  - Evaluation: Stratified 5-Fold CV, ROC-AUC, PR Curves, Conf. Matrix  │
│  - Explainable AI (XAI): TreeSHAP & LinearSHAP local/global attributions│
│  - Anomaly Detection: Isolation Forest & Local Outlier Factor (LOF)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 4: OUTPUTS, RAG & GOVERNANCE                        │
│  - Interactive Visualizations: Recharts SVG charts, ECG wave rendering │
│  - Biomedical Research Assistant: Hierarchical RAG citation engine     │
│  - Publication Reports: PDF (ReportLab), CSV, XLSX with disclaimers    │
│  - Role Governance: CEO, ADMIN, RESEARCHER, STUDENT + Audit Trail      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
* Python 3.11+
* Node.js 18+ (with npm)
* MySQL Server 8.0 on `localhost:3306`

### 2. Environment Setup
```powershell
# Copy example environment configuration
cp .env.example .env
```
Ensure `.env` matches your MySQL credentials:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=medinsight_ai
SECRET_KEY=CHANGE-THIS-TO-A-STRONG-RANDOM-SECRET-IN-PRODUCTION
```
Set the `MEDINSIGHT_*_PASSWORD` values in `.env` to distinct, strong values before running the seed scripts. Seeded account passwords are not stored in source code or printed.

### 3. Backend & Database Seeding
```powershell
cd backend
pip install -r requirements.txt

# Run the seeding script to initialize MySQL tables, default accounts, and literature
python ..\scripts\seed_db.py

# Launch the FastAPI backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
* Interactive API Documentation (Swagger): `http://localhost:8000/api/docs`
* Alternative Redoc Documentation: `http://localhost:8000/api/redoc`

### 4. Frontend Launch
```powershell
cd ..\frontend
npm install
npm run dev
```
* Open your browser at: `http://localhost:5173`

---

## 🔐 Role-Based Access Hierarchy & Seeded Account Configuration

| Role | Email | Credential Setup | Scope & Operational Authority |
|---|---|---|---|
| **CEO** | `ceo@medinsight.ai` | `Set MEDINSIGHT_CEO_PASSWORD in .env` | **Super Administrator (Satyam Kumar Shrivastav)**. Complete platform authority. Configures administrator limit, approves administrator appointments and admin password changes. **Restricted to physical localhost console access only (`127.0.0.1`).** |
| **ADMIN** | `admin@medinsight.ai` | `Set MEDINSIGHT_ADMIN_PASSWORD in .env` | **System Administrator**. Manages standard user verification, role promotion (up to Researcher), and inspects platform audit logs. Password updates require CEO approval. |
| **RESEARCHER** | `researcher@medinsight.ai` | `Set MEDINSIGHT_RESEARCHER_PASSWORD in .env` | **Principal Investigator / Clinician**. Uploads datasets, trains ML models, runs signal processing & XAI pipelines, generates publication PDF reports. |
| **STUDENT** | Self-registered | User-defined | **Trainee / Student**. Read-only access to datasets, pre-trained model inference workspace, literature search, and documentation. |

---

## 🧩 Core Platform Capabilities

### 1. Biomedical Signal Processing (DSP)
* **Zero-Phase Digital Filtering**: 4th-order Butterworth bandpass filter using `scipy.signal.filtfilt` ensuring zero phase distortion for ECG ($0.5–40\text{ Hz}$) and EEG ($1.0–70\text{ Hz}$).
* **50 Hz / 60 Hz IIR Notch Filter**: Sharp power-line interference suppression ($Q = 30.0$).
* **Dual-Stage Median Baseline Wander Removal**: Cascaded $200\text{ ms}$ and $600\text{ ms}$ median filtering for isoelectric baseline restoration.
* **Pan-Tompkins QRS Detection**: High-accuracy R-peak detection with refractory holdoff ($300\text{ ms}$).
* **Heart Rate Variability (HRV)**: Time-domain (BPM, SDNN, RMSSD, pNN50) and frequency-domain (Welch PSD: VLF, LF, HF, and LF/HF ratio).

### 2. Machine Learning & Predictive Modeling
* **Estimators**: Random Forest, SVM (Platt scaling), Logistic Regression (L2/ElasticNet), K-Nearest Neighbors (KNN), XGBoost, LightGBM.
* **Cross-Validation**: Stratified 5-Fold cross-validation preventing distribution skew.
* **Evaluation Metrics**: Weighted F1, Macro F1, Precision, Recall, Accuracy, ROC-AUC, Precision-Recall curves, and Confusion Matrices.

### 3. Explainable AI (XAI)
* **SHAP Integration**: Exact TreeSHAP and LinearSHAP computing additive feature contributions.
* **Signed Directional Attribution**: Color-coded visualization isolating risk-elevating factors from protective factors.
* **Global Importance**: Mean absolute SHAP values ranking overall biomarker influence.

### 4. Biomedical Research Assistant & RAG
* **Hierarchical Chunking**: Structured passages ($250\text{ words}$ with $50\text{ word}$ overlap).
* **TF-IDF Retrieval**: Sparse vector similarity over 2025–2026 academic literature.
* **Grounded Synthesis**: Answers anchored strictly to retrieved evidence with explicit citation metadata (DOIs, PMIDs).

### 5. Automated Publication Reporting
* **ReportLab Integration**: Compiles experiment summaries, hyperparameter configurations, evaluation tables, confusion matrices, and SHAP charts into publication-ready PDF reports.
* **Multi-Format Export**: One-click download of CSV, XLSX, and JSON data.

---

## 🧪 Automated Testing Suite

MedInsight AI includes an automated testing suite using `pytest` and `fastapi.testclient`:

```powershell
python -m pytest tests -v
```

**Verification Results: `30 passed in 11.75s (100% PASS RATE)`**
* `tests/test_auth_and_rbac.py`: Authentication, JWT issuance, CEO localhost-only restriction, and two-phase password approvals.
* `tests/test_quality_and_preprocessing.py`: Quality diagnostics, missingness audits, and leakage-free scaling pipelines.
* `tests/test_signal_processing.py`: Butterworth zero-phase filtering, notch attenuation, Pan-Tompkins peak detection, and HRV metrics.
* `tests/test_ml_and_xai.py`: Cross-validation, model training, SHAP attributions, and anomaly detection.
* `tests/test_research_assistant_and_rag.py`: Hierarchical document chunking, TF-IDF scoring, and citation grounding.
* `tests/test_api_endpoints.py`: End-to-end API contract testing across all 15 routers.

---

## 📚 2024–2026 Peer-Reviewed Literature Foundation

1. **PubMed Reasoner: Dynamic Reasoning-based Retrieval for Evidence-Grounded Biomedical Question Answering (2026)** — Zhang, Liu, and Murai (*ACL 2026*, `2026.acl-long.763`).
2. **Holistic AI in Medicine: Improved Performance and Explainability (xHAIM) (2026)** — Petridis et al. (*npj Digital Medicine*, `10.1038/s41746-025-02298-3`).
3. **Transparency of Medical Artificial Intelligence Systems (2026)** — Kim, Gadgil, and Lee (*Nature Reviews Bioengineering*, `10.1038/s44222-025-00363-w`).
4. **Explainable ECG Analysis by Explicit Information Disentanglement With VAEs (2026)** — van der Valk et al. (*IEEE TBME*, `10.1109/TBME.2026.41212713`).
5. **The Cost of Explainability in AI-Enhanced ECG Models (2025)** — Patlatzoglou et al. (*npj Digital Medicine*, `10.1038/s41746-025-02122-y`).
6. **Hierarchical RAG Enhances a Pharmacogenomic AI Assistant in Guideline Related Queries (2026)** — Jeon et al. (*Computers in Biology and Medicine*, `10.1016/j.compbiomed.2026.109842`).
7. **CLEAR: An Auditable Foundation Model for Radiology Grounded in Clinical Concepts (2026)** — Han et al. (*Nature Biomedical Engineering*, `10.1038/s41551-026-01741-4`).
8. **Foundational Methodological Reviews (2023–2024)**:
   * *Taipalus et al. (2023)*, *SN Computer Science* (Tertiary study on healthcare data analytics).
   * *Kolasa et al. (2024)*, *Expert Rev. Pharmacoecon.* (Meta-review of 10,462 algorithms showing data leakage pitfalls).
   * *Mehta et al. (2019)*, *J. Biomed. Inform.* (Systematic mapping of healthcare AI workflow fragmentation).
   * *Wasimuddin et al. (2020)*, *IEEE Access* (Four-stage ECG signal processing standard).

---

## 📂 Repository Layout

```
MedInsight AI/
├── backend/                  # FastAPI Application Core
│   ├── app/
│   │   ├── api/v1/          # 15 REST API Endpoints (auth, ml, xai, signals, etc.)
│   │   ├── core/            # Database engine, config, and security
│   │   ├── models/          # 14 SQLAlchemy ORM models
│   │   └── schemas/         # Pydantic v2 validation models
│   ├── main.py              # Application entrypoint & CORS middleware
│   └── requirements.txt     # Python dependencies
├── frontend/                 # React 19 + TypeScript + Vite Client
│   ├── src/
│   │   ├── components/      # Sidebar, headers, visual components
│   │   ├── context/         # AuthContext & session state
│   │   ├── pages/           # 24 Clinical & Analytical Web Pages
│   │   └── App.tsx          # Router layout & route protection guards
├── ml/                       # Machine Learning & Explainability Engines
│   ├── trainer.py           # 5-fold CV & estimator training
│   ├── evaluator.py         # Multi-metric evaluation & confusion matrices
│   └── explainability.py    # TreeSHAP & LinearSHAP implementations
├── signal_processing/        # Biomedical Signal Processing Engine
│   ├── filtering.py         # Zero-phase Butterworth & 50 Hz Notch filters
│   └── features.py          # Pan-Tompkins QRS detector & HRV analysis
├── research_assistant/       # Evidence-Grounded Biomedical RAG
│   └── rag_engine.py        # Hierarchical chunking & TF-IDF retrieval
├── datasets/                 # Preloaded Datasets & Research Papers
├── docs/                     # In-Depth System & Literature Documentation
├── tests/                    # Automated Pytest Test Suite
├── Project_Details.md        # Complete Technical & Mathematical Specification
└── README.md                 # Project Overview & Quickstart Guide
```

---

## ⚠️ Academic & Clinical Disclaimer

> **IMPORTANT CLINICAL NOTICE:**  
> **MedInsight AI is an academic and research-oriented software platform.** It provides data-driven analytical insights, digital signal processing, and model-generated predictions using biomedical datasets. It is **not** a certified medical diagnostic system, does not replace qualified healthcare professionals, and should not be used as the sole basis for clinical diagnosis, patient management, or medication prescription.

---

## 🏷️ Project Attribution

* **Engineering & Research Organization:** **BioIntelliX**  
* **Project Leadership:** Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**)  
* **Platform:** **MedInsight AI** — *From Biomedical Data to Intelligent Insight.*

## BioIntelliX — DEVELOPMENT & RESEARCH TEAM

**Satyam Kumar Shrivastav — 730923201101 (B.Tech – AI&DS)**

**Prasanna Vengatesh — 730923201087 (B.Tech – AI&DS)**

**Elakiya N — 730923121012 (B.E – BME)**

**Deepa V — 730923121006 (B.E – BME)**
<img width="704" height="258" alt="image" src="https://github.com/user-attachments/assets/282d1112-849e-42f7-922b-ef063f9f9cdb" />

