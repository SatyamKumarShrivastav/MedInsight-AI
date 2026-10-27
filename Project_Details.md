# MedInsight AI — Complete Project Documentation & Technical Specification

**Platform Name:** MedInsight AI  
**Tagline:** *From Biomedical Data to Intelligent Insight.*  
**Engineering & Research Organization:** **BioIntelliX**  
**Project Leadership:** Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**)  
**Domain:** Academic & Research-Oriented Biomedical Data Science, Digital Signal Processing, Explainable Machine Learning (XAI), and Evidence-Grounded Biomedical Literature RAG  
**Target Repository:** `c:\Satyam101\Design Project\MedInsight AI`  

---

## 1. Executive Summary & Project Identity

**MedInsight AI** is an academic and research-oriented software platform engineered to transform raw biomedical datasets and physiological waveforms into reliable, explainable, and reproducible clinical decision-support insights.

Healthcare artificial intelligence frequently encounters four systemic barriers that limit clinical trust and research validity:
1. **The "Black-Box" Opacity Dilemma**: High predictive accuracy in machine learning models is frequently rendered clinically unusable because clinicians and researchers cannot interpret the underlying algorithmic decision mechanics.
2. **Data Leakage in Biomedical Pipelines**: Standard data preparation pipelines often fit imputers, normalizers, and scalers across the full dataset prior to train/test partitioning, artificially inflating evaluation scores and causing severe out-of-sample failure.
3. **Tooling Fragmentation**: Current research workflows require separate, unintegrated software stacks (e.g., MATLAB or LabVIEW for signal filtering, Jupyter notebooks for scikit-learn models, separate search engines for PubMed literature), which destroys auditability and workflow continuity.
4. **Generative Hallucinations in Medical NLP**: Commercial Large Language Models (LLMs) often hallucinate plausible-sounding but factually false medical assertions and fabricated citations when queried on clinical literature.

MedInsight AI resolves these challenges in a **unified, software-only architecture**:
* **Zero Hardware Requirement**: Operates entirely in software on uploaded digital waveforms (ECG, EEG, EMG) and clinical tabular datasets without requiring physical sensor boards, microcontrollers, or proprietary hardware.
* **Leakage-Free Preprocessing**: Employs strict scikit-learn pipelines where scaling, imputation, and encoding parameters are fitted strictly on training folds.
* **Transparent Explainability (XAI)**: Provides mathematically rigorous local instance explanations (TreeSHAP and LinearSHAP) and global feature importance rankings with signed directional contributions.
* **Evidence-Grounded Research Assistant**: Combines hierarchical document chunking, TF-IDF passage retrieval, and grounded answer synthesis strictly constrained to 2025–2026 peer-reviewed academic literature with verifiable DOIs and PMIDs.
* **Forensic Role Governance & Multi-Network Security**: Enforces granular Role-Based Access Control (RBAC), multi-network origin validation, a strict localhost-only policy for the CEO super-admin role, and immutable activity auditing.

---

## 2. End-to-End System Architecture

MedInsight AI is organized into a **4-tier layered architecture** ensuring clean separation of concerns, high throughput, and strict security boundaries.

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

## 3. Detailed Subsystem Specifications

### 3.1. Biomedical Data Management & Quality Profiling Subsystem
The data profiling module automatically scans uploaded datasets before ingestion into ML pipelines:
* **Missingness Diagnostics**: Calculates exact count and percentage of missing values per column. Detects high-missingness columns ($>40\%$) that threaten model reliability.
* **Duplicate Detection**: Identifies row-level duplicates to prevent synthetic over-representation of identical patient vectors.
* **Variance & Constant Detection**: Detects uninformative features with near-zero or zero variance.
* **Clinical Quality Score**: Aggregates missingness, duplicate rates, and schema integrity into an overall Health Score ($0–100\%$).
* **Automated Recommendations**: Generates rule-based clinical recommendations (e.g., suggesting median imputation for skewed numerical features, mode imputation for categorical data, or column removal).

### 3.2. Biomedical Signal Processing Engine (`signal_processing/`)
MedInsight AI contains a native digital signal processing (DSP) suite implemented in pure Python using `scipy.signal` and `numpy`:
* **Zero-Phase Digital Filtering**:
  * Employs 4th-order Butterworth bandpass filters applied forward and backward via `scipy.signal.filtfilt`. This mathematical formulation guarantees zero phase distortion ($0^\circ$ phase shift), preserving the exact timing and morphology of cardiac waves (P, Q, R, S, T).
  * Bandpass bandwidths: $0.5\text{ Hz} - 40.0\text{ Hz}$ for diagnostic ECG; $1.0\text{ Hz} - 70.0\text{ Hz}$ for EEG waveforms.
