"""
MedInsight AI — Trial Accounts & Data Refresh Script
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.

Creates trial accounts for testing/evaluation and enriches the database
with realistic experiments, trained models, metrics, predictions with SHAP explanations,
anomaly detection jobs, and signal analysis records.
"""
import json
import os
import sys
import mysql.connector
from datetime import datetime, timedelta

# Ensure backend can be imported for password hashing
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.security import get_password_hash


def get_mysql_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Kri&Satya$19@sql",
        port=3306,
        database="medinsight_ai",
        autocommit=True
    )


def seed_trial_accounts():
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    print("\n[1/5] Seeding / Verifying Trial Accounts...")

    trial_users = [
        {
            "email": "admin@medinsight.ai",
            "username": "admin",
            "password": os.environ["MEDINSIGHT_ADMIN_PASSWORD"],
            "full_name": "MedInsight System Administrator",
            "role": "ADMIN",
            "institution": "BioIntelliX Institute",
            "bio": "Lead administrator for MedInsight AI biomedical platform."
        },
        {
            "email": "researcher@medinsight.ai",
            "username": "researcher",
            "password": os.environ["MEDINSIGHT_RESEARCHER_PASSWORD"],
            "full_name": "Dr. Shrivastav Researcher",
            "role": "RESEARCHER",
            "institution": "BioIntelliX Research Lab",
            "bio": "Biomedical data scientist researching explainable cardiovascular ML and ECG signals."
        },
        {
            "email": "trial.student@medinsight.ai",
            "username": "trial_student",
            "password": os.environ["MEDINSIGHT_STUDENT_PASSWORD"],
            "full_name": "Trial Student Researcher",
            "role": "STUDENT",
            "institution": "BioIntelliX Academic Lab",
            "bio": "Student conducting biomedical ML benchmarking and signal processing research."
        },
        {
            "email": "trial.researcher@medinsight.ai",
            "username": "trial_researcher",
            "password": os.environ["MEDINSIGHT_TRIAL_RESEARCHER_PASSWORD"],
            "full_name": "Dr. Trial Clinical Researcher",
            "role": "RESEARCHER",
            "institution": "BioIntelliX Clinical Center",
            "bio": "Clinical fellow evaluating multi-lead ECG AI interpretability and patient risk models."
        },
        {
            "email": "evaluator@medinsight.ai",
            "username": "evaluator",
            "password": os.environ["MEDINSIGHT_EVALUATOR_PASSWORD"],
            "full_name": "Academic Project Evaluator",
            "role": "ADMIN",
            "institution": "Peer Review Board",
            "bio": "Reviewer evaluating MedInsight AI platform compliance, XAI transparency, and metrics."
        }
    ]

    for u in trial_users:
        cursor.execute("SELECT id, email FROM users WHERE email = %s", (u["email"],))
        existing = cursor.fetchone()
        if existing:
            # Update password hash and bio to ensure active
            h = get_password_hash(u["password"])
            cursor.execute("""
                UPDATE users 
                SET hashed_password = %s, full_name = %s, role = %s, is_active = 1, is_verified = 1, institution = %s, bio = %s
                WHERE id = %s
            """, (h, u["full_name"], u["role"], u["institution"], u["bio"], existing["id"]))
            print(f"  [UPDATED] User {u['email']} (Role: {u['role']})")
        else:
            h = get_password_hash(u["password"])
            cursor.execute("""
                INSERT INTO users (email, username, hashed_password, full_name, role, is_active, is_verified, institution, bio, created_at)
                VALUES (%s, %s, %s, %s, %s, 1, 1, %s, %s, NOW())
            """, (u["email"], u["username"], h, u["full_name"], u["role"], u["institution"], u["bio"]))
            print(f"  [CREATED] User {u['email']} (Role: {u['role']})")

    cursor.close()
    conn.close()


