"""
MedInsight AI — Pytest Configuration and Test Fixtures
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import os
import sys
import pytest
import pandas as pd
import numpy as np

# Ensure backend and root are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from fastapi.testclient import TestClient
from main import app
from app.core.security import create_access_token, get_password_hash


@pytest.fixture(scope="session")
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def admin_token():
    """Admin access token for testing protected endpoints."""
    return create_access_token({"sub": "admin@medinsight.ai", "role": "ADMIN"})


@pytest.fixture(scope="session")
def researcher_token():
    """Researcher access token for testing protected endpoints."""
    return create_access_token({"sub": "researcher@medinsight.ai", "role": "RESEARCHER"})


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def sample_heart_df():
    """Small synthetic biomedical dataframe for deterministic testing."""
    np.random.seed(42)
    n = 100
    df = pd.DataFrame({
        "age": np.random.randint(30, 75, n),
        "sex": np.random.choice([0, 1], n),
        "cp": np.random.choice([0, 1, 2, 3], n),
        "trestbps": np.random.normal(130, 15, n),
        "chol": np.random.normal(240, 40, n),
        "fbs": np.random.choice([0, 1], n),
        "target": np.random.choice([0, 1], n),
    })
    # Add 2 missing values to test quality
    df.loc[0, "chol"] = np.nan
    df.loc[1, "chol"] = np.nan
    return df


@pytest.fixture
def sample_ecg_signal():
    """Synthetic 10-second ECG signal @ 250 Hz for signal tests."""
    fs = 250
    t = np.linspace(0, 5, fs * 5)
    # 1.2 Hz heartbeat + simulated noise
    ecg = 1.0 * np.exp(-((t % 0.833 - 0.2) ** 2) / 0.001) + 0.05 * np.sin(2 * np.pi * 50 * t)
    return ecg, fs
