"""
MedInsight AI — Integration Tests: REST API Endpoints
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import pytest


def test_list_datasets_authenticated(client, auth_headers):
    response = client.get("/api/v1/datasets/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # At least the 3 seeded datasets should be present
    assert len(data) >= 3


def test_list_research_documents_authenticated(client, auth_headers):
    response = client.get("/api/v1/documents/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # The 10 seeded 2025-2026 papers should be present
    assert len(data) >= 10


def test_research_document_summary(client, auth_headers):
    # First get document list
    docs = client.get("/api/v1/documents/", headers=auth_headers).json()
    assert len(docs) > 0
    doc_id = docs[0]["id"]

    response = client.get(f"/api/v1/documents/{doc_id}/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "summary_excerpt" in data
    assert "top_keywords" in data
    assert len(data["top_keywords"]) > 0


def test_research_assistant_ask_query(client, auth_headers):
    docs = client.get("/api/v1/documents/", headers=auth_headers).json()
    assert len(docs) > 0
    doc_id = docs[0]["id"]

    response = client.post(
        f"/api/v1/documents/{doc_id}/ask?question=What+methods+and+findings+are+reported",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
    assert "disclaimer" in data


def test_dashboard_metrics(client, auth_headers):
    response = client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert data["stats"]["datasets"] >= 3
    assert "user" in data


def test_activity_logs_admin(client, auth_headers):
    response = client.get("/api/v1/activity/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
