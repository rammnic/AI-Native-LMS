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

router = APIRouter()
logger = logging.getLogger(__name__)

AI_API_URL = os.getenv("AI_API_URL", "http://localhost:8000")
AI_MOCK_ENABLED = os.getenv("AI_MOCK_ENABLED", "true").lower() == "true"

logger.info(f"AI Proxy initialized: mock_enabled={AI_MOCK_ENABLED}, api_url={AI_API_URL}")


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
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_API_URL}/execute",
                json={"pipeline_name": "course_outline", "input_data": request.model_dump()},
                timeout=60.0,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"AI response keys: {list(result.get('data', {}).keys())}")
            return result
    except Exception as e:
        logger.error(f"AI service error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/generate/content")
async def generate_lesson_content(
    request: LessonContentRequest,
    content_type: str = "theory",
    db: AsyncSession = Depends(get_db),
):
    """
    Generate lesson content and save to database.
    JSON parsing handled by AI Framework (json_mode).
    This proxy normalizes response format for frontend.
    """
    logger.info(f"Generating {content_type} content for node {request.node_id}")

    # Use mock data or call AI Framework
    if AI_MOCK_ENABLED:
        normalized = MOCK_THEORY_CONTENT if content_type == "theory" else MOCK_PRACTICE_CONTENT
        logger.info(f"Using mock content for {content_type}")
    else:
        pipeline = "lesson_theory" if content_type == "theory" else "lesson_practice"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{AI_API_URL}/execute",
                    json={"pipeline_name": pipeline, "input_data": request.model_dump()},
                    timeout=60.0,
                )
                response.raise_for_status()
                ai_result = response.json()
        except Exception as e:
            logger.error(f"AI service error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

        if not ai_result.get("success", False):
            return ai_result

        ai_data: dict[str, Any] = ai_result.get("data", {}) or {}

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
