# MedInsight AI — System Architecture
**BioIntelliX | Team led by Mr. S. K. Shrivastav**  
*From Biomedical Data to Intelligent Insight.*

---

## 1. High-Level Architectural Overview

MedInsight AI is an academic and research-oriented software platform engineered to transform raw biomedical data streams into explainable, reproducible clinical decision-support insights. It integrates data science, digital signal processing, machine learning, Explainable AI (SHAP), and hierarchical Retrieval-Augmented Generation (RAG).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Tier 1: Data Sources                            │
│  - Tabular Clinical Records (UCI Heart Disease, Diabetes, MIMIC-IV)     │
│  - Physiological Waveforms (ECG, EEG, EMG CSV formats)                 │
│  - Academic Literature (2025–2026 Reference Papers PDF / TXT)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Tier 2: Ingestion & Preprocessing                    │
│  - Data Quality Engine: Missingness, Duplicates, Constant Detection     │
│  - Signal Preprocessing: Zero-phase Butterworth, Notch, Median Baseline│
│  - Tabular Pipeline: Median Imputation, Categorical Encoding, Scaling   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Tier 3: Analytics, ML & XAI Core                     │
│  - Biomedical Analytics: Lipid profiles, glycemic index, blood pressure│
│  - Model Training: Random Forest, SVM, KNN, Logistic, XGBoost, LGBM   │
│  - Evaluation: Stratified CV, ROC-AUC, F1, Precision-Recall, MAE, R²   │
│  - Explainable AI: TreeSHAP, LinearSHAP, Perturbation Attribution      │
│  - Anomaly Detection: Isolation Forest, Local Outlier Factor           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Tier 4: Outputs, Applications & Research RAG               │
│  - Interactive Visualizations: Recharts histograms, heatmaps, ECG plot │
│  - Biomedical Research Assistant: Hierarchical RAG citation engine     │
│  - Report Generation: PDF (ReportLab), CSV, XLSX with disclaimers      │
│  - Role-Based Governance: ADMIN, RESEARCHER, STUDENT audit logs        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Subsystems

### 2.1 Web Presentation Layer (Frontend)
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS with custom dark clinical aesthetic (`#0b0f19` background, slate glassmorphic cards, cyan and electric blue highlights).
- **Navigation**: 24 responsive routes with role-based access control guards (`RequireAuth`, `RequireGuest`, `adminOnly`).
- **Visualizations**: Interactive SVG-rendered charts using Recharts for distribution plots, confusion matrices, ROC curves, feature importances, and ECG waveforms.

### 2.2 Application Services Layer (Backend)
- **Framework**: FastAPI (Python 3.13) with asynchronous event loops.
- **Schema Validation**: Pydantic v2 schemas for deterministic request/response serialization.
- **Security**: JWT authentication (HS256) with bcrypt password hashing and RBAC middleware.
- **Data Access**: SQLAlchemy 2.0 ORM with connection pooling, automatic database provisioning, and connection retry handling.

### 2.3 Biomedical Computing Engines
- **Biomedical Signal Processing (`signal_processing/`)**:
  - Filtering: Forward-backward `scipy.signal.filtfilt` for zero-phase distortion.
  - Baseline Wander Removal: Dual-stage median filtering (200 ms and 600 ms kernels).
  - QRS Detection: Pan-Tompkins inspired derivative-squaring-integration peak detection.
  - HRV Metrics: Time-domain SDNN, RMSSD, pNN50, and Welch Power Spectral Density bands (VLF, LF, HF).
- **Machine Learning Core (`ml/`)**:
  - Leakage Prevention: Transformers fitted strictly on training folds.
  - Hyperparameter Tuning: Configurable estimators with cross-validation.
  - Explainability: SHAP Tree and Linear explainers computing local feature attributions with signed contributions.
- **Biomedical Research Assistant (`research_assistant/`)**:
  - Hierarchical Chunking: Structural multi-level indexing (250 words per chunk with 50 words overlap).
  - Sparse Retrieval: TF-IDF vector matching across indexed academic literature.
  - Grounded Answering: Answers constrained to retrieved evidence passages with citation references.

### 2.4 Database Layer (MySQL)
- Relational schema deployed on MySQL 8.0 / MariaDB on `localhost:3306`.
- Tables: `users`, `datasets`, `dataset_columns`, `data_quality_reports`, `preprocessing_jobs`, `experiments`, `ml_models`, `model_metrics`, `predictions`, `anomaly_jobs`, `signal_analysis_jobs`, `research_documents`, `document_chunks`, `reports`, `activity_logs`.
- Controlled file storage in local directories (`uploads/`, `artifacts/`, `reports/`).

---

## 3. Security, Privacy & Research Boundaries

1. **Role Enforcement**: Authorization is verified on every backend API endpoint via `get_current_user` and `require_role`.
2. **Untrusted File Handling**: Sanitized filenames, extension whitelisting (`.csv`, `.xlsx`, `.pdf`, `.txt`), size limits (max 50 MB), and path traversal prevention.
3. **Medical Disclaimer**:
   > *“MedInsight AI is an academic and research-oriented software platform. It provides data-driven analytical and model-generated insights using biomedical datasets. It is not a medical diagnostic system, does not replace qualified healthcare professionals, and should not be used to make medical decisions.”*
4. **Project Credits**:
   - Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**).
