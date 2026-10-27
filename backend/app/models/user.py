"""
MedInsight AI — SQLAlchemy ORM Models: User & Role
BioIntelliX | Team led by Mr. S. K. Shrivastav
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class RoleEnum(str, enum.Enum):
    CEO = "CEO"
    ADMIN = "ADMIN"
    RESEARCHER = "RESEARCHER"
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    CITIZEN = "CITIZEN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    institution = Column(String(255), nullable=True)
    department = Column(String(255), nullable=True)
    degree_branch = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    country = Column(String(100), nullable=True)
    identification_number = Column(String(25), nullable=True)
    bio = Column(String(1000), nullable=True)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    pending_password_hash = Column(String(255), nullable=True)
    pending_password_requested_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def has_pending_password(self) -> bool:
        return bool(self.pending_password_hash)

    # Relationships
    datasets = relationship("Dataset", back_populates="owner")
    experiments = relationship("Experiment", back_populates="user")
    predictions = relationship("Prediction", back_populates="user")
    reports = relationship("Report", back_populates="user")
    documents = relationship("ResearchDocument", back_populates="owner")
    activity_logs = relationship("ActivityLog", back_populates="user")
