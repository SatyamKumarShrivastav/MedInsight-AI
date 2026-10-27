# MedInsight AI — Frontend Web Client
### React 19 + TypeScript + Vite + Tailwind CSS

**Platform:** MedInsight AI  
**Engineering & Research Organization:** **BioIntelliX**  
**Project Leadership:** Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**)  
**Tagline:** *From Biomedical Data to Intelligent Insight.*  

---

## 🔬 Overview

The **MedInsight AI Web Client** is a responsive single-page application (SPA) designed to provide a rich, dark-mode clinical dashboard experience. It connects to the FastAPI backend API to deliver interactive data profiling, digital signal processing, leakage-free machine learning workbench workflows, Explainable AI (SHAP) attributions, and evidence-grounded literature RAG synthesis.

---

## 🛠️ Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | `^19.3.1` | Core UI component model and reactive state |
| **TypeScript** | `~6.0.3` | End-to-end type safety and deterministic interfaces |
| **Vite** | `^8.3.5` | Fast build tool and Hot Module Replacement (HMR) |
| **Tailwind CSS** | `^3.4.17` | Utility-first clinical design system & dark aesthetics |
| **React Router** | `^7.6.3` | Client-side routing with role-guarded route trees |
| **Recharts** | `^2.15.3` | Dynamic SVG visualizations (ROC curves, confusion matrices, HRV spectra) |
| **Lucide React** | `^0.511.0` | Accessible clinical and analytical iconography |
| **Axios** | `^1.9.0` | HTTP client with automatic JWT bearer token injection |

---

## 🎨 Design System & Aesthetics

* **Color Palette**:
  * Canvas Background: Deep Clinical Slate (`#0b0f19`)
  * Surface Cards: Glassmorphic Slate (`#111827` / `#1e293b` with subtle borders `#334155`)
  * Accent & Brand: Electric Cyan (`#06b6d4`), Medical Teal (`#0d9488`), Royal Indigo (`#3b82f6`)
  * Risk Highlighting: Amber/Red (`#ef4444`) for risk escalation; Cyan/Emerald (`#10b981`) for protective factors
* **Typography**: Clean sans-serif hierarchy (Inter / system fonts) optimized for quantitative tabular data and telemetry.
* **Component Standards**: Consistent card padding, subtle micro-interactions, responsive side navigation, and interactive telemetry headers.

---

## 🧭 Page Routes & Access Control

The frontend application features **24 distinct routes** protected by client-side authentication guards (`RequireAuth`, `RequireGuest`):

```
/ (Landing Page — Feature showcase & citations)
├── /login (User Authentication)
├── /register (Self-Registration with institutional fields)
├── /forgot-password & /reset-password (Credential Recovery)
└── Protected Application Shell (/):
    ├── /dashboard (System Overview & Telemetry)
    ├── /profile (User Profile & Password Change Requests)
    ├── /datasets (Dataset Upload, Preview & Management)
    ├── /quality (Data Quality Profiling & Scoring)
    ├── /preprocessing (Leakage-Free Preprocessing Pipelines)
    ├── /eda (Exploratory Data Analysis & Distributions)
    ├── /biomedical-analytics (Lipid Panels, Glycemic Index, Blood Pressure)
    ├── /ml-workbench (Estimator Selection & 5-Fold CV Training)
    ├── /model-evaluation (ROC-AUC, PR Curves, Confusion Matrices)
    ├── /predictions (Real-Time Patient Inference Workspace)
    ├── /xai (SHAP Global & Local Risk Attributions)
    ├── /anomaly (Isolation Forest & LOF Outlier Detection)
    ├── /experiments (Experiment & Model Artifact Registry)
    ├── /signals (Biomedical Waveform DSP & HRV Analysis)
    ├── /research-assistant (Evidence-Grounded Literature RAG)
    ├── /documents (Document Library & Academic PDFs)
    ├── /reports (Publication PDF Report Generator)
    ├── /admin/users (CEO & Admin Governance Dashboard)
    ├── /activity (Forensic Activity Logs)
    └── /help (Platform Guide, Math Formulas & Disclaimers)
```