* **Power-Grid Notch Filtering**:
  * Digital Infinite Impulse Response (IIR) notch filter at $50\text{ Hz}$ (or $60\text{ Hz}$) with high quality factor ($Q = 30.0$) to eliminate electrical hum without degrading adjacent QRS spectral content.
* **Dual-Stage Median Baseline Wander Removal**:
  * Respiration and patient movement cause low-frequency baseline drift. MedInsight AI suppresses this artifact with a cascaded median filter:
    1. First pass ($200\text{ ms}$ window): Suppresses narrow QRS complexes and P-waves.
    2. Second pass ($600\text{ ms}$ window): Captures the underlying baseline drift contour.
    3. Subtracting the estimated baseline from the raw filtered signal yields a clean, isoelectric signal.
* **Pan-Tompkins QRS Detection Algorithm**:
  1. *Bandpass Filtering* ($5–15\text{ Hz}$) to maximize QRS energy relative to T-waves.
  2. *Five-Point Derivative* to emphasize the steep slope of the R-wave.
  3. *Squaring Operator* to make all data points positive and non-linearly amplify high-amplitude spikes.
  4. *Moving-Window Integration* to group individual spikes into energy envelopes.
  5. *Adaptive Dual-Thresholding* with a physiological refractory period of $300\text{ ms}$ to avoid double-counting tall T-waves.
* **Heart Rate Variability (HRV) Analysis**:
  * **Time-Domain Metrics**:
    * Mean Heart Rate ($\text{BPM} = 60000 / \text{mean\_RR\_ms}$)
    * Mean RR Interval ($\text{ms}$)
    * $\text{SDNN}$: Standard deviation of normal-to-normal RR intervals (overall autonomic regulation).
    * $\text{RMSSD}$: Root mean square of successive differences (parasympathetic/vagal modulation).
    * $\text{pNN50}$: Percentage of adjacent RR intervals differing by $>50\text{ ms}$.
  * **Frequency-Domain Metrics (Welch Power Spectral Density)**:
    * Very Low Frequency ($\text{VLF}$): $0.003 - 0.04\text{ Hz}$
    * Low Frequency ($\text{LF}$): $0.04 - 0.15\text{ Hz}$ (mixed sympathetic and parasympathetic activity)
    * High Frequency ($\text{HF}$): $0.15 - 0.40\text{ Hz}$ (respiratory sinus arrhythmia / vagal tone)
    * $\text{LF}/\text{HF}\text{ Ratio}$: Clinical index of sympathovagal balance.

### 3.3. Machine Learning & Predictive Modeling Workbench (`ml/`)
* **Leakage-Free Validation Architecture**:
  * Feature scaling (`StandardScaler`), median imputation (`SimpleImputer`), and label encoding are strictly fitted inside training partitions during stratified 5-fold cross-validation.
  * Validation and holdout test samples are strictly transformed using the parameters learned from the training split.
* **Supported Estimator Families**:
  * **Random Forest Classifier / Regressor**: Bagging ensemble of randomized decision trees; non-linear, robust to outliers and collinearity.
  * **Support Vector Machine (SVM)**: Maximum-margin hyperplane with Radial Basis Function (RBF) kernel and Platt scaling for calibrated posterior probabilities.
  * **Logistic Regression**: Standard clinical linear model with L2/ElasticNet regularization, providing interpretable log-odds coefficients.
  * **K-Nearest Neighbors (KNN)**: Distance-weighted instance-based classification.
  * **Extreme Gradient Boosting (XGBoost) & LightGBM**: State-of-the-art gradient boosted decision trees with histogram binning and early stopping.
* **Evaluation Metrics Beyond Accuracy**:
  * In imbalanced biomedical cohorts, raw accuracy can be misleading. MedInsight AI enforces:
    * **Weighted F1-Score**: Harmonic mean of precision and recall weighted by class support.
    * **ROC-AUC**: Threshold-independent measure of discriminative capacity.
    * **Precision-Recall AUC**: High-fidelity benchmark for severe class imbalance.
    * **Confusion Matrix**: Quantitative breakdown of Type I (False Positive) and Type II (False Negative) errors.
    * **Regression Metrics**: Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and $R^2$.

