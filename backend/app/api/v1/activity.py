"""
MedInsight AI — Activity Logs API
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.__init_models__ import ActivityLog

router = APIRouter(prefix="/activity", tags=["Activity Logs"])


@router.get("/")
def get_activity(
    skip: int = 0,
    limit: int = 50,
    action: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_admin = current_user.role.value == "ADMIN"
    q = db.query(ActivityLog)
    if not is_admin:
        q = q.filter(ActivityLog.user_id == current_user.id)
    if action:
        q = q.filter(ActivityLog.action.ilike(f"%{action}%"))
    logs = q.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/count")
def get_activity_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_admin = current_user.role.value == "ADMIN"
    q = db.query(ActivityLog)
    if not is_admin:
        q = q.filter(ActivityLog.user_id == current_user.id)
    return {"total": q.count()}
