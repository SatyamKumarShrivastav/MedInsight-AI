# MedInsight AI — Machine Learning Pipeline & Explainability Guide
**BioIntelliX | Team led by Mr. S. K. Shrivastav**  
*From Biomedical Data to Intelligent Insight.*

---

## 1. Machine Learning Architectural Lifecycle

The machine learning subsystem in MedInsight AI is built to avoid common academic and clinical AI pitfalls, particularly **data leakage**, **uncalibrated risk estimation**, and **black-box unexplainability**.

```
Dataset Selection
       │
       ▼
Target & Feature Validation
       │
       ▼
Stratified Train/Test Partitioning (e.g., 80/20)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
Training Set                      Test Holdout Set
  │                                 │
  ▼                                 ▼
Fit Imputer & Scaler              Transform using fitted Scaler
  │                                 │
  ▼                                 │
Fit Estimator (5-fold CV)           │
  │                                 │
  ▼                                 ▼
Model Evaluation Metrics (Accuracy, Precision, Recall, F1, ROC-AUC, CM)
       │
       ▼
SHAP Feature Importance & Attribution
       │
       ▼
Model Persistence (.joblib) & Registry Audit
```

---

## 2. Leakage-Free Preprocessing

All feature scaling (`StandardScaler`), median imputation (`SimpleImputer`), and categorical encoding (`LabelEncoder`) parameters are strictly fitted on the training split only and applied downstream to the test split and inference vectors.

---

## 3. Supported Estimator Families

### 3.1 Classification
1. **Random Forest Classifier**: Ensemble of bagging decision trees; robust to non-linear biomedical feature interactions.
2. **Logistic Regression (L2 / ElasticNet)**: Standard clinical baseline offering direct log-odds interpretations.
3. **Support Vector Machine (SVM, RBF Kernel)**: Maximum-margin separation with Platt scaling probability estimation.
4. **K-Nearest Neighbors (KNN)**: Non-parametric instance-based comparison.
5. **XGBoost & LightGBM**: Optimized gradient boosting decision trees with early stopping.

### 3.2 Regression
1. **Random Forest Regressor**
2. **Linear Regression**
3. **Gradient Boosting Regressor**

---

## 4. Evaluation Metrics & Balancing

MedInsight AI rejects accuracy as a solitary benchmark for imbalanced biomedical cohorts (e.g., disease prevalence < 10%). It enforces:
- **Weighted F1-Score**: Harmonic mean of precision and recall.
- **ROC-AUC & Precision-Recall Curves**: Threshold-independent discriminative evaluation.
- **Confusion Matrix**: Quantitative visualization of False Positives (Type I error) and False Negatives (Type II error).

---

## 5. Explainable AI (XAI) Implementation

### 5.1 Global Feature Importance
Derived from Gini impurity reduction in tree models or normalized absolute weight magnitudes in generalized linear models.

### 5.2 Local Instance Explanation (SHAP)
- **TreeSHAP**: Exact polynomial-time computation of Shapley values for tree ensembles.
- **LinearSHAP**: Feature-weighted coefficients centered on baseline background means.
- **Visual Display**: Bi-directional signed contribution bars (Blue for risk elevation, Red for risk attenuation).

> **Academic Limitation Caveat**: Feature attributions characterize internal model decision mechanics on training distributions. They do not prove biological cause and effect.
