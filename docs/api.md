# MedInsight AI — REST API Documentation
**BioIntelliX | Team led by Mr. S. K. Shrivastav**  
*From Biomedical Data to Intelligent Insight.*

---

## Base URL & Authentication
- **Base URL**: `http://localhost:8000/api/v1`
- **Interactive Documentation**: `http://localhost:8000/api/docs` (Swagger UI) / `http://localhost:8000/api/redoc` (ReDoc)
- **Authentication**: JWT Bearer token via `Authorization: Bearer <token>` header.

---

## 1. Authentication & Session Management (`/auth`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/auth/register` | POST | Public | Register new user account (`STUDENT` role by default; direct CEO/ADMIN registration is blocked). |
| `/auth/login` | POST | Public | Authenticate user credentials and return JWT token. **Enforces CEO Localhost-Only policy** (blocks external tunnel/LAN IP origins with 403 Forbidden). |
| `/auth/me` | GET | Authenticated | Retrieve authenticated user profile, institutional details, and role. |
| `/auth/me` | PUT | Authenticated | Update full name, institution, department, degree branch, address, country, and bio. |
| `/auth/request-password-change` | POST | Authenticated | Submit password change request. CEO changes apply immediately; Admin requests queue for CEO approval; User requests queue for Admin/CEO approval. |
| `/auth/forgot-password` | POST | Public | Request a password reset token. |
| `/auth/reset-password` | POST | Public | Reset password using a valid reset token. |
| `/auth/me` | DELETE | Authenticated | Permanently delete caller's account (the Super Admin CEO account cannot be deleted). |

---

## 2. Dataset Management (`/datasets`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/datasets/upload` | POST | RESEARCHER / ADMIN / CEO | Upload CSV or XLSX dataset (multipart/form-data, $\le 50\text{ MB}$). |
| `/datasets/` | GET | Authenticated | List all accessible datasets with row and column counts. |
| `/datasets/{id}` | GET | Authenticated | Retrieve dataset metadata, statistics, and column inventory. |
| `/datasets/{id}/columns` | GET | Authenticated | Retrieve column dtypes, missing counts, and summary statistics. |
| `/datasets/{id}/preview` | GET | Authenticated | Preview first $N$ rows (default: 20 rows). |
| `/datasets/{id}/download` | GET | Authenticated | Download original dataset file with traversal protection. |
| `/datasets/{id}` | DELETE | Owner / ADMIN / CEO | Delete dataset record and associated file storage. |

---

## 3. Data Quality Engine (`/quality`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/quality/{id}/run` | POST | Authenticated | Execute automated data quality assessment (missingness, duplicates, variance, quality score). |
| `/quality/{id}/history` | GET | Authenticated | Retrieve historical quality reports and recommendations for dataset. |

---

## 4. Preprocessing Pipelines (`/preprocessing`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/preprocessing/{id}/run` | POST | RESEARCHER / ADMIN / CEO | Configure and execute median imputation, standard scaling, and categorical encoding. |
| `/preprocessing/{id}/history` | GET | Authenticated | Retrieve transformation pipeline runs and generated dataset artifacts. |

---

## 5. Exploratory Data Analysis & Biomedical Analytics (`/eda`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/eda/{id}/summary` | GET | Authenticated | Full statistical summary (mean, std, quartiles, skewness) per feature. |
| `/eda/{id}/correlation` | GET | Authenticated | Pearson / Spearman correlation matrix for numeric columns. |
| `/eda/{id}/distribution` | GET | Authenticated | Histogram binning and kernel density values for specified column. |
| `/eda/{id}/scatter` | GET | Authenticated | 2D scatter coordinates for paired feature exploration. |
| `/eda/{id}/biomedical-summary` | GET | Authenticated | Specialized clinical aggregations (lipid panels, glycemic index, hypertension staging). |

---

## 6. Machine Learning Workbench (`/ml`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/ml/train` | POST | RESEARCHER / ADMIN / CEO | Train classifier/regressor (Random Forest, SVM, KNN, Logistic, XGBoost, LightGBM) with 5-fold CV. |
| `/ml/models` | GET | Authenticated | List trained models, hyperparameters, and evaluation metrics. |
| `/ml/models/{id}` | GET | Authenticated | Retrieve model details, serialized artifact paths, and feature names. |
| `/ml/experiments` | GET | Authenticated | List all experimental training sessions and runs. |
| `/ml/compare` | GET | Authenticated | Benchmark comparison of multiple models across F1, ROC-AUC, Precision, and Recall. |