### 3.4. Explainable AI (XAI) Suite (`ml/explainability.py`)
MedInsight AI integrates SHAP (SHapley Additive exPlanations) grounded in cooperative game theory:
* **Global Feature Importance**:
  * Measures the mean absolute attribution across the entire cohort:
    $$\bar{I}_j = \frac{1}{N} \sum_{i=1}^N |\phi_j^{(i)}|$$
  * Ranks variables according to their global predictive influence.
* **Local Instance Attributions (TreeSHAP & LinearSHAP)**:
  * Deconstructs any individual patient prediction into an additive baseline plus feature contributions:
    $$f(x) = \phi_0 + \sum_{j=1}^M \phi_j(x)$$
  * **Signed Directional Attribution**: Distinguishes between factors that elevate patient risk ($\phi_j > 0$, highlighted in cyan/blue) and factors that reduce or protect against risk ($\phi_j < 0$, highlighted in amber/red).
* **Clinical Interpretability Safeguards**:
  * The system explicitly notes that SHAP attributions represent model decision dependencies and do not constitute direct biological or physiological causation.

### 3.5. Anomaly Detection Subsystem (`backend/app/api/v1/anomaly.py`)
* Detects atypical patient vectors, data corruption, and physiological outliers.
* **Algorithms**:
  * **Isolation Forest**: Isolates anomalies by randomly selecting a feature and randomly splitting value ranges; outliers require significantly fewer splits.
  * **Local Outlier Factor (LOF)**: Computes local density relative to $k$-nearest neighbors to identify isolated samples in multi-dimensional feature space.
* Produces normalized anomaly scores and assigns binary outlier labels for scientific inspection.

### 3.6. Biomedical Research Assistant & RAG Engine (`research_assistant/`)
* Built to eliminate hallucinations by anchoring responses to indexed peer-reviewed scientific literature:
  * **Hierarchical Document Chunking**: Scientific documents are tokenized into passages of $250\text{ words}$ with an overlap of $50\text{ words}$, preserving local contextual integrity.
  * **TF-IDF Passage Retrieval**: Queries are converted into term-frequency inverse-document-frequency vectors matching indexed document passages.
  * **Evidence-Grounded Synthesis**: Answers are synthesized directly from retrieved passages, complete with chunk IDs, relevance scores, paper titles, publication years, DOIs, and PMIDs.
  * **No Off-Target Hallucination**: If the query falls outside the indexed biomedical corpus, the engine declines to answer and indicates insufficient evidence.

### 3.7. Automated Scientific Report Generation (`reports/`)
* Generates publication-ready PDF reports using **ReportLab**:
  * Document header with platform identity, timestamp, and unique report hash.
  * Executive experiment summary and hyperparameter configurations.
  * Tabular evaluation metrics (Accuracy, F1, Precision, Recall, ROC-AUC).
  * High-resolution charts (Confusion Matrix, ROC Curve, SHAP Feature Importance).
  * Formal academic and clinical disclaimers.
* Provides one-click exports in CSV, XLSX, and JSON formats.

---

## 4. Role-Based Governance, Security & Multi-Network Policies

### 4.1. Role Hierarchy & Authority Matrix

| Role | Target Identity | Operational Capabilities | Governance & Security Constraints |
|---|---|---|---|
| **CEO** | **Satyam Kumar Shrivastav** (Super Administrator) | Complete platform authority; sets system-wide administrator limit; approves/rejects administrator appointments; approves/rejects admin password changes; access to all analytical, signal, ML, and XAI tools. | **Physical Localhost-Only Policy**: Login strictly permitted from `localhost` / `127.0.0.1`. Remote network links, LAN IP requests, or public tunnels are blocked with HTTP 403 Forbidden. Cannot be deleted or demoted. |
| **ADMIN** | Appointed System Administrators | User account activation/deactivation, role upgrades (up to Researcher), password reset approvals for standard users, access to global forensic activity logs. | Administrator quota is capped by the CEO. Password changes require CEO approval. Cannot modify, demote, or delete the CEO account. |
| **RESEARCHER** | Principal Investigators & Clinicians | Dataset ingestion, model training, XAI computations, signal processing, running anomaly detectors, creating PDF reports, querying Research Assistant. | Cannot manage user accounts, alter role assignments, or view administrative security configurations. |
| **STUDENT / CITIZEN / STAFF** | Trainees, Students, Observers | Read-only dataset exploration, pre-trained model inference workspace, literature browsing, platform help and documentation. | No access to model training pipelines, dataset deletion, or administration endpoints. |