---

## 📁 Source Directory Structure

```
frontend/src/
├── api/
│   └── client.ts            # Axios instance with interceptors for JWT auth
├── assets/                  # Static media, icons, and illustrations
├── components/
│   ├── Header.tsx           # Global telemetry and user session bar
│   ├── Sidebar.tsx          # Role-aware collapsible navigation drawer
│   └── MetricCard.tsx       # Standardized KPI card component
├── context/
│   └── AuthContext.tsx      # Authentication state, login/logout, user claims
├── pages/                   # 24 Functional Page Modules
│   ├── AdminUsers.tsx       # CEO & Admin management dashboard
│   ├── AnomalyDetection.tsx # Isolation Forest / LOF visualizer
│   ├── BiomedAnalytics.tsx  # Clinical panels (lipids, glycemic index)
│   ├── Dashboard.tsx        # System status & quick actions
│   ├── DataQuality.tsx      # Missingness & schema diagnostics
│   ├── Datasets.tsx         # Ingestion & table viewer
│   ├── DocumentLibrary.tsx  # Academic document management
│   ├── EDA.tsx              # Correlation heatmaps & distributions
│   ├── Experiments.tsx      # ML model artifacts registry
│   ├── Help.tsx             # User guide, formulas & literature
│   ├── Landing.tsx          # Public presentation page
│   ├── Login.tsx            # Login with network validation
│   ├── MLWorkbench.tsx      # Estimator training workbench
│   ├── ModelEvaluation.tsx  # Multi-metric comparisons
│   ├── PredictionWorkspace.tsx # Interactive single-patient inference
│   ├── Preprocessing.tsx    # Pipeline visualizer
│   ├── Profile.tsx          # Account settings & password change requests
│   ├── Register.tsx         # Multi-field account registration
│   ├── Reports.tsx          # PDF report generator & downloads
│   ├── ResearchAssistant.tsx# Grounded literature Q&A with citations
│   ├── SignalAnalysis.tsx   # Waveform filtering, QRS & HRV analysis
│   └── XAIWorkspace.tsx     # SHAP local & global explanations
├── App.tsx                  # Lazy-loaded route definitions & guards
├── index.css                # Tailwind directives & dark clinical tokens
└── main.tsx                 # React DOM root initialization
```

---

## ⚡ Development & Build Scripts

### Install Dependencies
```powershell
cd frontend
npm install
```

### Run Local Development Server
```powershell
npm run dev
```
Starts the Vite dev server at `http://localhost:5173`.

### Production Build & Typecheck
```powershell
npm run build
```
Executes TypeScript compilation (`tsc -b`) and Vite production bundling. Emits optimized static assets to `dist/`.

### Preview Production Build
```powershell
npm run preview
```
Runs a local static web server to preview the built `dist/` bundle.

---

## 🧪 Build & Verification Status

```powershell
> tsc -b && vite build
✓ 2286 modules transformed.
dist/index.html                     0.45 kB
dist/assets/index-CcevngD_.css     46.01 kB
dist/assets/index-CuYkMc-y.js     335.74 kB
✓ built in 11.38s
```
* **Type Safety:** 100% strict TypeScript compliance with zero compilation errors.
* **Bundle Splitting:** Dynamic `React.lazy()` chunking ensuring sub-second route transitions.

---

## ⚠️ Academic & Clinical Disclaimer

> **NOTICE:** MedInsight AI is an academic and research-oriented software platform. It provides data-driven analytical insights, digital signal processing, and model-generated predictions using biomedical datasets. It is not a certified medical diagnostic system and should not be used as the sole basis for clinical diagnosis or prescription.

---

## 🏷️ Attribution

* **Engineering & Research Organization:** **BioIntelliX**  
* **Project Leadership:** Developed by **BioIntelliX** (Team led by **Mr. S. K. Shrivastav**)  
* **BioIntelliX | MedInsight AI — From Biomedical Data to Intelligent Insight.**