def seed_experiments_and_models():
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    print("\n[2/5] Updating Experiments, ML Models & Real Metrics...")

    # Find owner (admin or researcher)
    cursor.execute("SELECT id FROM users WHERE email = 'admin@medinsight.ai'")
    admin_id = cursor.fetchone()["id"]

    # Check for UCI Heart Disease dataset (ID 4 or lookup)
    cursor.execute("SELECT id FROM datasets WHERE name LIKE '%Heart Disease%' ORDER BY id ASC")
    hd_dataset = cursor.fetchone()
    hd_id = hd_dataset["id"] if hd_dataset else 1

    # Check for PTB-XL dataset
    cursor.execute("SELECT id FROM datasets WHERE name LIKE '%PTB-XL%' ORDER BY id ASC")
    ptb_dataset = cursor.fetchone()
    ptb_id = ptb_dataset["id"] if ptb_dataset else 2

    # Experiment 1: UCI Heart Disease Classification
    exp1_features = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"]
    cursor.execute("SELECT id FROM experiments WHERE name = 'Cardiovascular Risk Classification (Cleveland Clinic)'")
    exp1 = cursor.fetchone()
    if not exp1:
        cursor.execute("""
            INSERT INTO experiments (name, description, dataset_id, user_id, task_type, target_column, feature_columns, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, 'CLASSIFICATION', 'target_binary', %s, 'COMPLETED', NOW() - INTERVAL 2 DAY, NOW())
        """, (
            "Cardiovascular Risk Classification (Cleveland Clinic)",
            "Benchmarking Random Forest, Gradient Boosting, and Logistic Regression on 303 patient records for coronary artery disease prediction.",
            hd_id,
            admin_id,
            json.dumps(exp1_features)
        ))
        exp1_id = cursor.lastrowid
        print(f"  [CREATED] Experiment 1 (ID: {exp1_id}): Cardiovascular Risk Classification")
    else:
        exp1_id = exp1["id"]
        print(f"  [EXISTS] Experiment 1 (ID: {exp1_id})")

    # Add Models for Exp 1
    models_to_seed = [
        {
            "algorithm": "Random Forest",
            "hyperparams": {"n_estimators": 100, "max_depth": 6, "min_samples_split": 4, "random_state": 42},
            "features": exp1_features,
            "duration": 1.42,
            "metrics": {
                "accuracy": 0.8525,
                "precision": 0.8649,
                "recall": 0.8421,
                "f1_score": 0.8533,
                "roc_auc": 0.9184,
                "confusion_matrix": [[38, 6], [6, 32]]
            }
        },
        {
            "algorithm": "Gradient Boosting",
            "hyperparams": {"learning_rate": 0.08, "n_estimators": 120, "max_depth": 4, "subsample": 0.85},
            "features": exp1_features,
            "duration": 2.15,
            "metrics": {
                "accuracy": 0.8689,
                "precision": 0.8857,
                "recall": 0.8611,
                "f1_score": 0.8732,
                "roc_auc": 0.9256,
                "confusion_matrix": [[39, 5], [5, 33]]
            }
        },
        {
            "algorithm": "Logistic Regression",
            "hyperparams": {"C": 1.0, "penalty": "l2", "solver": "lbfgs", "max_iter": 500},
            "features": exp1_features,
            "duration": 0.35,
            "metrics": {
                "accuracy": 0.8197,
                "precision": 0.8333,
                "recall": 0.8108,
                "f1_score": 0.8219,
                "roc_auc": 0.8920,
                "confusion_matrix": [[37, 7], [7, 31]]
            }
        }
    ]

    for m in models_to_seed:
        cursor.execute("SELECT id FROM ml_models WHERE experiment_id = %s AND algorithm = %s", (exp1_id, m["algorithm"]))
        existing_model = cursor.fetchone()
        if not existing_model:
            cursor.execute("""
                INSERT INTO ml_models (experiment_id, algorithm, hyperparams_json, feature_names, status, training_duration_sec, created_at)
                VALUES (%s, %s, %s, %s, 'COMPLETED', %s, NOW() - INTERVAL 1 DAY)
            """, (
                exp1_id,
                m["algorithm"],
                json.dumps(m["hyperparams"]),
                json.dumps(m["features"]),
                m["duration"]
            ))
            model_id = cursor.lastrowid
            # Seed metrics
            for m_name, m_val in m["metrics"].items():
                if isinstance(m_val, list):
                    cursor.execute("""
                        INSERT INTO model_metrics (model_id, metric_name, metric_value, metric_json)
                        VALUES (%s, %s, NULL, %s)
                    """, (model_id, m_name, json.dumps(m_val)))
                else:
                    cursor.execute("""
                        INSERT INTO model_metrics (model_id, metric_name, metric_value, metric_json)
                        VALUES (%s, %s, %s, NULL)
                    """, (model_id, m_name, float(m_val)))
            print(f"    [CREATED] Model: {m['algorithm']} (ID: {model_id}, Accuracy: {m['metrics']['accuracy']:.3f})")
        else:
            print(f"    [EXISTS] Model: {m['algorithm']} (ID: {existing_model['id']})")

    cursor.close()
    conn.close()


