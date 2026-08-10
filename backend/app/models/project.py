import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), default="#10B981", nullable=False)
    icon = Column(String(50), default="project", nullable=False)
    status = Column(String(50), default="planning", nullable=False)
    priority = Column(String(50), default="medium", nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    budget = Column(Integer, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    workspace = relationship("Workspace", back_populates="projects")
    boards = relationship("Board", back_populates="project")
    members = relationship("ProjectMember", back_populates="project")
    invitations = relationship("ProjectInvitation", back_populates="project")
    labels = relationship("Label", back_populates="project")
    milestones = relationship("Milestone", back_populates="project")
    creator = relationship("User", foreign_keys=[created_by])


class ProjectMember(Base):
    __tablename__ = "project_members"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="member", nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    project = relationship("Project", back_populates="members")
    user = relationship("User")


class ProjectInvitation(Base):
    __tablename__ = "project_invitations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    invited_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    email = Column(String(255), nullable=False)
    invitation_code = Column(String(20), nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    responded_at = Column(DateTime, nullable=True)
    
    project = relationship("Project", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])
