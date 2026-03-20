"""
AI Proxy API routes.
Handles AI integration with mock/real toggle via AI_MOCK_ENABLED env variable.

Note: JSON parsing is now handled by AI Framework (LLMNode with json_mode).
This proxy only normalizes the response format for frontend compatibility.
"""

import os
import uuid
import logging
import json
from typing import Optional, Any

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.schema import Course, Node

router = APIRouter()
logger = logging.getLogger(__name__)

AI_API_URL = os.getenv("AI_API_URL", "http://localhost:8000")
AI_MOCK_ENABLED = os.getenv("AI_MOCK_ENABLED", "true").lower() == "true"

logger.info(f"AI Proxy initialized: mock_enabled={AI_MOCK_ENABLED}, api_url={AI_API_URL}")


# =============================================================================
# CONTEXT ENGINE - Collects full course context for content generation
# =============================================================================

async def get_course_context(db: AsyncSession, course_id: str, node_id: str) -> dict:
    """
    Collects comprehensive context for lesson generation:
    - Course metadata (title, language)
    - Node position in course tree
    - Previous/next lessons
    - Parent topic info
    - Sibling nodes
    """
    try:
        course_uuid = uuid.UUID(course_id)
        node_uuid = uuid.UUID(node_id)
    except ValueError:
        return {}
    
    # Get course
    course_result = await db.execute(select(Course).where(Course.id == course_uuid))
    course = course_result.scalar_one_or_none()
    if not course:
        return {}
    
    # Get course language from settings
    course_settings = course.settings or {}
    language = course_settings.get("language", "ru")
    
    # Get all nodes for this course ordered by order_index
    nodes_result = await db.execute(
        select(Node)
        .where(Node.course_id == course_uuid)
        .order_by(Node.order_index)
    )
    all_nodes = nodes_result.scalars().all()
    
    # Build node lookup and find current node
    nodes_list = [
        {
            "id": str(n.id),
            "title": n.title,
            "type": n.type,
            "parent_id": str(n.parent_id) if n.parent_id else None,
            "order_index": n.order_index,
        }
        for n in all_nodes
    ]
    
    current_node = None
    current_idx = -1
    for idx, n in enumerate(nodes_list):
        if n["id"] == node_id:
            current_node = n
            current_idx = idx
            break
    
    if not current_node:
        return {
            "course_title": course.title,
            "language": language,
            "nodes": nodes_list,
        }
    
    # Find previous and next lessons (theory/practice nodes)
    prev_lesson = nodes_list[current_idx - 1] if current_idx > 0 else None
    next_lesson = nodes_list[current_idx + 1] if current_idx < len(nodes_list) - 1 else None
    
    # Find parent topic
    parent_topic = None
    if current_node.get("parent_id"):
        for n in nodes_list:
            if n["id"] == current_node["parent_id"] and n["type"] == "topic":
                parent_topic = n
                break
    
    # Find siblings (same parent)
    siblings = [
        n for n in nodes_list
        if n["parent_id"] == current_node.get("parent_id") and n["id"] != node_id
    ]
    
    return {
        "course_title": course.title,
        "course_description": course.description or "",
        "language": language,
        "current_node": current_node,
        "prev_lesson": prev_lesson,
        "next_lesson": next_lesson,
        "parent_topic": parent_topic,
        "siblings": siblings,
        "nodes": nodes_list,
    }


def build_context_summary(context: dict) -> str:
    """
    Builds a human-readable context summary for AI prompts.
    Summarizes the educational context for this lesson.
    """
    if not context:
        return ""
    
    parts = []
    
    # Course info
    parts.append(f"Курс: {context.get('course_title', 'Unknown')}")
    
    # Language note
    language = context.get("language", "ru")
    parts.append(f"Язык контента: {'Русский' if language == 'ru' else 'Английский'}")
    
    # Previous lesson
    prev = context.get("prev_lesson")
    if prev:
        parts.append(f"Предыдущий урок: {prev['title']} ({prev['type']})")
    
    # Parent topic
    parent = context.get("parent_topic")
    if parent:
        parts.append(f"Тема раздела: {parent['title']}")
    
    # Next lesson
    next_lesson = context.get("next_lesson")
    if next_lesson:
        parts.append(f"Следующий урок: {next_lesson['title']} ({next_lesson['type']})")
    
    return "\n".join(parts)


class CourseOutlineRequest(BaseModel):
    user_prompt: str
    difficulty: str = "intermediate"
    depth_limit: int = 3
    user_id: str = "demo-user-1"


class LessonContentRequest(BaseModel):
    node_id: str
    course_id: str
    parent_context: str = ""
    title: str
    theory_content: Optional[str] = ""


class CodeValidationRequest(BaseModel):
    user_code: str
    expected_output: Optional[str] = None
    tests: list = []
    context: str = ""


class AIChatRequest(BaseModel):
    question: str
    context: str = ""
    node_id: Optional[str] = None