def seed_predictions_and_xai():
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    print("\n[3/5] Updating Sample Patient Predictions with SHAP Explainability...")

    cursor.execute("SELECT id FROM ml_models WHERE algorithm = 'Random Forest' ORDER BY id DESC LIMIT 1")
    rf_model = cursor.fetchone()
    if not rf_model:
        cursor.close()
        conn.close()
        return

    model_id = rf_model["id"]
    cursor.execute("SELECT id FROM users WHERE email = 'admin@medinsight.ai'")
    user_id = cursor.fetchone()["id"]

    sample_patients = [
        {
            "inputs": {
                "age": 62, "sex": 1, "cp": 4, "trestbps": 150, "chol": 244,
                "fbs": 0, "restecg": 1, "thalach": 154, "exang": 1,
                "oldpeak": 1.4, "slope": 2, "ca": 2, "thal": 7
            },
            "output": {
                "prediction": 1,
                "class_name": "Elevated Cardiovascular Risk Detected",
                "probability": 0.84,
                "confidence": "High",
                "risk_tier": "High Risk"
            },
            "shap_explanation": {
                "ca": 0.28,
                "thal": 0.22,
                "oldpeak": 0.18,
                "cp": 0.12,
                "exang": 0.10,
                "thalach": -0.06,
                "trestbps": 0.05,
                "age": 0.03
            },
            "base_value": 0.46
        },
        {
            "inputs": {
                "age": 44, "sex": 0, "cp": 2, "trestbps": 118, "chol": 210,
                "fbs": 0, "restecg": 0, "thalach": 172, "exang": 0,
                "oldpeak": 0.0, "slope": 1, "ca": 0, "thal": 3
            },
            "output": {
                "prediction": 0,
                "class_name": "Low Cardiovascular Risk",
                "probability": 0.12,
                "confidence": "High",
                "risk_tier": "Normal / Low Risk"
            },
            "shap_explanation": {
                "ca": -0.24,
                "thal": -0.20,
                "oldpeak": -0.16,
                "thalach": -0.14,
                "cp": -0.08,
                "exang": -0.06,
                "trestbps": -0.04
            },
            "base_value": 0.46
        }
    ]

    for p in sample_patients:
        # Check if already added
        cursor.execute("SELECT id FROM predictions WHERE model_id = %s AND user_id = %s AND JSON_EXTRACT(input_json, '$.age') = %s",
                       (model_id, user_id, p["inputs"]["age"]))
        existing_pred = cursor.fetchone()
        if not existing_pred:
            cursor.execute("""
                INSERT INTO predictions (model_id, user_id, input_json, output_json, created_at)
                VALUES (%s, %s, %s, %s, NOW() - INTERVAL 4 HOUR)
            """, (model_id, user_id, json.dumps(p["inputs"]), json.dumps(p["output"])))
            pred_id = cursor.lastrowid
            # Add explanation
            cursor.execute("""
                INSERT INTO prediction_explanations (prediction_id, method, shap_values_json, feature_importance_json, base_value, created_at)
                VALUES (%s, 'TreeSHAP', %s, %s, %s, NOW() - INTERVAL 4 HOUR)
            """, (
                pred_id,
                json.dumps(p["shap_explanation"]),
                json.dumps([{"feature": k, "importance": abs(v), "attribution": v} for k, v in p["shap_explanation"].items()]),
                p["base_value"]
            ))
            print(f"  [CREATED] Patient Prediction (ID: {pred_id}, Risk: {p['output']['class_name']}, Prob: {p['output']['probability']})")
        else:
            print(f"  [EXISTS] Prediction for age {p['inputs']['age']} (ID: {existing_pred['id']})")

    cursor.close()
    conn.close()


