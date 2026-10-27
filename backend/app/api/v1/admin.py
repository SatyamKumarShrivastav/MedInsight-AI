"""
MedInsight AI — Admin & CEO Governance API
BioIntelliX | Team led by Mr. S. K. Shrivastav
From Biomedical Data to Intelligent Insight.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import re

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import get_password_hash
from app.models.user import User, RoleEnum
from app.models.__init_models__ import ActivityLog

router = APIRouter(prefix="/admin", tags=["Administration & CEO Governance"])


def _require_admin_or_ceo(current_user: User):
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.CEO]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Administrator or CEO access required")


def _require_ceo(current_user: User):
    if current_user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Super Admin CEO (Satyam Kumar Shrivastav) authorization required."
        )


def _get_max_admins(db: Session) -> int:
    try:
        from sqlalchemy import text
        res = db.execute(text("SELECT max_admins FROM platform_governance WHERE id = 1")).fetchone()
        if res:
            return int(res[0])
    except Exception:
        pass
    return 5


class UserAdminResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    institution: Optional[str] = None
    department: Optional[str] = None
    degree_branch: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    identification_number: Optional[str] = None
    bio: Optional[str] = None
    has_pending_password: bool = False
    pending_password_requested_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateRoleRequest(BaseModel):
    role: str


class UpdateStatusRequest(BaseModel):
    is_active: bool


class AdminUpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    institution: Optional[str] = None
    department: Optional[str] = None
    degree_branch: Optional[str] = None
    address: Optional[str] = None
    country: Optional[str] = None
    identification_number: Optional[str] = None
    bio: Optional[str] = None
    is_active: Optional[bool] = None


class AdminResetPasswordRequest(BaseModel):
    new_password: str


class MaxAdminsUpdateRequest(BaseModel):
    max_admins: int


# ── Governance Endpoints ──────────────────────────────────────────────────────

@router.get("/governance")
def get_governance_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """View platform governance quotas, admin statistics, and CEO identity."""
    _require_admin_or_ceo(current_user)
    max_admins = _get_max_admins(db)
    current_admin_count = db.query(User).filter(User.role == RoleEnum.ADMIN, User.is_active == True).count()
    ceo = db.query(User).filter(User.role == RoleEnum.CEO).first()

    return {
        "ceo_name": "Satyam Kumar Shrivastav",
        "ceo_title": "Super Administrator & Chief Executive Officer",
        "ceo_username": ceo.username if ceo else "ceo",
        "ceo_email": ceo.email if ceo else "ceo@medinsight.ai",
        "max_admins": max_admins,
        "current_active_admins": current_admin_count,
        "available_admin_slots": max(0, max_admins - current_admin_count),
        "is_caller_ceo": current_user.role == RoleEnum.CEO,
    }


@router.put("/governance/max-admins")
def update_max_admins(
    req: MaxAdminsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Only CEO (Satyam Kumar Shrivastav) can configure the maximum number of administrators."""
    _require_ceo(current_user)
    if req.max_admins < 1 or req.max_admins > 100:
        raise HTTPException(400, "Maximum admins quota must be between 1 and 100.")

    from sqlalchemy import text
    db.execute(text("UPDATE platform_governance SET max_admins = :m, updated_by = :u WHERE id = 1"),
               {"m": req.max_admins, "u": current_user.id})
    db.commit()

    db.add(ActivityLog(
        user_id=current_user.id,
        action="CEO_CONFIGURED_MAX_ADMINS",
        resource_type="governance",
        details={"max_admins": req.max_admins},
    ))
    db.commit()

    return {"message": f"Administrator limit updated to {req.max_admins} by CEO Satyam Kumar Shrivastav."}


# ── User Management Endpoints ──────────────────────────────────────────────────