MOCK_COURSE_OUTLINE = {
    "success": True,
    "data": {
        "course_title": "Python для начинающих",
        "course_description": "Изучите основы Python программирования с нуля",
        "structure": [
            {
                "id": "node-1",
                "title": "Основы Python",
                "type": "topic",
                "children": [
                    {"id": "node-1-1", "title": "Введение в Python", "type": "theory", "content": None},
                    {"id": "node-1-2", "title": "Переменные и типы данных", "type": "theory", "content": None},
                    {"id": "node-1-3", "title": "Практика: Ваша первая программа", "type": "practice", "content": None},
                ],
            },
        ],
    },
}

MOCK_THEORY_CONTENT = {
    "success": True,
    "data": {
        "content": "# Введение в Python\n\nPython — это высокоуровневый язык программирования.\n\n## Почему Python?\n- Простой синтаксис\n- Универсальность\n- Большое сообщество\n\n```python\nprint('Hello, World!')\n```",
    },
}

MOCK_PRACTICE_CONTENT = {
    "success": True,
    "data": {
        "task": "Напишите программу, которая выводит 'Hello, World!'",
        "solution": "print('Hello, World!')",
        "tests": [{"input": "", "expected_output": "Hello, World!"}],
    },
}

MOCK_CODE_VALIDATION = {
    "success": True,
    "data": {"is_correct": True, "output": "Hello, World!", "message": "Отлично!"},
}

MOCK_CHAT_RESPONSE = {
    "success": True,
    "data": {"answer": "Python — отличный выбор для начинающих!"},
}


@router.post("/generate/structure")
async def generate_course_structure(request: CourseOutlineRequest):
    """Generate course structure. JSON parsing handled by AI Framework (json_mode)."""
    logger.info(f"generate_course_structure called with: {request.model_dump()}")
    
    if AI_MOCK_ENABLED:
        logger.info("Using MOCK_COURSE_OUTLINE")
        return MOCK_COURSE_OUTLINE
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"Calling AI Framework at {AI_API_URL}/execute")
            response = await client.post(
                f"{AI_API_URL}/execute",
                json={"pipeline_name": "course_outline", "input_data": request.model_dump()},
            )
            logger.info(f"AI Framework response status: {response.status_code}")
            response.raise_for_status()
            result = response.json()
            logger.info(f"AI response success: {result.get('success')}")
            logger.info(f"AI response keys: {list(result.get('data', {}).keys())}")
            
            # Check if AI returned an error
            if not result.get("success", False):
                error_msg = result.get("data", {}).get("error", "Unknown AI error")
                logger.error(f"AI returned error: {error_msg}")
                raise HTTPException(status_code=500, detail=f"AI error: {error_msg}")
            
            return result
    except httpx.TimeoutException:
        logger.error("AI service timeout")
        raise HTTPException(status_code=500, detail="AI service timeout")
    except httpx.HTTPStatusError as e:
        logger.error(f"AI HTTP error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=500, detail=f"AI HTTP error: {e.response.status_code}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI service error: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"AI service error: {type(e).__name__}: {str(e) or 'No error message'}")


