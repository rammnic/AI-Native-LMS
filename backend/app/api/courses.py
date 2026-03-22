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
    
    Order rules:
    - Topics sorted by order_index
    - Theory lessons ALWAYS come before practice lessons (theory.order_index < practice.order_index)
    - Within same type, sorted by order_index
    - Function is RECURSIVE to handle nested subtopics
    
    Example hierarchy:
    - Topic (root) → f_order=0
      - Subtopic → f_order=0
        - Theory → f_order=1
        - Theory → f_order=2
        - Practice → f_order=3
      - Subtopic → f_order=0
        - Theory → f_order=4
        - Practice → f_order=5
    """
    from app.db.schema import Node
    
    # Get all nodes for this course
    result = await db.execute(
        select(Node)
        .where(Node.course_id == course_id)
        .order_by(Node.order_index, Node.id)
    )
    all_nodes = list(result.scalars().all())
    
    # Build lookup map
    node_map = {n.id: n for n in all_nodes}
    
    # Find root topics (parent_id is None)
    root_topics = [n for n in all_nodes if n.parent_id is None and n.type == "topic"]
    root_topics.sort(key=lambda x: (x.order_index, str(x.id)))
    
    # Assign f_order
    lesson_counter = 1
    updates = []
    
    def process_topic(topic_node, depth: int = 0) -> None:
        """Recursively process a topic and all its children."""
        nonlocal lesson_counter
        
        # Topic itself gets f_order=0
        updates.append({"id": topic_node.id, "f_order": 0})
        
        # Get direct children of this topic
        children = [n for n in all_nodes if n.parent_id == topic_node.id]
        
        # Separate into subtopics (type="topic") and lessons (theory/practice)
        subtopics = [c for c in children if c.type == "topic"]
        lessons = [c for c in children if c.type in ["theory", "practice"]]
        
        # Sort subtopics by order_index
        subtopics.sort(key=lambda x: (x.order_index, str(x.id)))
        
        # CRITICAL: Sort lessons by TYPE first (theory always before practice)
        # Then by order_index within same type
        # This ensures theory < practice regardless of old order_index values
        lessons.sort(key=lambda x: (
            0 if x.type == "theory" else 1,  # 0=theory, 1=practice (theory comes first)
            x.order_index,  # secondary sort within same type
            str(x.id)  # tertiary sort for stability
        ))
        
        # Process all subtopics recursively first
        for subtopic in subtopics:
            process_topic(subtopic, depth + 1)
        
        # Then assign f_order to lessons (theory first, then practice)
        for lesson in lessons:
            updates.append({"id": lesson.id, "f_order": lesson_counter})
            lesson_counter += 1
    
    # Process all root topics and their children recursively
    for topic in root_topics:
        process_topic(topic)
    
    # Apply all updates
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
    id: Optional[uuid.UUID] = None
    title: str
    type: str
    parent_id: Optional[uuid.UUID] = None
    order_index: int = 0


class CourseNodeResponse(BaseModel):
    id: str
    course_id: str
    parent_id: Optional[str]
    title: str
    type: str
    order_index: int
    f_order: int = 0
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


class TheoryContentResponse(BaseModel):
    """Response for theory content endpoint."""
    id: str
    title: str
    content: Optional[str]
    parent_id: Optional[str]


def node_to_response(node) -> CourseNodeResponse:
    """Convert database node to response model."""
    return CourseNodeResponse(
        id=str(node.id),
        course_id=str(node.course_id),
        parent_id=str(node.parent_id) if node.parent_id else None,
        title=node.title,
        type=node.type,
        order_index=node.order_index,
        f_order=getattr(node, 'f_order', 0),
        content_status=node.content_status,
        content=node.content,
        data=node.data or {},
    )


def sort_nodes_by_order(nodes: list) -> list:
    """Sort nodes by parent_id and order_index for consistent ordering."""
    return sorted(nodes, key=lambda n: (str(n.parent_id) if n.parent_id else "", n.order_index, str(n.id)))


nodes_router = APIRouter()


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    data: Optional[dict] = None
    content_status: Optional[str] = None
    order_index: Optional[int] = None


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

    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_node = Node(
        id=uuid.uuid4(),
        course_id=uuid.UUID(course_id),
        parent_id=node_data.parent_id,
        title=node_data.title,
        type=node_data.type,
        order_index=node_data.order_index,
        f_order=0,
        content_status="pending",
    )

    db.add(new_node)
    await db.commit()
    await db.refresh(new_node)

    await recalculate_f_order(db, uuid.UUID(course_id))

    return node_to_response(new_node)


class CourseNodeBatchCreate(BaseModel):
    nodes: list[CourseNodeCreate]


class CourseNodeBatchResponse(BaseModel):
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

    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    created_nodes = []

    for idx, node_data in enumerate(batch_data.nodes):
        node_id = node_data.id if node_data.id else uuid.uuid4()
        
        new_node = Node(
            id=node_id,
            course_id=uuid.UUID(course_id),
            parent_id=node_data.parent_id,
            title=node_data.title,
            type=node_data.type,
            order_index=node_data.order_index if node_data.order_index > 0 else idx,
            f_order=0,
            content_status="pending",
        )
        db.add(new_node)
        created_nodes.append(new_node)

    await db.commit()

    for node in created_nodes:
        await db.refresh(node)

    await recalculate_f_order(db, uuid.UUID(course_id))

    return CourseNodeBatchResponse(
        nodes=[node_to_response(n) for n in created_nodes],
        created_count=len(created_nodes),
    )


@nodes_router.get("/{node_id}", response_model=CourseNodeResponse)
async def get_node(
    node_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific node by ID."""
    from app.db.schema import Node, Course

    result = await db.execute(
        select(Node).where(Node.id == uuid.UUID(node_id))
    )
    node = result.scalar_one_or_none()

    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

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
        select(Node).where(Node.id == uuid.UUID(node_id))
    )
    node = result.scalar_one_or_none()

    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    course_result = await db.execute(
        select(Course).where(Course.id == node.course_id)
    )
    course = course_result.scalar_one_or_none()

    if not course or str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

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
        await recalculate_f_order(db, node.course_id)

    await db.commit()
    await db.refresh(node)

    return node_to_response(node)


