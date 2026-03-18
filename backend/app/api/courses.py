"""
Courses API routes.
Handles course CRUD operations with PostgreSQL.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import get_current_user, UserResponse
from app.db.database import get_db

router = APIRouter()


# Pydantic models
class CourseCreate(BaseModel):
    title: str
    description: str = ""
    settings: dict = {}


class CourseNodeCreate(BaseModel):
    title: str
    type: str  # topic, theory, practice
    parent_id: Optional[uuid.UUID] = None
    order_index: int = 0


class CourseNodeResponse(BaseModel):
    id: str
    course_id: str
    parent_id: Optional[str]
    title: str
    type: str
    order_index: int
    content_status: str
    content: Optional[str] = None
    data: dict = {}

    class Config:
        from_attributes = True


class CourseResponse(BaseModel):
    id: str
    author_id: str
    title: str
    description: Optional[str]
    status: str
    settings: dict
    nodes: List[CourseNodeResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def node_to_response(node) -> CourseNodeResponse:
    """Convert database node to response model."""
    return CourseNodeResponse(
        id=str(node.id),
        course_id=str(node.course_id),
        parent_id=str(node.parent_id) if node.parent_id else None,
        title=node.title,
        type=node.type,
        order_index=node.order_index,
        content_status=node.content_status,
        content=node.content,
        data=node.data or {},
    )


@router.get("", response_model=List[CourseResponse])
async def get_courses(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all courses for the current user."""
    from app.db.schema import Course, Node

    result = await db.execute(
        select(Course)
        .where(Course.author_id == uuid.UUID(current_user.id))
        .options(selectinload(Course.nodes))
        .order_by(Course.created_at.desc())
    )
    courses = result.scalars().all()

    response = []
    for course in courses:
        # Build tree structure for nodes
        nodes_dict = {str(n.id): node_to_response(n) for n in course.nodes}
        root_nodes = [n for n in course.nodes if n.parent_id is None]
        
        response.append(CourseResponse(
            id=str(course.id),
            author_id=str(course.author_id),
            title=course.title,
            description=course.description,
            status=course.status,
            settings=course.settings or {},
            nodes=[node_to_response(n) for n in course.nodes],
            created_at=course.created_at,
            updated_at=course.updated_at,
        ))

    return response


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific course."""
    from app.db.schema import Course

    result = await db.execute(
        select(Course)
        .where(Course.id == uuid.UUID(course_id))
        .options(selectinload(Course.nodes))
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check ownership
    if str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return CourseResponse(
        id=str(course.id),
        author_id=str(course.author_id),
        title=course.title,
        description=course.description,
        status=course.status,
        settings=course.settings or {},
        nodes=[node_to_response(n) for n in course.nodes],
        created_at=course.created_at,
        updated_at=course.updated_at,
    )


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new course."""
    from app.db.schema import Course

    new_course = Course(
        id=uuid.uuid4(),
        author_id=uuid.UUID(current_user.id),
        title=course_data.title,
        description=course_data.description,
        status="draft",
        settings=course_data.settings,
    )

    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)

    return CourseResponse(
        id=str(new_course.id),
        author_id=str(new_course.author_id),
        title=new_course.title,
        description=new_course.description,
        status=new_course.status,
        settings=new_course.settings or {},
        nodes=[],
        created_at=new_course.created_at,
        updated_at=new_course.updated_at,
    )


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a course."""
    from app.db.schema import Course

    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Check ownership
    if str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(course)
    await db.commit()

    return {"message": "Course deleted"}


@router.post("/{course_id}/nodes", response_model=CourseNodeResponse, status_code=status.HTTP_201_CREATED)
async def create_node(
    course_id: str,
    node_data: CourseNodeCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a node to a course."""
    from app.db.schema import Course, Node

    # Verify course exists and user owns it
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create node
    new_node = Node(
        id=uuid.uuid4(),
        course_id=uuid.UUID(course_id),
        parent_id=node_data.parent_id,
        title=node_data.title,
        type=node_data.type,
        order_index=node_data.order_index,
        content_status="pending",
    )

    db.add(new_node)
    await db.commit()
    await db.refresh(new_node)

    return node_to_response(new_node)