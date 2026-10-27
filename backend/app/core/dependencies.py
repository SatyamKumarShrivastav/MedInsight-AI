"""
MedInsight AI — FastAPI Dependencies
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, RoleEnum
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()


def is_localhost_request(request: Request) -> bool:
    """
    Determine if a request originates exclusively from the physical host (localhost).
    Returns False if coming through an external network, tunnel, or remote client.
    """
    if not request:
        return True

    # 1. Direct client IP check
    client_ip = request.client.host if request.client else ""
    if client_ip not in ["127.0.0.1", "::1", "localhost", "testclient"]:
        return False

    # 2. X-Forwarded-For header check
    xff = request.headers.get("x-forwarded-for")
    if xff:
        ips = [ip.strip() for ip in xff.split(",")]
        for ip in ips:
            if ip not in ["127.0.0.1", "::1", "localhost"]:
                return False

    # 3. Origin / Referer / Host / X-Forwarded-Host headers
    origin = request.headers.get("origin", "")
    referer = request.headers.get("referer", "")
    xfh = request.headers.get("x-forwarded-host", "")

    for header_val in [origin, referer, xfh]:
        if header_val:
            val = header_val.lower()
            if "://" in val:
                val = val.split("://", 1)[1]
            host_part = val.split("/")[0].split(":")[0]
            if host_part and host_part not in ["localhost", "127.0.0.1", "::1", "testserver"]:
                return False

    return True


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT token and return current authenticated user."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    if str(user_id).isdigit():
        user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    else:
        user = db.query(User).filter((User.email == str(user_id)) | (User.username == str(user_id)), User.is_active == True).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # CEO LOCALHOST-ONLY ENFORCEMENT
    if user.role == RoleEnum.CEO and not is_localhost_request(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Restriction: CEO session is strictly limited to localhost console access.",
        )

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return current_user


def require_role(*roles: RoleEnum):
    """Factory for role-based authorization dependencies."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {[r.value for r in roles]}",
            )
        return current_user
    return role_checker


require_admin = require_role(RoleEnum.ADMIN)
require_researcher_or_admin = require_role(RoleEnum.ADMIN, RoleEnum.RESEARCHER)