@nodes_router.get("/{node_id}/theory", response_model=TheoryContentResponse)
async def get_node_theory(
    node_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the theory content associated with a node.
    
    For practice nodes, finds the sibling theory in the same topic.
    """
    from app.db.schema import Node, Course

    result = await db.execute(
        select(Node).where(Node.id == uuid.UUID(node_id))
    )
    node = result.scalar_one_or_none()

    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    course_result = await db.execute(
        select(Course).where(Course.id == node.course_id)
    )
    course = course_result.scalar_one_or_none()

    if not course or str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # If this is a theory node, return its content directly
    if node.type == "theory":
        return TheoryContentResponse(
            id=str(node.id),
            title=node.title,
            content=node.content,
            parent_id=str(node.parent_id) if node.parent_id else None,
        )

    # For practice nodes, find sibling theory in the same parent topic
    if node.type == "practice" and node.parent_id:
        sibling_result = await db.execute(
            select(Node)
            .where(
                Node.parent_id == node.parent_id,
                Node.type == "theory"
            )
            .order_by(Node.order_index)
            .limit(1)
        )
        sibling_theory = sibling_result.scalar_one_or_none()

        if sibling_theory:
            return TheoryContentResponse(
                id=str(sibling_theory.id),
                title=sibling_theory.title,
                content=sibling_theory.content,
                parent_id=str(sibling_theory.parent_id) if sibling_theory.parent_id else None,
            )

    # Fallback: try to find any theory in the same course
    any_theory_result = await db.execute(
        select(Node)
        .where(
            Node.course_id == node.course_id,
            Node.type == "theory"
        )
        .order_by(Node.order_index)
        .limit(1)
    )
    any_theory = any_theory_result.scalar_one_or_none()

    if any_theory:
        return TheoryContentResponse(
            id=str(any_theory.id),
            title=any_theory.title,
            content=any_theory.content,
            parent_id=str(any_theory.parent_id) if any_theory.parent_id else None,
        )

    return TheoryContentResponse(
        id="",
        title="",
        content=None,
        parent_id=None,
    )


@nodes_router.post("/{course_id}/recalculate-f-order")
async def recalculate_course_f_order(
    course_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually recalculate f_order for all nodes in a course."""
    from app.db.schema import Course

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


# =============================================================================
# STRUCTURE VALIDATION - Checks course structure for completeness and consistency
# =============================================================================

class ValidationIssue(BaseModel):
    """Single validation issue."""
    severity: str  # "error", "warning", "info"
    rule: str  # Rule name (e.g., "theory_before_practice")
    message: str
    node_id: Optional[str] = None
    node_title: Optional[str] = None


class StructureValidationResponse(BaseModel):
    """Response for structure validation endpoint."""
    is_valid: bool
    score: int  # 0-100
    total_lessons: int
    total_theory: int
    total_practice: int
    issues: list[ValidationIssue]
    recommendations: list[str]


@router.get("/{course_id}/validate-structure", response_model=StructureValidationResponse)
async def validate_course_structure(
    course_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validate course structure for:
    - **Непрерывность**: уроки связаны в логическую цепочку
    - **Цельность**: нет изолированных тем без уроков
    - **Полнота**: достаточно уроков на каждую тему
    - **Последовательность**: теория перед практикой
    
    Returns score (0-100) and list of issues with recommendations.
    """
    from app.db.schema import Course
    
    result = await db.execute(
        select(Course).where(Course.id == uuid.UUID(course_id))
    )
    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if str(course.author_id) != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Get all nodes
    nodes_result = await db.execute(
        select(Node)
        .where(Node.course_id == uuid.UUID(course_id))
    )
    nodes = list(nodes_result.scalars().all())
    
    issues: list[ValidationIssue] = []
    recommendations: list[str] = []
    
    # Counters
    topics = [n for n in nodes if n.type == "topic"]
    theory_lessons = [n for n in nodes if n.type == "theory"]
    practice_lessons = [n for n in nodes if n.type == "practice"]
    
    total_lessons = len(theory_lessons) + len(practice_lessons)
    total_theory = len(theory_lessons)
    total_practice = len(practice_lessons)
    
    # Build parent-child relationships
    node_map = {n.id: n for n in nodes}
    children_map: dict[uuid.UUID, list[Node]] = {}
    for node in nodes:
        if node.parent_id:
            if node.parent_id not in children_map:
                children_map[node.parent_id] = []
            children_map[node.parent_id].append(node)
    
    # === RULE 1: Theory before practice (CRITICAL) ===
    for topic in topics:
        topic_children = children_map.get(topic.id, [])
        lessons = [c for c in topic_children if c.type in ["theory", "practice"]]
        
        # Sort by order_index
        lessons_sorted = sorted(lessons, key=lambda x: (x.order_index, str(x.id)))
        
        for i, lesson in enumerate(lessons_sorted):
            if lesson.type == "practice":
                # Check if there's at least one theory before
                theories_before = [l for l in lessons_sorted[:i] if l.type == "theory"]
                if not theories_before:
                    issues.append(ValidationIssue(
                        severity="error",
                        rule="theory_before_practice",
                        message=f"Практика '{lesson.title}' не имеет теории перед собой в теме '{topic.title}'",
                        node_id=str(lesson.id),
                        node_title=lesson.title
                    ))
    
    # === RULE 2: Topic should have at least 1 lesson ===
    for topic in topics:
        topic_children = children_map.get(topic.id, [])
        lesson_children = [c for c in topic_children if c.type in ["theory", "practice"]]
        topic_children_of_children = [c for c in topic_children if c.type == "topic"]
        
        # Recursively count lessons in subtopics
        def count_lessons_recursive(t: Node) -> int:
            children = children_map.get(t.id, [])
            direct_lessons = len([c for c in children if c.type in ["theory", "practice"]])
            subtopic_lessons = sum(count_lessons_recursive(c) for c in children if c.type == "topic")
            return direct_lessons + subtopic_lessons
        
        total_topic_lessons = count_lessons_recursive(topic)
        
        if total_topic_lessons == 0:
            issues.append(ValidationIssue(
                severity="error",
                rule="topic_without_lessons",
                message=f"Тема '{topic.title}' не содержит уроков",
                node_id=str(topic.id),
                node_title=topic.title
            ))
        elif total_topic_lessons < 3:
            issues.append(ValidationIssue(
                severity="warning",
                rule="topic_too_small",
                message=f"Тема '{topic.title}' содержит только {total_topic_lessons} уроков (рекомендуется минимум 3-5)",
                node_id=str(topic.id),
                node_title=topic.title
            ))
    
    # === RULE 3: Practice should have sibling theory ===
    for practice in practice_lessons:
        if practice.parent_id:
            siblings = children_map.get(practice.parent_id, [])
            has_sibling_theory = any(s.type == "theory" for s in siblings)
            if not has_sibling_theory:
                issues.append(ValidationIssue(
                    severity="warning",
                    rule="practice_without_sibling_theory",
                    message=f"Практика '{practice.title}' не имеет теории в той же подтеме",
                    node_id=str(practice.id),
                    node_title=practice.title
                ))
    
    # === RULE 4: Balance theory/practice ratio ===
    if total_lessons > 0:
        theory_ratio = total_theory / total_lessons
        if theory_ratio < 0.5:
            issues.append(ValidationIssue(
                severity="warning",
                rule="too_much_practice",
                message=f"Слишком много практики ({total_practice}) относительно теории ({total_theory}). Рекомендуется соотношение ~70/30",
            ))
        elif total_practice > 0 and total_practice > total_theory:
            issues.append(ValidationIssue(
                severity="warning",
                rule="more_practice_than_theory",
                message=f"Практик ({total_practice}) больше чем теорий ({total_theory}). Теория должна преобладать!",
            ))
    
    # === RULE 5: f_order should be sequential ===
    all_f_orders = [n.f_order for n in nodes if n.type in ["theory", "practice"]]
    all_f_orders_sorted = sorted(all_f_orders)
    expected_f_orders = list(range(1, len(all_f_orders_sorted) + 1))
    if all_f_orders_sorted != expected_f_orders:
        issues.append(ValidationIssue(
            severity="warning",
            rule="f_order_not_sequential",
            message=f"f_order не последовательны. Ожидается {expected_f_orders[:10]}..., получено {all_f_orders_sorted[:10]}...",
        ))
    
    # === RULE 6: Topics should have proper nesting ===
    root_topics = [n for n in topics if n.parent_id is None]
    if len(root_topics) == 0:
        issues.append(ValidationIssue(
            severity="error",
            rule="no_root_topics",
            message="Курс не имеет корневых тем",
        ))
    
    # === Generate recommendations ===
    if total_lessons < 10:
        recommendations.append("Курс слишком короткий. Добавьте больше уроков для полного раскрытия темы (минимум 20-50 уроков)")
    
    if total_theory == 0:
        recommendations.append("Добавьте уроки теории — без них обучение невозможно")
    
    if total_practice == 0:
        recommendations.append("Добавьте практические задания — они закрепляют теорию")
    
    # Count subtopics
    subtopics = [n for n in topics if n.parent_id is not None and n.type == "topic"]
    if len(subtopics) < 3:
        recommendations.append("Используйте больше подтем для структурирования материала")
    
    # Check for isolated topics
    topics_with_children = [t for t in topics if children_map.get(t.id)]
    isolated_topics = [t for t in topics if not children_map.get(t.id) and t.parent_id is None]
    if isolated_topics:
        recommendations.append(f"{len(isolated_topics)} тем не имеют уроков или подтем")
    
    # === Calculate score ===
    max_issues = 10
    error_weight = 10
    warning_weight = 5
    
    total_deduction = (
        len([i for i in issues if i.severity == "error"]) * error_weight +
        len([i for i in issues if i.severity == "warning"]) * warning_weight
    )
    
    score = max(0, 100 - total_deduction)
    if total_lessons < 5:
        score = min(score, 30)  # Very small courses get low score
    
    # Course is valid if no critical errors
    has_critical_errors = any(i.severity == "error" for i in issues)
    is_valid = not has_critical_errors
    
    return StructureValidationResponse(
        is_valid=is_valid,
        score=score,
        total_lessons=total_lessons,
        total_theory=total_theory,
        total_practice=total_practice,
        issues=issues,
        recommendations=recommendations,
    )
