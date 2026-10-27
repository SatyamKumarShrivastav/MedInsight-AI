"""
MedInsight AI — Unit Tests: Authentication, Token Lifecycle & RBAC
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.models.user import RoleEnum


def test_password_hashing():
    raw_pass = "BioIntelliX@2026!"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_generation_and_decoding():
    payload = {"sub": "test_user@medinsight.ai", "role": RoleEnum.RESEARCHER.value}
    token = create_access_token(payload)
    assert isinstance(token, str)
    assert len(token) > 20

    decoded = decode_token(token)
    assert decoded.get("sub") == "test_user@medinsight.ai"
    assert decoded.get("role") == "RESEARCHER"
    assert "exp" in decoded


def test_invalid_token_handling():
    invalid_token = "invalid.token.signature"
    decoded = decode_token(invalid_token)
    assert decoded == {}


def test_api_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "MedInsight AI"
    assert data["team"] == "BioIntelliX"
    assert "Mr. S. K. Shrivastav" in data["leader"]


def test_unauthorized_access_rejection(client):
    # Protected endpoint without token should return 401 or 403
    response = client.get("/api/v1/datasets/")
    assert response.status_code in (401, 403)


def test_admin_route_forbidden_for_researcher(client, researcher_token):
    # Admin-only endpoint with researcher token should return 403
    headers = {"Authorization": f"Bearer {researcher_token}"}
    response = client.get("/api/v1/admin/users", headers=headers)
    assert response.status_code == 403
