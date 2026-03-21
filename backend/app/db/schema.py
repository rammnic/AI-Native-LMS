"""
Database schema using Drizzle ORM (Python).
Tables: users, courses, nodes, user_progress
"""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    courses = relationship("Course", back_populates="author")
    progress = relationship("UserProgress", back_populates="user")
    subscriptions = relationship("UserSubscription", back_populates="user")


class Course(Base):
    """Course model."""
    __tablename__ = "courses"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    author_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="draft", nullable=False)
    settings = Column(JSONB, default={"language": "ru"})  # Default: Russian language
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    author = relationship("User", back_populates="courses")
    nodes = relationship("Node", back_populates="course", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="course")


class Node(Base):
    """Course node (topic, theory, practice) - self-referencing tree structure."""
    __tablename__ = "nodes"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    course_id = Column(PGUUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    parent_id = Column(PGUUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(500), nullable=False)
    type = Column(String(50), nullable=False)  # topic, theory, practice
    order_index = Column(Integer, default=0, nullable=False)
    f_order = Column(Integer, default=0, nullable=False)  # Flat order: sequential lesson number within course (1, 2, 3...) - only for theory/practice, topics have 0
    content_status = Column(String(50), default="pending", nullable=False)
    content = Column(Text, nullable=True)  # Markdown content
    data = Column(JSONB, default={})  # Additional data (task, solution, tests)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="nodes")
    parent = relationship("Node", remote_side=[id], backref="children")
    progress = relationship("UserProgress", back_populates="node")


class UserProgress(Base):
    """User progress tracking."""
    __tablename__ = "user_progress"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    node_id = Column(PGUUID(as_uuid=True), ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(PGUUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="in_progress", nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="progress")
    node = relationship("Node", back_populates="progress")
    course = relationship("Course", back_populates="progress")


class UserSubscription(Base):
    """User subscription for future monetization."""
    __tablename__ = "user_subscriptions"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan = Column(String(50), default="free", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="subscriptions")


# Pydantic schemas for API
class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    settings: dict = {}


class CourseNodeCreate(BaseModel):
    title: str
    type: str  # topic, theory, practice
    parent_id: Optional[UUID] = None
    order_index: int = 0


class NodeResponse(BaseModel):
    id: UUID
    course_id: UUID
    parent_id: Optional[UUID]
    title: str
    type: str
    order_index: int
    f_order: int = 0  # Flat sequential order for lessons within course
    content_status: str
    content: Optional[str]
    data: dict

    class Config:
        from_attributes = True


class CourseResponse(BaseModel):
    id: UUID
    author_id: UUID
    title: str
    description: Optional[str]
    status: str
    settings: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgressCreate(BaseModel):
    course_id: UUID


class ProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    node_id: UUID
    course_id: UUID
    status: str
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True