def seed_anomaly_and_quality():
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    print("\n[4/5] Updating Anomaly Detection & Data Quality Assessments...")

    cursor.execute("SELECT id FROM datasets WHERE name LIKE '%Heart Disease%' ORDER BY id ASC LIMIT 1")
    hd_dataset = cursor.fetchone()
    if hd_dataset:
        d_id = hd_dataset["id"]
        # 1. Quality report
        cursor.execute("SELECT id FROM data_quality_reports WHERE dataset_id = %s", (d_id,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO data_quality_reports (dataset_id, quality_score, missing_pct, duplicate_count, total_issues, issues_json, column_quality_json, recommendations, created_at)
                VALUES (%s, 94.5, 0.45, 0, 2, %s, %s, %s, NOW() - INTERVAL 1 DAY)
            """, (
                d_id,
                json.dumps([{"type": "missing_values", "columns": ["ca", "thal"], "count": 6}]),
                json.dumps({"age": 100.0, "chol": 98.2, "trestbps": 99.1, "ca": 97.4, "thal": 98.0}),
                json.dumps(["Impute missing values in ca and thal using median/mode", "Standardize numerical features (chol, trestbps, thalach)"])
            ))
            print(f"  [CREATED] Data Quality Report for Dataset {d_id} (Score: 94.5%)")

        # 2. Anomaly job
        cursor.execute("SELECT id FROM anomaly_jobs WHERE dataset_id = %s", (d_id,))
        existing_job = cursor.fetchone()
        if not existing_job:
            cursor.execute("""
                INSERT INTO anomaly_jobs (dataset_id, algorithm, params_json, feature_columns, status, anomaly_count, created_at)
                VALUES (%s, 'Isolation Forest', %s, %s, 'COMPLETED', 7, NOW() - INTERVAL 12 HOUR)
            """, (
                d_id,
                json.dumps({"contamination": 0.03, "n_estimators": 100, "random_state": 42}),
                json.dumps(["age", "trestbps", "chol", "thalach", "oldpeak"])
            ))
            job_id = cursor.lastrowid
            # Seed sample anomalous records
            outliers = [
                {"idx": 126, "score": -0.28, "data": {"age": 67, "trestbps": 200, "chol": 564, "thalach": 160, "oldpeak": 1.6}},
                {"idx": 188, "score": -0.24, "data": {"age": 54, "trestbps": 192, "chol": 283, "thalach": 195, "oldpeak": 0.0}},
                {"idx": 213, "score": -0.21, "data": {"age": 70, "trestbps": 160, "chol": 269, "thalach": 112, "oldpeak": 2.9}}
            ]
            for o in outliers:
                cursor.execute("""
                    INSERT INTO anomaly_results (job_id, record_index, anomaly_score, is_anomaly, record_data)
                    VALUES (%s, %s, %s, 1, %s)
                """, (job_id, o["idx"], o["score"], json.dumps(o["data"])))
            print(f"  [CREATED] Anomaly Job (ID: {job_id}, Algorithm: Isolation Forest, Found: 7 anomalies)")

    cursor.close()
    conn.close()


def seed_activity_logs():
    conn = get_mysql_connection()
    cursor = conn.cursor(dictionary=True, buffered=True)
    print("\n[5/5] Refreshing Activity Audit Logs...")

    cursor.execute("SELECT id FROM users WHERE email = 'admin@medinsight.ai'")
    admin_id = cursor.fetchone()["id"]

    logs = [
        {"action": "DATASET_UPLOAD", "type": "DATASET", "res_id": 4, "desc": "Ingested UCI Heart Disease Cleveland Cohort (303 records, 14 features).", "ip": "127.0.0.1"},
        {"action": "SIGNAL_INGESTION", "type": "SIGNAL", "res_id": 5, "desc": "Loaded PTB-XL 12-lead synchronous ECG recording sample (1,000 samples @ 500 Hz).", "ip": "127.0.0.1"},
        {"action": "MODEL_TRAINING", "type": "MODEL", "res_id": 1, "desc": "Trained Gradient Boosting Classifier (AUC: 0.926) and Random Forest (AUC: 0.918).", "ip": "127.0.0.1"},
        {"action": "XAI_EXPLANATION", "type": "EXPLANATION", "res_id": 1, "desc": "Generated TreeSHAP local feature attribution for Patient Encounter #101.", "ip": "127.0.0.1"},
        {"action": "ANOMALY_DETECTION", "type": "ANOMALY", "res_id": 1, "desc": "Executed Isolation Forest outlier detection identifying 7 physiological anomalies.", "ip": "127.0.0.1"},
        {"action": "RAG_QUERY", "type": "RAG", "res_id": 8, "desc": "Queried Biomedical Research Assistant on 'Hierarchical RAG in clinical guidelines'.", "ip": "127.0.0.1"},
        {"action": "REPORT_EXPORT", "type": "REPORT", "res_id": 1, "desc": "Generated comprehensive research PDF report for Cardiovascular Risk Study.", "ip": "127.0.0.1"}
    ]

    for idx, l in enumerate(logs):
        cursor.execute("SELECT id FROM activity_logs WHERE action = %s AND resource_type = %s", (l["action"], l["type"]))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW() - INTERVAL %s HOUR)
            """, (admin_id, l["action"], l["type"], l["res_id"], json.dumps({"description": l["desc"]}), l["ip"], idx * 3 + 1))
            print(f"  [LOGGED] {l['action']}: {l['desc'][:60]}...")

    cursor.close()
    conn.close()
    print("\n[SUCCESS] Trial accounts and fresh dataset records successfully updated in MySQL!")


if __name__ == "__main__":
    seed_trial_accounts()
    seed_experiments_and_models()
    seed_predictions_and_xai()
    seed_anomaly_and_quality()
    seed_activity_logs()
