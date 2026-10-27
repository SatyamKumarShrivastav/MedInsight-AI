"""
MedInsight AI — Authentication API Router
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime, timedelta, timezone
import secrets, re

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user, is_localhost_request
from app.models.user import User, RoleEnum
from app.models.__init_models__ import ActivityLog

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "STUDENT"
    institution: Optional[str] = None
    department: Optional[str] = None
    degree_branch: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    identification_number: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v

    @field_validator("username")
    @classmethod
    def username_valid(cls, v):
        if not re.match(r"^[a-zA-Z0-9_]{3,50}$", v):
            raise ValueError("Username must be 3-50 alphanumeric characters or underscores")
        return v

    @field_validator("identification_number")
    @classmethod
    def id_valid(cls, v):
        if v is not None and v.strip():
            cleaned = v.strip()
            if len(cleaned) < 1 or len(cleaned) > 25:
                raise ValueError("ID must be between 1 and 25 characters")
            if not re.match(r"^[a-zA-Z0-9\s\-_]{1,25}$", cleaned):
                raise ValueError("ID must consist of alphanumeric characters, letters, or numbers (size 1-25)")
            return cleaned
        return None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    username: str
    role: str
    full_name: Optional[str]


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    degree_branch: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    identification_number: Optional[str] = None
    bio: Optional[str] = None

    @field_validator("identification_number")
    @classmethod
    def id_valid(cls, v):
        if v is not None and v.strip():
            cleaned = v.strip()
            if len(cleaned) < 1 or len(cleaned) > 25:
                raise ValueError("ID must be between 1 and 25 characters")
            if not re.match(r"^[a-zA-Z0-9\s\-_]{1,25}$", cleaned):
                raise ValueError("ID must consist of alphanumeric characters, letters, or numbers (size 1-25)")
            return cleaned
        return None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    institution: Optional[str] = None
    department: Optional[str] = None
    degree_branch: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    identification_number: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    has_pending_password: bool = False
    pending_password_requested_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Helpers ────────────────────────────────────────────────────────────────────

def _log_activity(db: Session, user_id: Optional[int], action: str, ip: str = None, details: dict = None):
    log = ActivityLog(user_id=user_id, action=action, ip_address=ip, details=details)
    db.add(log)
    db.commit()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    if (req.role or "").upper() in ["CEO", "ADMIN"]:
        raise HTTPException(
            status_code=400,
            detail="Cannot register directly as CEO or ADMIN. Role 'CEO' is exclusively held by Satyam Kumar Shrivastav, and Administrator appointments require CEO approval."
        )

    # Determine role
    valid_roles = {
        "RESEARCHER": RoleEnum.RESEARCHER,
        "STUDENT": RoleEnum.STUDENT,
        "STAFF": RoleEnum.STAFF,
        "CITIZEN": RoleEnum.CITIZEN,
    }
    assigned_role = valid_roles.get((req.role or "STUDENT").upper(), RoleEnum.STUDENT)

    user = User(
        email=req.email,
        username=req.username,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role=assigned_role,
        institution=req.institution if assigned_role != RoleEnum.CITIZEN else None,
        department=req.department if assigned_role in [RoleEnum.RESEARCHER, RoleEnum.STAFF] else None,
        degree_branch=req.degree_branch if assigned_role == RoleEnum.STUDENT else None,
        address=req.address if assigned_role == RoleEnum.CITIZEN else (req.address or None),
        country=req.country,
        identification_number=req.identification_number,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _log_activity(db, user.id, "USER_REGISTERED", str(request.client.host), details={"role": assigned_role.value})
    return user


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact administrator.")

    # CEO LOCALHOST-ONLY RESTRICTION
    if user.role == RoleEnum.CEO:
        if not is_localhost_request(request):
            _log_activity(db, user.id, "CEO_LOGIN_BLOCKED_NON_LOCAL", str(request.client.host), details={
                "origin": request.headers.get("origin"),
                "referer": request.headers.get("referer"),
                "host": request.headers.get("host")
            })
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: The CEO account is strictly restricted to physical localhost console access. Login via network links or remote tunnels is forbidden for this role."
            )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    _log_activity(db, user.id, "USER_LOGIN", str(request.client.host))
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        username=user.username,
        role=user.role.value,
        full_name=user.full_name,
    )


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    # Always return success to prevent email enumeration
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        # In production: send email. For dev, return token in response.
        return {
            "message": "If that email is registered, a reset link has been sent.",
            "dev_reset_token": token,  # Remove in production
            "expires_in_minutes": 60,
        }
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    now = datetime.now(timezone.utc)
    expiry = user.reset_token_expiry
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if not expiry or now > expiry:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.commit()
    return {"message": "Password reset successfully. Please log in."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.full_name is not None:
        current_user.full_name = req.full_name
    if req.institution is not None:
        current_user.institution = req.institution
    if req.department is not None:
        current_user.department = req.department
    if req.degree_branch is not None:
        current_user.degree_branch = req.degree_branch
    if req.address is not None:
        current_user.address = req.address
    if req.country is not None:
        current_user.country = req.country
    if req.identification_number is not None:
        current_user.identification_number = req.identification_number
    if req.bio is not None:
        current_user.bio = req.bio[:1000]
    db.commit()
    db.refresh(current_user)
    _log_activity(db, current_user.id, "PROFILE_UPDATED")
    return current_user


@router.put("/me/password")
@router.post("/me/password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if req.current_password == req.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    # If user is CEO, they can update their password immediately
    if current_user.role == RoleEnum.CEO:
        current_user.hashed_password = get_password_hash(req.new_password)
        current_user.pending_password_hash = None
        current_user.pending_password_requested_at = None
        db.commit()
        _log_activity(db, current_user.id, "PASSWORD_CHANGED_CEO_DIRECT")
        return {"message": "CEO password updated successfully."}
    elif current_user.role == RoleEnum.ADMIN:
        # Updating an Admin password requires CEO approval
        current_user.pending_password_hash = get_password_hash(req.new_password)
        current_user.pending_password_requested_at = datetime.now(timezone.utc)
        db.commit()
        _log_activity(db, current_user.id, "ADMIN_PASSWORD_CHANGE_REQUESTED")
        return {
            "message": "Administrator password change request submitted. In accordance with platform governance, updating an Administrator password requires approval from the CEO (Satyam Kumar Shrivastav).",
            "status": "PENDING_CEO_APPROVAL"
        }
    else:
        # Route for Admin or CEO approval
        current_user.pending_password_hash = get_password_hash(req.new_password)
        current_user.pending_password_requested_at = datetime.now(timezone.utc)
        db.commit()
        _log_activity(db, current_user.id, "PASSWORD_CHANGE_REQUESTED")
        return {
            "message": "Password change request submitted successfully. It will become active after Administrator or CEO approval.",
            "status": "PENDING_ADMIN_APPROVAL"
        }


@router.delete("/me")
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == RoleEnum.CEO:
        raise HTTPException(status_code=400, detail="The Super Admin CEO account cannot be deleted.")

    user_id = current_user.id
    _log_activity(db, user_id, "ACCOUNT_SELF_DELETED")
    # Clean up dependent records
    db.query(ActivityLog).filter(ActivityLog.user_id == user_id).delete()
    db.delete(current_user)
    db.commit()
    return {"message": "Your account has been deleted successfully."}