### 4.2. Security Architecture & Safeguards
1. **Password Hashing**: Bcrypt encryption with individualized, cryptographically secure random salts.
2. **Stateless JWT Authentication**: HMAC-SHA256 tokens with configurable expiration (default: 24 hours).
3. **Two-Phase Password Reset & Approval Workflow**:
   * Users submit password change requests.
   * Standard user requests enter `PENDING_APPROVAL` status and require Administrator or CEO approval.
   * Administrator password change requests enter `PENDING_CEO_APPROVAL` status and require CEO authorization.
   * The CEO account updates credentials directly and immediately from localhost.
4. **Forensic Audit Logging (`activity_logs`)**:
   * Every security-relevant event (login, failed login, user promotion, password request, dataset upload, model training, inference) is permanently logged with user ID, action name, resource ID, IP address, and timestamp.
5. **File Upload Hardening**:
   * Filenames are sanitized with regex to remove directory traversal characters (`../`).
   * Strict MIME and file extension validation (`.csv`, `.xlsx`, `.pdf`, `.txt`).
   * Hard file size ceiling of $50\text{ MB}$ to protect system memory and disk space.

---

## 5. Technology Stack Summary

```
┌────────────────────────────────────────────────────────────────────────┐
│ FRONTEND (Web Presentation Layer)                                      │
│ React 19 • TypeScript • Vite • Tailwind CSS • Recharts • Lucide Icons │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ BACKEND (Application API Layer)                                        │
│ FastAPI (Python 3.11+) • Pydantic v2 • SQLAlchemy 2.0 • PyMySQL • JWT  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│ COMPUTING & ML ENGINES          │   │ PERSISTENCE & STORAGE            │
│ Scipy • NumPy • Pandas • SHAP   │   │ MySQL 8.0 / MariaDB (Port 3306) │
│ Scikit-Learn • XGBoost • LGBM   │   │ Local Isolated FS (uploads,      │
│ ReportLab (PDF Engine)          │   │ artifacts, reports)              │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

---

## 6. Complete Database Schema Breakdown (MySQL 8.0)

The relational database (`medinsight_ai`) contains **14 interconnected tables**:

```sql
-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('CEO', 'ADMIN', 'RESEARCHER', 'STUDENT', 'STAFF', 'CITIZEN') DEFAULT 'STUDENT',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    institution VARCHAR(255),
    department VARCHAR(255),
    degree_branch VARCHAR(255),
    address VARCHAR(500),
    country VARCHAR(100),
    identification_number VARCHAR(25),
    bio VARCHAR(1000),
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    pending_password_hash VARCHAR(255),
    pending_password_requested_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Datasets Table
CREATE TABLE datasets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(1000) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    row_count INT,
    column_count INT,
    file_size_bytes INT,
    dataset_type ENUM('TABULAR', 'SIGNAL', 'DOCUMENT') DEFAULT 'TABULAR',
    owner_id INT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 3. Dataset Columns Table
CREATE TABLE dataset_columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    column_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    missing_count INT DEFAULT 0,
    unique_count INT DEFAULT 0,
    mean_val FLOAT,
    std_val FLOAT,
    min_val FLOAT,
    max_val FLOAT,
    is_target BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- 4. Data Quality Reports Table
CREATE TABLE data_quality_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    quality_score FLOAT,
    missing_pct FLOAT DEFAULT 0.0,
    duplicate_count INT DEFAULT 0,
    total_issues INT DEFAULT 0,
    issues_json JSON,
    column_quality_json JSON,
    recommendations JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- 5. Preprocessing Jobs Table
CREATE TABLE preprocessing_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    config_json JSON,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    result_dataset_id INT,
    pipeline_path VARCHAR(1000),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- 6. Experiments Table
CREATE TABLE experiments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    dataset_id INT NOT NULL,
    user_id INT NOT NULL,
    task_type ENUM('CLASSIFICATION', 'REGRESSION') NOT NULL,
    target_column VARCHAR(255) NOT NULL,
    feature_columns JSON,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 7. ML Models Table
