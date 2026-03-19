"""
AI Proxy API routes.
Handles AI integration with mock/real toggle via AI_MOCK_ENABLED env variable.
"""

import os
import uuid
import logging
import json
import re
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
    logger.info(f"generate_course_structure called with: {request.model_dump()}")
    
    if AI_MOCK_ENABLED:
        logger.info("Using MOCK_COURSE_OUTLINE")
        logger.info(f"Mock data structure: {MOCK_COURSE_OUTLINE['data'].get('structure')}")
        return MOCK_COURSE_OUTLINE
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_API_URL}/execute",
                json={"pipeline_name": "course_outline", "input_data": request.model_dump()},
                timeout=30.0,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"AI response: {result}")
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
    """Generate lesson content and save to database."""
    logger.info(f"Generating {content_type} content for node {request.node_id}")

    def _extract_json(text: str) -> Any:
        """Best-effort extraction of JSON object/array from LLM output."""
        if not text:
            return None

        # Try fenced blocks first
        fenced = re.findall(r"```(?:json)?\s*\n?(.*?)\n?```", text, flags=re.DOTALL | re.IGNORECASE)
        if fenced:
            text = fenced[0].strip()

        # Try direct parse
        try:
            return json.loads(text)
        except Exception:
            pass

        # Try to locate the first JSON object/array substring
        obj_match = re.search(r"\{[\s\S]*\}", text)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except Exception:
                pass

        arr_match = re.search(r"\[[\s\S]*\]", text)
        if arr_match:
            try:
                return json.loads(arr_match.group(0))
            except Exception:
                pass

        return None

    # Generate content (mock or real AI) and normalize the response contract for frontend.
    normalized: dict[str, Any]

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
            # Keep the original structure for debugging.
            return ai_result

        ai_data: dict[str, Any] = ai_result.get("data", {}) or {}

        if content_type == "theory":
            # lesson_theory pipeline writes final markdown to `lesson_content`
            content_data = (
                ai_data.get("lesson_content")
                or ai_data.get("theory_content")
                or ai_data.get("content")
                or ""
            )
            normalized = {"success": True, "data": {"content": content_data}}
        else:
            # lesson_practice pipeline writes parsed object to `practice_task`
            practice_task = ai_data.get("practice_task")

            # Some pipeline versions might still return the raw string
            # (e.g. if parse_json is missing or misconfigured).
            if practice_task is None and ai_data.get("practice_raw") is not None:
                practice_task = ai_data.get("practice_raw")

            if isinstance(practice_task, str):
                parsed = _extract_json(practice_task)
                if isinstance(parsed, dict):
                    practice_task = parsed

            if not isinstance(practice_task, dict):
                practice_task = {}

            description = practice_task.get("description")
            instructions = practice_task.get("instructions")
            task = ""
            if description and instructions:
                task = f"{description}\n\n{instructions}"
            else:
                task = instructions or description or ""

            solution = practice_task.get("solution") or ""

            tests_normalized: list[dict[str, str]] = []
            for t in (practice_task.get("tests") or []) or []:
                if not isinstance(t, dict):
                    continue
                inp = t.get("input", "")
                expected_output = (
                    t.get("expected_output")
                    or t.get("expected")
                    or ""
                )
                tests_normalized.append({
                    "input": inp,
                    "expected_output": expected_output,
                })

            normalized = {
                "success": True,
                "data": {
                    "task": task,
                    "solution": solution,
                    "tests": tests_normalized,
                },
            }

    # Save generated content to database
    try:
        from app.db.schema import Node, Course
        from sqlalchemy import select
        
        # Get the node
        result_db = await db.execute(
            select(Node).where(Node.id == uuid.UUID(request.node_id))
        )
        node = result_db.scalar_one_or_none()
        
        if not node:
            logger.warning(f"Node {request.node_id} not found, skipping save")
            return normalized
        
        # Verify user owns the course
        course_result = await db.execute(
            select(Course).where(Course.id == node.course_id)
        )
        course = course_result.scalar_one_or_none()
        
        if not course:
            logger.warning(f"Course not found for node {request.node_id}, skipping save")
            return normalized
        
        # Update node with generated content (from normalized frontend contract)
        if content_type == "theory":
            content_data = (normalized.get("data", {}) or {}).get("content", "")
            if isinstance(content_data, str) and content_data.strip():
                node.content = content_data
                node.content_status = "generated"
                logger.info(f"Saved theory content to node {request.node_id}")
            else:
                # Avoid persisting empty strings (so UI can re-generate)
                node.content_status = "pending"
                logger.warning(f"AI returned empty theory content for node {request.node_id}, keeping it pending")
        else:
            normalized_data = normalized.get("data", {}) or {}
            task = normalized_data.get("task", "")
            solution = normalized_data.get("solution", "")
            tests = normalized_data.get("tests", [])

            if (isinstance(task, str) and task.strip()) or (isinstance(solution, str) and solution.strip()):
                node.data = {
                    "task": task or "",
                    "solution": solution or "",
                    "tests": tests or [],
                }
                node.content_status = "generated"
                logger.info(f"Saved practice content to node {request.node_id}")
            else:
                node.content_status = "pending"
                logger.warning(f"AI returned empty practice content for node {request.node_id}, keeping it pending")
        
        await db.commit()
        await db.refresh(node)
        logger.info(f"Node {request.node_id} updated with {content_type} content")
        
    except Exception as e:
        logger.error(f"Error saving content to database: {str(e)}")
        # Don't fail the request, just log the error
        # The content was generated, just not saved
    
    return normalized


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

            ai_data: dict[str, Any] = ai_result.get("data", {}) or {}
            answer = (
                ai_data.get("mentor_response")
                or ai_data.get("answer")
                or ""
            )

            return {
                "success": True,
                "data": {"answer": answer},
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/status")
async def ai_status():
    return {"ai_mock_enabled": AI_MOCK_ENABLED, "ai_api_url": AI_API_URL}