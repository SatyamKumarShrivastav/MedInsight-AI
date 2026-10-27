# MedInsight AI — Testing & Quality Assurance Guide
**BioIntelliX | Team led by Mr. S. K. Shrivastav**  
*From Biomedical Data to Intelligent Insight.*

---

## 1. Automated Testing Strategy

MedInsight AI enforces automated test validation spanning unit logic, end-to-end analytical pipelines, and REST API integration endpoints.

---

## 2. Test Suite Structure

```
tests/
├── conftest.py                       # Shared test fixtures, auth tokens, sample data
├── test_auth_and_rbac.py             # Password hashing, JWT lifecycle, RBAC enforcement
├── test_signal_processing.py         # Filtering, Welch PSD, Pan-Tompkins QRS, HRV metrics
├── test_ml_and_xai.py                # Estimator fit, classification/regression metrics, SHAP
├── test_quality_and_preprocessing.py # Missingness, duplicate detection, quality score calculation
├── test_research_assistant_and_rag.py# Document chunking, keyword extraction, TF-IDF search
└── test_api_endpoints.py             # FastAPI REST endpoints integration via TestClient
```

---

## 3. Running the Test Suite

```powershell
# From project root directory
python -m pytest tests -v
```

### Verified Test Matrix (100% Passing)
```
tests/test_api_endpoints.py::test_list_datasets_authenticated             PASSED
tests/test_api_endpoints.py::test_list_research_documents_authenticated    PASSED
tests/test_api_endpoints.py::test_research_document_summary               PASSED
tests/test_api_endpoints.py::test_research_assistant_ask_query            PASSED
tests/test_api_endpoints.py::test_dashboard_metrics                       PASSED
tests/test_api_endpoints.py::test_activity_logs_admin                     PASSED
tests/test_auth_and_rbac.py::test_password_hashing                        PASSED
tests/test_auth_and_rbac.py::test_jwt_token_generation_and_decoding       PASSED
tests/test_auth_and_rbac.py::test_invalid_token_handling                  PASSED
tests/test_auth_and_rbac.py::test_api_health_endpoint                     PASSED
tests/test_auth_and_rbac.py::test_unauthorized_access_rejection           PASSED
tests/test_auth_and_rbac.py::test_admin_route_forbidden_for_researcher   PASSED
tests/test_ml_and_xai.py::test_estimator_instantiation                   PASSED
tests/test_ml_and_xai.py::test_pipeline_training_and_cross_validation     PASSED
tests/test_ml_and_xai.py::test_classification_metrics_calculation        PASSED
tests/test_ml_and_xai.py::test_regression_metrics_calculation            PASSED
tests/test_ml_and_xai.py::test_global_feature_importance                  PASSED
tests/test_ml_and_xai.py::test_shap_single_prediction_explanation         PASSED
tests/test_quality_and_preprocessing.py::test_data_quality_missing_and_duplicates PASSED
tests/test_quality_and_preprocessing.py::test_data_quality_clean_dataset  PASSED
tests/test_research_assistant_and_rag.py::test_keyword_extraction         PASSED
tests/test_research_assistant_and_rag.py::test_hierarchical_chunking      PASSED
tests/test_research_assistant_and_rag.py::test_tfidf_document_search_and_retrieval PASSED
tests/test_research_assistant_and_rag.py::test_evidence_grounded_answer_synthesis PASSED
tests/test_signal_processing.py::test_bandpass_and_notch_filtering       PASSED
tests/test_signal_processing.py::test_baseline_wander_removal             PASSED
tests/test_signal_processing.py::test_signal_normalization               PASSED
tests/test_signal_processing.py::test_time_domain_feature_extraction     PASSED
tests/test_signal_processing.py::test_frequency_domain_spectral_analysis  PASSED
tests/test_signal_processing.py::test_r_peak_detection_and_hrv           PASSED

======================= 30 passed in 11.75s =======================
```
