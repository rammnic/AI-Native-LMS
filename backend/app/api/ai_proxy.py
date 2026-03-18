"""
AI Proxy API routes.
Handles AI integration with mock/real toggle via AI_MOCK_ENABLED env variable.
"""

import os
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter()

AI_API_URL = os.getenv("AI_API_URL", "http://localhost:8000")
AI_MOCK_ENABLED = os.getenv("AI_MOCK_ENABLED", "true").lower() == "true"


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
    if AI_MOCK_ENABLED:
        return MOCK_COURSE_OUTLINE
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_API_URL}/execute",
                json={"pipeline_name": "course_outline", "input_data": request.model_dump()},
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.post("/generate/content")
async def generate_lesson_content(request: LessonContentRequest, content_type: str = "theory"):
    if AI_MOCK_ENABLED:
        return MOCK_THEORY_CONTENT if content_type == "theory" else MOCK_PRACTICE_CONTENT
    pipeline = "lesson_theory" if content_type == "theory" else "lesson_practice"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_API_URL}/execute",
                json={"pipeline_name": pipeline, "input_data": request.model_dump()},
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


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
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/status")
async def ai_status():
    return {"ai_mock_enabled": AI_MOCK_ENABLED, "ai_api_url": AI_API_URL}