@router.get("/users", response_model=List[UserAdminResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_ceo(current_user)
    # Order CEO first, then ADMIN, then others by creation date
    users = db.query(User).order_by(
        (User.role == RoleEnum.CEO).desc(),
        (User.role == RoleEnum.ADMIN).desc(),
        User.created_at.desc()
    ).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=UserAdminResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_ceo(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("/users/{user_id}", response_model=UserAdminResponse)
def update_user_by_admin(
    user_id: int,
    req: AdminUpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """CEO can update any admin or user. Admins can update users (but cannot modify CEO)."""
    _require_admin_or_ceo(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Protection: Only CEO can update CEO account
    if user.role == RoleEnum.CEO and current_user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Access Denied: The Super Admin CEO profile (Satyam Kumar Shrivastav) can only be updated by the CEO himself."
        )

    # Protection: Only 1 CEO account can ever exist
    if req.role and req.role.upper() == "CEO" and user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Only one CEO account exists on MedInsight AI (held by Satyam Kumar Shrivastav). Another user cannot be assigned as CEO."
        )

    # Protection: Adding new admin requires CEO approval
    if req.role and req.role.upper() == "ADMIN" and user.role != RoleEnum.ADMIN:
        if current_user.role != RoleEnum.CEO:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Adding or appointing a new Administrator requires CEO (Satyam Kumar Shrivastav) approval. Only the CEO can assign the ADMIN role."
            )
        # Check quota
        max_admins = _get_max_admins(db)
        admin_count = db.query(User).filter(User.role == RoleEnum.ADMIN, User.is_active == True).count()
        if admin_count >= max_admins:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot appoint new Administrator: the maximum quota of {max_admins} administrators set by CEO has been reached."
            )

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.role is not None:
        valid_roles = [r.value for r in RoleEnum]
        if req.role.upper() not in valid_roles:
            raise HTTPException(400, f"Invalid role. Must be one of: {valid_roles}")
        user.role = RoleEnum(req.role.upper())
    if req.institution is not None:
        user.institution = req.institution
    if req.department is not None:
        user.department = req.department
    if req.degree_branch is not None:
        user.degree_branch = req.degree_branch
    if req.address is not None:
        user.address = req.address
    if req.country is not None:
        user.country = req.country
    if req.identification_number is not None:
        user.identification_number = req.identification_number
    if req.bio is not None:
        user.bio = req.bio
    if req.is_active is not None:
        if user.role == RoleEnum.CEO and not req.is_active:
            raise HTTPException(400, "The Super Admin CEO account cannot be deactivated.")
        if user_id == current_user.id and not req.is_active:
            raise HTTPException(400, "Cannot deactivate your own administrator account.")
        user.is_active = req.is_active

    db.commit()
    db.refresh(user)

    db.add(ActivityLog(
        user_id=current_user.id,
        action="ADMIN_UPDATE_USER",
        resource_type="user",
        resource_id=user_id,
        details={"updated_fields": [k for k, v in req.model_dump().items() if v is not None]},
    ))
    db.commit()
    return user


@router.put("/users/{user_id}/role")
def update_role(
    user_id: int,
    req: UpdateRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update role. Appointing ADMIN requires CEO approval. Promoting to CEO is forbidden."""
    _require_admin_or_ceo(current_user)
    target_role = req.role.upper()
    valid_roles = [r.value for r in RoleEnum]
    if target_role not in valid_roles:
        raise HTTPException(400, f"Invalid role. Valid: {valid_roles}")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Protection: CEO cannot be demoted by anyone
    if user.role == RoleEnum.CEO:
        raise HTTPException(403, "The Super Admin CEO role cannot be changed or demoted.")

    # Protection: Only 1 CEO account can ever exist
    if target_role == "CEO":
        raise HTTPException(
            400,
            "Only one CEO account exists on MedInsight AI (held by Satyam Kumar Shrivastav). Another user cannot be assigned as CEO."
        )

    # Adding new admin requires CEO approval
    if target_role == "ADMIN" and user.role != RoleEnum.ADMIN:
        if current_user.role != RoleEnum.CEO:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "Adding or appointing a new Administrator requires CEO (Satyam Kumar Shrivastav) approval. Only the CEO can assign the ADMIN role."
            )
        max_admins = _get_max_admins(db)
        admin_count = db.query(User).filter(User.role == RoleEnum.ADMIN, User.is_active == True).count()
        if admin_count >= max_admins:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Cannot appoint new Administrator: the maximum quota of {max_admins} administrators set by CEO has been reached."
            )

    user.role = RoleEnum(target_role)
    db.commit()
    db.add(ActivityLog(
        user_id=current_user.id, action="ADMIN_ROLE_CHANGE",
        resource_type="user", resource_id=user_id,
        details={"new_role": target_role},
    ))
    db.commit()
    return {"message": f"Role updated to {target_role}"}


@router.put("/users/{user_id}/status")
def update_status(
    user_id: int,
    req: UpdateStatusRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_or_ceo(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == RoleEnum.CEO:
        raise HTTPException(400, "The Super Admin CEO account cannot be deactivated.")
    if user_id == current_user.id and not req.is_active:
        raise HTTPException(400, "Cannot deactivate yourself.")

    user.is_active = req.is_active
    db.commit()
    db.add(ActivityLog(
        user_id=current_user.id, action="ADMIN_STATUS_CHANGE",
        resource_type="user", resource_id=user_id,
        details={"is_active": req.is_active},
    ))
    db.commit()
    return {"message": f"User {'activated' if req.is_active else 'deactivated'}"}


# ── Password Approval Endpoints ───────────────────────────────────────────────

@router.post("/users/{user_id}/approve-password")
def approve_password_change(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Approve user password change.
    Note: For updating an Administrator's password, CEO (Satyam Kumar Shrivastav) approval is required!
    """
    _require_admin_or_ceo(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not user.pending_password_hash:
        raise HTTPException(400, "User does not have any pending password change request")

    # If the user is an Administrator, ONLY CEO can approve their password!
    if user.role == RoleEnum.ADMIN and current_user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Approval Denied: Updating an Administrator's password requires approval from the CEO (Satyam Kumar Shrivastav)."
        )

    # Activate pending password
    user.hashed_password = user.pending_password_hash
    user.pending_password_hash = None
    user.pending_password_requested_at = None
    db.commit()

    db.add(ActivityLog(
        user_id=current_user.id,
        action="APPROVED_PASSWORD_CHANGE",
        resource_type="user",
        resource_id=user_id,
        details={"approved_for_user": user.email, "target_role": user.role.value, "approved_by_ceo": current_user.role == RoleEnum.CEO},
    ))
    db.commit()
    return {"message": f"Password change approved for user {user.username}. New password is now active."}


@router.post("/users/{user_id}/reject-password")
def reject_password_change(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reject pending password change request."""
    _require_admin_or_ceo(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not user.pending_password_hash:
        raise HTTPException(400, "User does not have any pending password change request")

    if user.role == RoleEnum.ADMIN and current_user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Reject Denied: Managing an Administrator's password change requires approval from the CEO (Satyam Kumar Shrivastav)."
        )

    user.pending_password_hash = None
    user.pending_password_requested_at = None
    db.commit()

    db.add(ActivityLog(
        user_id=current_user.id,
        action="REJECTED_PASSWORD_CHANGE",
        resource_type="user",
        resource_id=user_id,
        details={"rejected_for_user": user.email},
    ))
    db.commit()
    return {"message": f"Password change request for user {user.username} has been rejected."}


@router.post("/users/{user_id}/reset-password")
def reset_password_by_admin(
    user_id: int,
    req: AdminResetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Directly set a new password.
    Note: Directly resetting an Admin's password requires CEO approval / execution!
    """
    _require_admin_or_ceo(current_user)
    if len(req.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Protection: Admin password reset requires CEO
    if user.role == RoleEnum.ADMIN and current_user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Directly resetting an Administrator's password requires CEO (Satyam Kumar Shrivastav) authorization."
        )

    # Protection: CEO password cannot be reset by other admins
    if user.role == RoleEnum.CEO and current_user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "The CEO password cannot be reset by other administrators. CEO must update it himself."
        )

    user.hashed_password = get_password_hash(req.new_password)
    user.pending_password_hash = None
    user.pending_password_requested_at = None
    db.commit()

    db.add(ActivityLog(
        user_id=current_user.id,
        action="DIRECT_PASSWORD_RESET",
        resource_type="user",
        resource_id=user_id,
        details={"reset_for_user": user.email},
    ))
    db.commit()
    return {"message": f"Password for user {user.username} has been reset successfully."}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    CEO can delete any admin or user. Admins can delete users (but cannot delete CEO or other Admins).
    """
    _require_admin_or_ceo(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Protection: The CEO account cannot be deleted by anyone!
    if user.role == RoleEnum.CEO:
        raise HTTPException(400, "The Super Admin CEO (Satyam Kumar Shrivastav) account cannot be deleted.")

    # Protection: Only CEO can delete an Admin account
    if user.role == RoleEnum.ADMIN and current_user.role != RoleEnum.CEO:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Only the CEO (Satyam Kumar Shrivastav) has authorization to delete an Administrator account."
        )

    if user_id == current_user.id:
        raise HTTPException(400, "Cannot delete your own account from the administrator panel.")

    # Clean up dependent logs and predictions
    from app.models.__init_models__ import Prediction, PredictionExplanation
    db.query(ActivityLog).filter(ActivityLog.user_id == user_id).delete()
    preds = db.query(Prediction).filter(Prediction.user_id == user_id).all()
    for p in preds:
        db.query(PredictionExplanation).filter(PredictionExplanation.prediction_id == p.id).delete()
        db.delete(p)

    deleted_username = user.username
    deleted_email = user.email
    deleted_role = user.role.value

    db.delete(user)
    db.commit()

    db.add(ActivityLog(
        user_id=current_user.id,
        action="ADMIN_DELETE_USER",
        resource_type="user",
        resource_id=user_id,
        details={"deleted_username": deleted_username, "deleted_email": deleted_email, "deleted_role": deleted_role},
    ))
    db.commit()
    return {"message": f"User {deleted_username} ({deleted_role}) deleted successfully."}