---

## 7. Prediction & Explainability (`/predictions` & `/xai`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/predictions/predict` | POST | Authenticated | Generate inference output from input feature dictionary. |
| `/predictions/history` | GET | Authenticated | Retrieve recent prediction audit records. |
| `/xai/explain` | POST | Authenticated | Generate local SHAP feature contributions ($\phi_i$) for single-patient predictions. |
| `/xai/global-importance/{id}` | GET | Authenticated | Retrieve global feature importance ranking for trained model. |

---

## 8. Anomaly Detection (`/anomaly`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/anomaly/{id}/run` | POST | RESEARCHER / ADMIN / CEO | Run Isolation Forest or Local Outlier Factor (LOF) on feature vectors. |
| `/anomaly/{id}/results` | GET | Authenticated | Retrieve candidate anomalous records, scores, and outlier flags. |

---

## 9. Biomedical Signal Analysis (`/signals`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/signals/analyze` | POST | Authenticated | Process ECG/EEG waveforms: zero-phase Butterworth, 50 Hz notch, dual-median baseline removal, Pan-Tompkins QRS, and time/frequency HRV. |
| `/signals/jobs` | GET | Authenticated | List previous signal processing runs and derived metrics. |

---

## 10. Research Assistant & Document Library (`/documents`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/documents/upload` | POST | RESEARCHER / ADMIN / CEO | Upload PDF or TXT research paper into the library. |
| `/documents/` | GET | Authenticated | List all indexed research documents with metadata. |
| `/documents/{id}/summary` | GET | Authenticated | Retrieve document abstract excerpt and extracted top keywords. |
| `/documents/{id}/ask` | POST | Authenticated | Query document via hierarchical RAG with source chunk excerpts and citations. |
| `/documents/{id}` | DELETE | Owner / ADMIN / CEO | Delete research paper and cascade-delete indexed chunks. |

---

## 11. Reports & Platform Governance (`/reports`, `/admin`, `/activity`, `/dashboard`)

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/dashboard/summary` | GET | Authenticated | Real-time system counts, active model telemetry, and recent events. |
| `/reports/generate` | POST | RESEARCHER / ADMIN / CEO | Compile publication-ready PDF (ReportLab), CSV, or XLSX research report. |
| `/reports/` | GET | Authenticated | List generated reports with download links. |
| `/reports/{id}/download` | GET | Authenticated | Download compiled research report artifact. |
| `/admin/governance` | GET | ADMIN / CEO | Inspect platform governance quotas, admin statistics, and CEO identity. |
| `/admin/max-admins` | POST | CEO Only | Configure maximum allowed system administrators. |
| `/admin/users` | GET | ADMIN / CEO | List users (ordered CEO first, then Administrators, then standard users). |
| `/admin/users/{user_id}` | GET | ADMIN / CEO | Retrieve specific user account details. |
| `/admin/users/{user_id}` | PUT | ADMIN / CEO | Update user profile or promote role (CEO account can only be updated by the CEO; only 1 CEO can exist). |
| `/admin/users/{user_id}/approve-password` | POST | ADMIN / CEO | Approve pending password change request (Admin password changes require CEO authorization). |
| `/admin/users/{user_id}/reject-password` | POST | ADMIN / CEO | Reject pending password change request. |
| `/admin/users/{user_id}/activate` | POST | ADMIN / CEO | Toggle user active/inactive status (CEO account cannot be deactivated). |
| `/admin/users/{user_id}` | DELETE | ADMIN / CEO | Permanently delete user account (CEO account cannot be deleted). |
| `/activity/` | GET | ADMIN / CEO | Query complete immutable forensic audit log with filtering. |
| `/api/health` | GET | Public | Healthcheck endpoint returning application version and BioIntelliX team metadata. |

---

## ⚠️ Academic & Clinical Disclaimer

> **NOTICE:** MedInsight AI is an academic and research-oriented software platform. It provides data-driven analytical insights, digital signal processing, and model-generated predictions using biomedical datasets. It is not a certified medical diagnostic system and should not be used as the sole basis for clinical diagnosis or prescription.

---

## 🏷️ Attribution

* **Engineering & Research Organization:** **BioIntelliX**  
* **Project Leadership:** Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**)  
* **BioIntelliX | MedInsight AI — From Biomedical Data to Intelligent Insight.**