CREATE TABLE ml_models (
    id INT AUTO_INCREMENT PRIMARY KEY,
    experiment_id INT NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    hyperparams_json JSON,
    artifact_path VARCHAR(1000),
    pipeline_path VARCHAR(1000),
    feature_names JSON,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    training_duration_sec FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
);

-- 8. Model Metrics Table
CREATE TABLE model_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_id INT NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT,
    metric_json JSON,
    FOREIGN KEY (model_id) REFERENCES ml_models(id) ON DELETE CASCADE
);

-- 9. Predictions Table
CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_id INT NOT NULL,
    user_id INT NOT NULL,
    input_json JSON NOT NULL,
    output_json JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_id) REFERENCES ml_models(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 10. Prediction Explanations (SHAP) Table
CREATE TABLE prediction_explanations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prediction_id INT NOT NULL,
    method VARCHAR(50) DEFAULT 'SHAP',
    shap_values_json JSON,
    feature_importance_json JSON,
    base_value FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE
);

-- 11. Anomaly Jobs & Results Tables
CREATE TABLE anomaly_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    params_json JSON,
    feature_columns JSON,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    anomaly_count INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

CREATE TABLE anomaly_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    record_index INT NOT NULL,
    anomaly_score FLOAT,
    is_anomaly BOOLEAN DEFAULT FALSE,
    record_data JSON,
    FOREIGN KEY (job_id) REFERENCES anomaly_jobs(id) ON DELETE CASCADE
);

-- 12. Signal Analysis Jobs Table
CREATE TABLE signal_analysis_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dataset_id INT,
    file_path VARCHAR(1000),
    signal_type VARCHAR(50),
    sampling_rate FLOAT,
    config_json JSON,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    results_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- 13. Research Documents & Chunks Tables
CREATE TABLE research_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    authors VARCHAR(500),
    year INT,
    source VARCHAR(500),
    doi VARCHAR(255),
    file_path VARCHAR(1000) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    checksum VARCHAR(64),
    owner_id INT NOT NULL,
    status ENUM('UPLOADED', 'PROCESSING', 'READY', 'ERROR') DEFAULT 'UPLOADED',
    word_count INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE document_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    keywords JSON,
    page_number INT,
    FOREIGN KEY (document_id) REFERENCES research_documents(id) ON DELETE CASCADE
);

-- 14. Reports & Activity Logs Tables
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    experiment_id INT,
    user_id INT NOT NULL,
    report_type ENUM('PDF', 'CSV', 'XLSX') DEFAULT 'PDF',
    file_path VARCHAR(1000),
    content_json JSON,
    status ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 7. Frontend Architecture & Page Directory

The web client is built on **React 19 + TypeScript + Vite** with a responsive clinical dark aesthetic (`#0b0f19` canvas, slate glassmorphic surfaces, cyan and electric blue highlights) and contains 24 distinct routes:

* **Authentication & Profile Pages**:
  * `/`: Interactive landing page with feature walkthrough and research citations.
  * `/login`: JWT credential authentication with network origin checks.
  * `/register`: Self-registration with role selection and institutional profile fields.
  * `/forgot-password` & `/reset-password`: Security reset workflow.
  * `/profile`: Profile manager, institutional credentials, and password change request portal.
* **Core Analytics & Data Science**:
  * `/dashboard`: High-level system telemetry, active models, recent activities, and dataset counts.
  * `/datasets`: Ingestion manager, preview table, column summary, and upload interface.
  * `/quality`: Missingness analysis, duplicate counter, quality scoring, and automated cleanup tips.
  * `/preprocessing`: Visual workflow builder for median imputation, scaling, and encoding.
  * `/eda`: Exploratory Data Analysis with correlation heatmaps, box plots, and distribution histograms.
  * `/biomedical-analytics`: Domain-specific analytics (lipid panels, glycemic index, hypertension staging).
* **Machine Learning & Explainability**:
  * `/ml-workbench`: Estimator selection, hyperparameter tuning, and 5-fold CV training launcher.
  * `/model-evaluation`: Multi-metric comparison (F1, Precision, Recall, ROC-AUC) and confusion matrices.
  * `/predictions`: Real-time single-patient inference workspace with parameter sliders.
  * `/xai`: Interactive Explainable AI workspace displaying SHAP global importance and local risk attributions.
  * `/anomaly`: Outlier detector configuration and anomaly scatter plots.
  * `/experiments`: Comprehensive registry of all trained models and experimental iterations.
