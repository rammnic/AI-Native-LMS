"""
Progress API routes.
Handles user learning progress with PostgreSQL.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user, UserResponse
from app.db.database import get_db

router = APIRouter()


# Pydantic models
class ProgressUpdate(BaseModel):
    status: str = "completed"
    score: Optional[int] = None


class ProgressResponse(BaseModel):
    id: str
    user_id: str
    node_id: str
    course_id: str
    status: str
    score: Optional[int]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class CourseProgressResponse(BaseModel):
    course_id: str
    user_id: str
    completed_count: int
    total_count: int
    progress: List[ProgressResponse]


@router.get("/{course_id}", response_model=CourseProgressResponse)
async def get_course_progress(
    course_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get progress for a specific course."""
    from app.db.schema import UserProgress, Node

    # Get total nodes count for the course
    nodes_result = await db.execute(
        select(func.count(Node.id)).where(Node.course_id == uuid.UUID(course_id))
    )
    total_count = nodes_result.scalar() or 0

    # Get completed progress
    result = await db.execute(
        select(UserProgress)
        .where(
            UserProgress.user_id == uuid.UUID(current_user.id),
            UserProgress.course_id == uuid.UUID(course_id),
            UserProgress.status == "completed",
        )
    )
    progress_records = result.scalars().all()

    completed_count = len(progress_records)

    return CourseProgressResponse(
        course_id=course_id,
        user_id=current_user.id,
        completed_count=completed_count,
        total_count=total_count,
        progress=[
            ProgressResponse(
                id=str(p.id),
                user_id=str(p.user_id),
                node_id=str(p.node_id),
                course_id=str(p.course_id),
                status=p.status,
                score=p.score,
                completed_at=p.completed_at,
            )
            for p in progress_records
        ],
    )


@router.post("/{node_id}/complete", response_model=ProgressResponse)
async def mark_node_complete(
    node_id: str,
    data: ProgressUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a node as completed."""
    from app.db.schema import UserProgress, Node

    # Get node to find course_id
    node_result = await db.execute(
        select(Node).where(Node.id == uuid.UUID(node_id))
    )
    node = node_result.scalar_one_or_none()

    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Check if progress already exists
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == uuid.UUID(current_user.id),
            UserProgress.node_id == uuid.UUID(node_id),
        )
    )
    progress = result.scalar_one_or_none()

    if progress:
        # Update existing progress
        progress.status = data.status
        progress.score = data.score
        if data.status == "completed":
            progress.completed_at = datetime.utcnow()
    else:
        # Create new progress
        progress = UserProgress(
            id=uuid.uuid4(),
            user_id=uuid.UUID(current_user.id),
            node_id=uuid.UUID(node_id),
            course_id=node.course_id,
            status=data.status,
            score=data.score,
            completed_at=datetime.utcnow() if data.status == "completed" else None,
        )
        db.add(progress)

    await db.commit()
    await db.refresh(progress)

    return ProgressResponse(
        id=str(progress.id),
        user_id=str(progress.user_id),
        node_id=str(progress.node_id),
        course_id=str(progress.course_id),
        status=progress.status,
        score=progress.score,
        completed_at=progress.completed_at,
    )


@router.get("/{node_id}", response_model=ProgressResponse)
async def get_node_progress(
    node_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get progress for a specific node."""
    from app.db.schema import UserProgress

    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == uuid.UUID(current_user.id),
            UserProgress.node_id == uuid.UUID(node_id),
        )
    )
    progress = result.scalar_one_or_none()

    if not progress:
        # Return default unlocked status
        return ProgressResponse(
            id="",
            user_id=current_user.id,
            node_id=node_id,
            course_id="",
            status="unlocked",
            score=None,
            completed_at=None,
        )

    return ProgressResponse(
        id=str(progress.id),
        user_id=str(progress.user_id),
        node_id=str(progress.node_id),
        course_id=str(progress.course_id),
        status=progress.status,
        score=progress.score,
        completed_at=progress.completed_at,
    )