@router.post("/generate/content")
async def generate_lesson_content(
    request: LessonContentRequest,
    content_type: str = "theory",
    db: AsyncSession = Depends(get_db),
):
    """
    Generate lesson content and save to database.
    Uses Context Engine to provide full course context for coherent content generation.
    JSON parsing handled by AI Framework (json_mode).
    This proxy normalizes response format for frontend.
    """
    logger.info(f"Generating {content_type} content for node {request.node_id}")

    # =================================================================
    # STEP 1: Get course context (NEW - for coherent content)
    # =================================================================
    context = await get_course_context(db, request.course_id, request.node_id)
    context_summary = build_context_summary(context)
    language = context.get("language", "ru") if context else "ru"
    
    logger.info(f"Context for node {request.node_id}: language={language}")
    if context_summary:
        logger.info(f"Context summary:\n{context_summary}")

    # Use mock data or call AI Framework
    if AI_MOCK_ENABLED:
        normalized = MOCK_THEORY_CONTENT if content_type == "theory" else MOCK_PRACTICE_CONTENT
        logger.info(f"Using mock content for {content_type}")
    else:
        pipeline = "lesson_theory" if content_type == "theory" else "lesson_practice"
        
        # =================================================================
        # STEP 2: Build enhanced request with context (NEW)
        # =================================================================
        enhanced_input = {
            **request.model_dump(),
            "language": language,  # Explicit language from course settings
            "context_summary": context_summary,  # Human-readable context
            "context": context,  # Full context object for AI
            "course_title": context.get("course_title") if context else None,
            "prev_lesson_title": context.get("prev_lesson", {}).get("title") if context else None,
            "next_lesson_title": context.get("next_lesson", {}).get("title") if context else None,
            "parent_topic_title": context.get("parent_topic", {}).get("title") if context else None,
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{AI_API_URL}/execute",
                    json={"pipeline_name": pipeline, "input_data": enhanced_input},
                    timeout=120.0,  # Increased timeout for better content
                )
                response.raise_for_status()
                ai_result = response.json()
        except Exception as e:
            logger.error(f"AI service error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

        if not ai_result.get("success", False):
            logger.error(f"AI returned failure: {ai_result}")
            return ai_result

        ai_data: dict[str, Any] = ai_result.get("data", {}) or {}
        
        # DEBUG: Log full AI response
        logger.info(f"=== DEBUG: AI Framework full response ===")
        logger.info(f"ai_result keys: {list(ai_result.keys())}")
        logger.info(f"ai_data keys: {list(ai_data.keys())}")
        logger.info(f"ai_data content preview: {str(ai_data)[:500]}...")

        if content_type == "theory":
            # lesson_theory returns markdown in lesson_content
            content = ai_data.get("lesson_content") or ai_data.get("content") or ""
            normalized = {"success": True, "data": {"content": content}}
        else:
            # lesson_practice returns parsed JSON in practice_task (thanks to json_mode)
            practice_task = ai_data.get("practice_task", {})
            
            # Handle case where AI returns dict directly (json_mode guarantee)
            if isinstance(practice_task, str):
                # Fallback: try to parse if somehow string slipped through
                try:
                    practice_task = json.loads(practice_task)
                except json.JSONDecodeError:
                    practice_task = {}
            
            # Normalize to frontend contract
            description = practice_task.get("description", "")
            instructions = practice_task.get("instructions", "")
            task = f"{description}\n\n{instructions}".strip() if description or instructions else instructions or description
            
            normalized = {
                "success": True,
                "data": {
                    "task": task,
                    "solution": practice_task.get("solution", ""),
                    "tests": [
                        {"input": t.get("input", ""), "expected_output": t.get("expected", t.get("expected_output", ""))}
                        for t in practice_task.get("tests", [])
                        if isinstance(t, dict)
                    ],
                },
            }

    # Save to database
    await _save_content_to_db(db, request.node_id, content_type, normalized)
    
    # =================================================================
    # STEP 3: Re-read from DB to guarantee fresh data (FIX for empty content issue)
    # =================================================================
    try:
        node_result = await db.execute(select(Node).where(Node.id == uuid.UUID(request.node_id)))
        node = node_result.scalar_one_or_none()
        
        if node and node.content_status == "generated":
            if content_type == "theory":
                return {
                    "success": True,
                    "data": {
                        "content": node.content or "",
                        "content_status": node.content_status,
                    }
                }
            else:
                node_data = node.data or {}
                return {
                    "success": True,
                    "data": {
                        "task": node_data.get("task", ""),
                        "solution": node_data.get("solution", ""),
                        "tests": node_data.get("tests", []),
                        "content_status": node.content_status,
                    }
                }
    except Exception as e:
        logger.warning(f"Could not re-read node from DB: {e}")
    
    # Fallback to normalized response
    return normalized


async def _save_content_to_db(
    db: AsyncSession,
    node_id: str,
    content_type: str,
    normalized: dict[str, Any]
):
    """Save generated content to database."""
    try:
        from app.db.schema import Node, Course
        
        result = await db.execute(select(Node).where(Node.id == uuid.UUID(node_id)))
        node = result.scalar_one_or_none()
        
        if not node:
            logger.warning(f"Node {node_id} not found, skipping save")
            return
        
        if content_type == "theory":
            content = (normalized.get("data", {}) or {}).get("content", "")
            if isinstance(content, str) and content.strip():
                node.content = content
                node.content_status = "generated"
                logger.info(f"Saved theory content to node {node_id}")
            else:
                node.content_status = "pending"
                logger.warning(f"Empty theory content for node {node_id}")
        else:
            data = normalized.get("data", {}) or {}
            task = data.get("task", "")
            solution = data.get("solution", "")
            
            if (isinstance(task, str) and task.strip()) or (isinstance(solution, str) and solution.strip()):
                node.data = {
                    "task": task or "",
                    "solution": solution or "",
                    "tests": data.get("tests", []),
                }
                node.content_status = "generated"
                logger.info(f"Saved practice content to node {node_id}")
            else:
                node.content_status = "pending"
                logger.warning(f"Empty practice content for node {node_id}")
        
        await db.commit()
        
    except Exception as e:
        logger.error(f"Error saving content to database: {str(e)}")


@router.post("/validate-code")
async def validate_code(request: CodeValidationRequest):
    if AI_MOCK_ENABLED:
        return MOCK_CODE_VALIDATION
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_API_URL}/execute",
                json={"pipeline_name": "code_validator", "input_data": request.model_dump()},
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/chat")
async def ai_chat(request: AIChatRequest):
    if AI_MOCK_ENABLED:
        return MOCK_CHAT_RESPONSE
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_API_URL}/execute",
                json={"pipeline_name": "ai_mentor", "input_data": request.model_dump()},
                timeout=30.0,
            )
            response.raise_for_status()
            ai_result = response.json()

            if not ai_result.get("success", False):
                return ai_result

            ai_data = ai_result.get("data", {}) or {}
            answer = ai_data.get("mentor_response") or ai_data.get("answer") or ""

            return {"success": True, "data": {"answer": answer}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/status")
async def ai_status():
    return {"ai_mock_enabled": AI_MOCK_ENABLED, "ai_api_url": AI_API_URL}