* **Biomedical Signal & Research NLP**:
  * `/signals`: Physiological waveform viewer, Butterworth/notch filter workbench, Pan-Tompkins QRS peak visualizer, and HRV spectrum charts.
  * `/research-assistant`: Grounded biomedical Q&A interface with evidence citation drawer.
  * `/documents`: Academic document repository for managing literature PDF and TXT files.
  * `/reports`: Publication report manager with PDF download links.
* **Governance & Administration**:
  * `/admin/users`: User management dashboard for CEO and Administrators (activation, role promotion, password approvals, admin quota slider).
  * `/activity`: Forensic audit log viewer with search, action filtering, and IP tracking.
  * `/help`: Clinical user guide, mathematical formulas, and literature bibliography.

---

## 8. Curated Biomedical Datasets & Preloaded Literature

### 8.1. Benchmark Datasets in Repository
* **`ptb_xl_12lead_ecg_sample.csv`**: Multichannel diagnostic ECG recordings from the PhysioNet PTB-XL database.
* **`mit_bih_arrhythmia_record100.csv`**: Classic PhysioNet MIT-BIH arrhythmia benchmark for validating R-peak detection and heart rate variability.
* **`eeg_motor_movement_imagery_sample.csv`**: Multichannel EEG recording for evaluating neural frequency bands and spectral power.
* **`mimic_iv_clinical_icu_cohort.csv`**: Critical care measurements (vitals, lab chemistries, Glasgow Coma Scale) from the MIMIC-IV database.
* **`uci_heart_disease_cleveland.csv`**: Gold-standard clinical cardiology cohort (age, sex, chest pain type, resting BP, serum cholesterol, ST depression).
* **`synthetic_diabetes.csv` & `synthetic_heart_disease.csv`**: Statistically calibrated synthetic cohorts preserving real clinical distributions without disclosing patient health information (PHI).

### 8.2. Core 2024–2026 Academic Literature References

1. **PubMed Reasoner: Dynamic Reasoning-based Retrieval for Evidence-Grounded Biomedical Question Answering (2026)**  
   *Zhang, Liu, and Murai — 64th Annual Meeting of the Association for Computational Linguistics (ACL 2026)*  
   *Contribution:* Guides the Biomedical Research Assistant's dynamic multi-hop query refinement and verifiable citation grounding.
2. **Holistic AI in Medicine: Improved Performance and Explainability (xHAIM) (2026)**  
   *Petridis et al. — npj Digital Medicine (Nature Publishing Group), 9(1):42*  
   *Contribution:* Informs MedInsight AI's unified multimodal architecture connecting signals, tabular cohorts, and literature.
3. **Transparency of Medical Artificial Intelligence Systems (2026)**  
   *Kim, Gadgil, and Lee — Nature Reviews Bioengineering, 4:112–129*  
   *Contribution:* Establishes standards for audit trails, risk calibration, and signed local feature attributions.
4. **Explainable ECG Analysis by Explicit Information Disentanglement With VAEs (2026)**  
   *van der Valk et al. — IEEE Transactions on Biomedical Engineering (TBME), 73(4):1120–1132*  
   *Contribution:* Informs the isolation of physiological morphology from baseline wander and high-frequency noise.
5. **The Cost of Explainability in AI-Enhanced ECG Models (2025)**  
   *Patlatzoglou et al. — npj Digital Medicine, 8:145*  
   *Contribution:* Directs the dual deployment of high-capacity models (XGBoost/LightGBM) with post-hoc Shapley value decomposition.
6. **Hierarchical RAG Enhances a Pharmacogenomic AI Assistant in Guideline Related Queries (2026)**  
   *Jeon et al. — Computers in Biology and Medicine, 185:109842*  
   *Contribution:* Informs the two-tier hierarchical chunking and retrieval pipeline in the Research Assistant.
7. **CLEAR: An Auditable Foundation Model for Radiology Grounded in Clinical Concepts (2026)**  
   *Han et al. — Nature Biomedical Engineering*  
   *Contribution:* Informs the concept-grounded explanation strategy across predictive models.
8. **Foundational Methodological Reviews (2023–2024)**:
   * *Taipalus et al. (2023)*, *SN Computer Science* (Tertiary study on clinical data analytics).
   * *Kolasa et al. (2024)*, *Expert Rev. Pharmacoecon.* (Meta-review of 10,462 ML algorithms identifying data leakage pitfalls).
   * *Mehta et al. (2019)*, *J. Biomed. Inform.* (Systematic mapping of healthcare AI workflow fragmentation).
   * *Wasimuddin et al. (2020)*, *IEEE Access* (Four-stage ECG signal processing standard).

