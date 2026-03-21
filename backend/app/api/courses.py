"""
Courses API routes.
Handles course CRUD operations with PostgreSQL.
"""

import uuid
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import get_current_user, UserResponse
from app.db.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


# =============================================================================
# F_ORDER SERVICE - Manages flat sequential lesson numbering within a course
# =============================================================================

async def recalculate_f_order(db: AsyncSession, course_id: uuid.UUID) -> None:
    """
    Recalculates f_order for all lessons (theory/practice) within a course.
    Topics get f_order=0.
    Lessons are numbered sequentially: 1, 2, 3...
    Order follows: topics sorted by order_index, then their children (lessons) sorted by order_index.
    """
    from app.db.schema import Node
    
    # Get all nodes for this course
    result = await db.execute(
        select(Node)
        .where(Node.course_id == course_id)
        .order_by(Node.order_index, Node.id)
    )
    all_nodes = list(result.scalars().all())
    
    # Find root topics (parent_id is None)
    root_topics = [n for n in all_nodes if n.parent_id is None and n.type == "topic"]
    root_topics.sort(key=lambda x: (x.order_index, str(x.id)))
    
    # Assign f_order
    lesson_counter = 1
    updates = []
    
    for topic in root_topics:
        # Topic gets f_order = 0 (not a lesson)
        updates.append({"id": topic.id, "f_order": 0})
        
        # Get children (lessons) sorted by order_index
        children = [
            n for n in all_nodes 
            if n.parent_id == topic.id and n.type in ["theory", "practice"]
        ]
        children.sort(key=lambda x: (x.order_index, str(x.id)))
        
        for child in children:
            updates.append({"id": child.id, "f_order": lesson_counter})
            lesson_counter += 1
    
    # Batch update
    for update_data in updates:
        await db.execute(
            update(Node)
            .where(Node.id == update_data["id"])
            .values(f_order=update_data["f_order"])
        )
    
    await db.commit()
    logger.info(f"Recalculated f_order for course {course_id}: {lesson_counter - 1} lessons")


# Pydantic models
class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    settings: dict = {}


class CourseNodeCreate(BaseModel):
    id: Optional[uuid.UUID] = None  # Allow frontend to provide UUID
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
    f_order: int = 0  # Flat sequential lesson number within course
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
        f_order=getattr(node, 'f_order', 0),  # Default to 0 if field doesn't exist yet
        content_status=node.content_status,
        content=node.content,
        data=node.data or {},
    )


def sort_nodes_by_order(nodes: list) -> list:
    """Sort nodes by parent_id and order_index for consistent ordering.
    
    Uses secondary sort by id for stability when order_index values are equal.
    """
    # Convert parent_id to string to handle asyncpg.UUID objects from PostgreSQL
    # Add id as secondary sort key for stable ordering
    return sorted(nodes, key=lambda n: (str(n.parent_id) if n.parent_id else "", n.order_index, str(n.id)))