---

## 9. Verification & Automated Test Suite

MedInsight AI includes an automated testing suite using `pytest` and `fastapi.testclient`:

```powershell
python -m pytest tests -v
```

### Test Suite Structure & Verification Coverage:
* **`tests/test_auth_and_rbac.py`**:
  * User registration validation and role enforcement.
  * JWT issuance and signature verification.
  * Strict blocking of the CEO account from external network headers and tunnels (HTTP 403 Forbidden).
  * CEO direct password change vs. standard user password approval queue.
* **`tests/test_quality_and_preprocessing.py`**:
  * Missing value profiling, variance checks, and duplicate detection.
  * Leakage-free preprocessing pipeline execution.
* **`tests/test_signal_processing.py`**:
  * Butterworth zero-phase filter response.
  * 50 Hz notch filter attenuation.
  * Dual median baseline wander removal.
  * Pan-Tompkins QRS peak detection accuracy on benchmark ECG traces.
  * SDNN, RMSSD, pNN50, and Welch PSD frequency band calculations.
* **`tests/test_ml_and_xai.py`**:
  * Classification and regression estimator execution.
  * Stratified 5-fold cross-validation convergence.
  * TreeSHAP and LinearSHAP local attribution generation.
  * Anomaly detection via Isolation Forest and LOF.
* **`tests/test_research_assistant_and_rag.py`**:
  * Hierarchical document chunking and keyword indexing.
  * TF-IDF sparse similarity scoring.
  * Grounded answer synthesis and source excerpt attachment.
* **`tests/test_api_endpoints.py`**:
  * REST API contract verification across all application endpoints.

---

## 10. Quickstart & Deployment Guide

### 10.1. Prerequisites
* Python 3.11+
* Node.js 18+ (with npm)
* MySQL Server 8.0 on `localhost:3306`

### 10.2. Environment Configuration
Create a `.env` file in the project root:
```ini
# Application Configuration
APP_NAME="MedInsight AI"
APP_VERSION="1.0.0"
DEBUG=False

# Database (MySQL 8.0)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=medinsight_ai

# Security & Tokens
SECRET_KEY=CHANGE-THIS-TO-A-STRONG-RANDOM-SECRET-IN-PRODUCTION
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
Set the `MEDINSIGHT_*_PASSWORD` values in `.env` to distinct, strong values before running any seed scripts. See `.env.example` for the required variable names.

### 10.3. Backend Setup & Database Seeding
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

### 10.4. Frontend Setup & Launch
```powershell
cd ..\frontend
npm install
npm run dev
```
* Web Application Interface: `http://localhost:5173`

### 10.5. Seeded Account Configuration

| Role | Email | Credential Setup | Permissions & Scope |
|---|---|---|---|
| **CEO** | `ceo@medinsight.ai` | `Set MEDINSIGHT_CEO_PASSWORD in .env` | Super Administrator (Satyam Kumar Shrivastav). Full platform control. Localhost console only. |
| **ADMIN** | `admin@medinsight.ai` | `Set MEDINSIGHT_ADMIN_PASSWORD in .env` | System Administrator. User management, activity logs, standard password approvals. |
| **RESEARCHER** | `researcher@medinsight.ai` | `Set MEDINSIGHT_RESEARCHER_PASSWORD in .env` | Principal Investigator. Model training, XAI, signal processing, report generation. |
| **STUDENT** | Self-registered | User-defined | Trainee / Student. Inference workspace, dataset browsing, literature search. |

---

## 11. Academic & Clinical Disclaimer

> **IMPORTANT CLINICAL NOTICE:**  
> **MedInsight AI is an academic and research-oriented software platform.** It provides data-driven analytical insights, digital signal processing, and model-generated predictions using biomedical datasets. It is **not** a certified medical diagnostic system, does not replace qualified healthcare professionals, and should not be used as the sole basis for clinical diagnosis, patient management, or medication prescription.

---

## 12. Project Attribution

* **Engineering & Research Organization:** **BioIntelliX**
* **Project Leadership:** Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**)
* **Repository Path:** `c:\Satyam101\Design Project\MedInsight AI`
* **Motto:** *“From Biomedical Data to Intelligent Insight.”*