# Node routes are now in a separate router to avoid conflicts
# See nodes_router below


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
        # Build tree structure for nodes - SORT by order_index for consistent ordering
        nodes_dict = {str(n.id): node_to_response(n) for n in course.nodes}
        root_nodes = [n for n in course.nodes if n.parent_id is None]
        
        response.append(CourseResponse(
            id=str(course.id),
            author_id=str(course.author_id),
            title=course.title,
            description=course.description,
            status=course.status,
            settings=course.settings or {},
            nodes=[node_to_response(n) for n in sort_nodes_by_order(course.nodes)],
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
        nodes=[node_to_response(n) for n in sort_nodes_by_order(course.nodes)],
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
        f_order=0,  # Will be recalculated by recalculate_f_order
        content_status="pending",
    )

    db.add(new_node)
    await db.commit()
    await db.refresh(new_node)

    # Recalculate f_order for all nodes in this course
    await recalculate_f_order(db, uuid.UUID(course_id))

    return node_to_response(new_node)


class CourseNodeBatchCreate(BaseModel):
    """Batch create nodes request."""
    nodes: list[CourseNodeCreate]


class CourseNodeBatchResponse(BaseModel):
    """Batch create nodes response."""
    nodes: list[CourseNodeResponse]
    created_count: int


@router.post("/{course_id}/nodes/batch", response_model=CourseNodeBatchResponse, status_code=status.HTTP_201_CREATED)
async def create_nodes_batch(
    course_id: str,
    batch_data: CourseNodeBatchCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add multiple nodes to a course at once."""
    from app.db.schema import Course, Node

    logger.info(f"Batch create nodes request for course {course_id}")
    logger.info(f"Nodes to create: {len(batch_data.nodes)}")
    for i, node in enumerate(batch_data.nodes):
        logger.info(f"  Node {i}: id={node.id}, title={node.title}, type={node.type}, parent_id={node.parent_id}")

    # Verify course exists and user owns it
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()

    if not course:
        logger.warning(f"Course not found: {course_id}")
        raise HTTPException(status_code=404, detail="Course not found")

    if str(course.author_id) != current_user.id:
        logger.warning(f"User {current_user.id} not authorized for course {course_id}")
        raise HTTPException(status_code=403, detail="Not authorized")

    # Create nodes - use provided id or generate new one
    created_nodes = []
    node_id_map = {}  # Map frontend id to actual DB id

    for idx, node_data in enumerate(batch_data.nodes):
        # Use provided UUID or generate new one
        node_id = node_data.id if node_data.id else uuid.uuid4()
        
        new_node = Node(
            id=node_id,
            course_id=uuid.UUID(course_id),
            parent_id=node_data.parent_id,
            title=node_data.title,
            type=node_data.type,
            order_index=node_data.order_index if node_data.order_index > 0 else idx,
            f_order=0,  # Will be recalculated by recalculate_f_order
            content_status="pending",
        )
        db.add(new_node)
        created_nodes.append(new_node)
        
        # Track the mapping if frontend provided an id
        if node_data.id:
            node_id_map[str(node_data.id)] = node_id
            logger.info(f"Created node with frontend id {node_data.id} -> DB id {node_id}")

    await db.commit()
    logger.info(f"Created {len(created_nodes)} nodes in database")

    # Refresh all nodes to get their IDs
    for node in created_nodes:
        await db.refresh(node)

    # Recalculate f_order for all nodes in this course
    await recalculate_f_order(db, uuid.UUID(course_id))

    logger.info(f"Batch create completed successfully")
    return CourseNodeBatchResponse(
        nodes=[node_to_response(n) for n in created_nodes],
        created_count=len(created_nodes),
    )


# Separate router for node operations to avoid route conflicts
# This router is mounted at /api/v1/courses/nodes
nodes_router = APIRouter()


class NodeUpdate(BaseModel):
    """Update node request."""
    title: Optional[str] = None
    content: Optional[str] = None
    data: Optional[dict] = None
    content_status: Optional[str] = None
    order_index: Optional[int] = None


@nodes_router.get("/{node_id}", response_model=CourseNodeResponse)
async def get_node(
    node_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific node by ID."""
    from app.db.schema import Node, Course

    result = await db.execute(
        select(Node)
        .where(Node.id == uuid.UUID(node_id))
    )
    node = result.scalar_one_or_none()

    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Verify user owns the course this node belongs to
    course_result = await db.execute(
        select(Course).where(Course.id == node.course_id)
    )
    course = course_result.scalar_one_or_none()

    if not course or str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return node_to_response(node)


@nodes_router.patch("/{node_id}", response_model=CourseNodeResponse)
async def update_node(
    node_id: str,
    node_data: NodeUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a specific node."""
    from app.db.schema import Node, Course

    result = await db.execute(
        select(Node)
        .where(Node.id == uuid.UUID(node_id))
    )
    node = result.scalar_one_or_none()

    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    # Verify user owns the course this node belongs to
    course_result = await db.execute(
        select(Course).where(Course.id == node.course_id)
    )
    course = course_result.scalar_one_or_none()

    if not course or str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update fields if provided
    if node_data.title is not None:
        node.title = node_data.title
    if node_data.content is not None:
        node.content = node_data.content
    if node_data.data is not None:
        node.data = node_data.data
    if node_data.content_status is not None:
        node.content_status = node_data.content_status
    if node_data.order_index is not None:
        node.order_index = node_data.order_index
        # Recalculate f_order if order_index changed
        await recalculate_f_order(db, node.course_id)

    await db.commit()
    await db.refresh(node)

    logger.info(f"Node {node_id} updated successfully")
    return node_to_response(node)


@nodes_router.post("/{course_id}/recalculate-f-order")
async def recalculate_course_f_order(
    course_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually recalculate f_order for all nodes in a course.
    Use this after bulk operations or data fixes.
    """
    from app.db.schema import Course

    # Verify course exists and user owns it
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await recalculate_f_order(db, uuid.UUID(course_id))

    return {"message": f"f_order recalculated for course {course_id}"}
