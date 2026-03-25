"""
Prompts API routes.
Serves course generation prompts from markdown files.
"""

import os
import re
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

# Path to prompts directory (can be overridden via environment variable)
# Default to /app/docs/prompts for Docker, or project_root/docs/prompts for local dev
def _get_prompts_dir() -> Path:
    """Get prompts directory with automatic fallback for local development."""
    env_path = os.getenv("PROMPTS_DIR")
    if env_path:
        return Path(env_path)
    
    # Docker path
    docker_path = Path("/app/docs/prompts")
    if docker_path.exists():
        return docker_path
    
    # Local development fallback - relative to backend directory
    local_path = Path(__file__).parent.parent.parent.parent / "docs" / "prompts"
    logger.info(f"Using local prompts path: {local_path}")
    return local_path

PROMPTS_DIR = _get_prompts_dir()
logger.info(f"Prompts directory: {PROMPTS_DIR}, exists: {PROMPTS_DIR.exists()}")


class PromptInfo(BaseModel):
    """Prompt metadata."""
    id: str  # category/slug (e.g., "support/support-beginner")
    category: str  # e.g., "support"
    slug: str  # e.g., "support-beginner"
    title: str  # Human-readable title
    level: str  # beginner/intermediate/advanced
    description: str  # Short description
    path: str  # Relative path to file


class PromptDetail(PromptInfo):
    """Full prompt with content."""
    prompt_text: str  # The actual prompt for LMS
    parameters: dict  # difficulty, depth_limit


class CareerPath(BaseModel):
    """Career path for the map."""
    id: str
    title: str
    level: str
    children: List[str]  # IDs of next paths


def parse_prompt_file(file_path: Path) -> Optional[PromptDetail]:
    """Parse a single prompt markdown file."""
    try:
        content = file_path.read_text(encoding="utf-8")
        
        # Extract title from first H1 (handles "# Промпт", "# Промпт for", "# Промпт:" formats)
        # More flexible regex that handles various formats:
        # "# Промпт: Title", "# Промпт for Title", "# Промпт — Title", "# Промпт Title"
        title_match = re.search(r'^# Промпт[:\s]+(.+)$', content, re.MULTILINE | re.IGNORECASE)
        if not title_match:
            return None
        title = title_match.group(1).strip()
        
        # Extract prompt from code block (flexible - doesn't require ``` at line start)
        prompt_match = re.search(r'```\s*\n(.*?)```', content, re.DOTALL)
        if not prompt_match:
            return None
        prompt_text = prompt_match.group(1).strip()
        
        # Extract difficulty from parameters section
        difficulty = "intermediate"
        depth_limit = 3
        diff_match = re.search(r'"difficulty":\s*"(\w+)"', content)
        if diff_match:
            difficulty = diff_match.group(1)
        depth_match = re.search(r'"depth_limit":\s*(\d+)', content)
        if depth_match:
            depth_limit = int(depth_match.group(1))
        
        # Build ID from path
        rel_path = file_path.relative_to(PROMPTS_DIR)
        prompt_id = str(rel_path.with_suffix("")).replace(os.sep, "/")
        
        # Category and slug
        parts = prompt_id.split("/")
        category = parts[0] if len(parts) > 1 else "other"
        slug = parts[-1]
        
        # Description from README or first line of prompt
        lines = prompt_text.split("\n")
        description = lines[0][:100] + "..." if len(lines[0]) > 100 else lines[0]
        
        return PromptDetail(
            id=prompt_id,
            category=category,
            slug=slug,
            title=title,
            level=difficulty,
            description=description,
            path=str(rel_path),
            prompt_text=prompt_text,
            parameters={
                "difficulty": difficulty,
                "depth_limit": depth_limit,
            }
        )
    except Exception as e:
        logger.error(f"Error parsing {file_path}: {e}")
        return None


def get_all_prompts() -> List[PromptInfo]:
    """Get all available prompts (without full content)."""
    prompts = []
    
    if not PROMPTS_DIR.exists():
        logger.warning(f"Prompts directory not found: {PROMPTS_DIR}")
        return prompts
    
    for md_file in PROMPTS_DIR.rglob("*.md"):
        # Skip README.md
        if md_file.name == "README.md":
            continue
        
        detail = parse_prompt_file(md_file)
        if detail:
            prompts.append(PromptInfo(
                id=detail.id,
                category=detail.category,
                slug=detail.slug,
                title=detail.title,
                level=detail.level,
                description=detail.description,
                path=detail.path,
            ))
    
    return sorted(prompts, key=lambda p: (p.category, p.level))


def get_prompt_by_id(prompt_id: str) -> Optional[PromptDetail]:
    """Get a specific prompt by ID (category/slug)."""
    logger.info(f"Looking for prompt: {prompt_id}")
    logger.info(f"Prompts dir: {PROMPTS_DIR}, exists: {PROMPTS_DIR.exists()}")
    
    if not PROMPTS_DIR.exists():
        logger.error(f"Prompts directory does not exist: {PROMPTS_DIR}")
        return None
    
    file_path = PROMPTS_DIR / f"{prompt_id}.md"
    logger.info(f"Looking for file: {file_path}, exists: {file_path.exists()}")
    
    if file_path.exists():
        return parse_prompt_file(file_path)
    
    # Log available files for debugging
    if not file_path.exists():
        logger.warning(f"Prompt file not found: {file_path}")
        # List available files for debugging
        try:
            available = list(PROMPTS_DIR.rglob("*.md"))
            logger.info(f"Available .md files: {[str(f.relative_to(PROMPTS_DIR)) for f in available[:10]]}")
        except Exception as e:
            logger.error(f"Error listing files: {e}")
    
    return None


def get_career_paths() -> List[CareerPath]:
    """Get career paths for the interactive map."""
    return [
        CareerPath(
            id="zero-to-it",
            title="Zero to IT",
            level="beginner",
            children=["support-beginner", "sysadmin-beginner"]
        ),
        CareerPath(
            id="support-beginner",
            title="L1 Support",
            level="beginner",
            children=["support-l1-to-l2"]
        ),
        CareerPath(
            id="support-l1-to-l2",
            title="L2 Support",
            level="intermediate",
            children=["devops-from-it"]
        ),
        CareerPath(
            id="sysadmin-beginner",
            title="Junior SysAdmin",
            level="beginner",
            children=["sysadmin-junior-middle"]
        ),
        CareerPath(
            id="sysadmin-junior-middle",
            title="Middle SysAdmin",
            level="intermediate",
            children=["devops-course-prompt", "sre-basics"]
        ),
        CareerPath(
            id="devops-from-it",
            title="DevOps from IT",
            level="beginner",
            children=["devops-course-prompt"]
        ),
        CareerPath(
            id="devops-course-prompt",
            title="DevOps Engineer",
            level="intermediate",
            children=["devops-senior-sre", "cloud-engineer", "sre-basics"]
        ),
        CareerPath(
            id="devops-senior-sre",
            title="Senior DevOps / SRE",
            level="advanced",
            children=["sre-advanced", "platform-engineer"]
        ),
        CareerPath(
            id="sre-basics",
            title="SRE Fundamentals",
            level="intermediate",
            children=["sre-advanced"]
        ),
        CareerPath(
            id="sre-advanced",
            title="Senior SRE",
            level="advanced",
            children=["platform-engineer"]
        ),
        CareerPath(
            id="cloud-engineer",
            title="Cloud Engineer",
            level="intermediate",
            children=["devops-senior-sre", "platform-engineer"]
        ),
        CareerPath(
            id="platform-engineer",
            title="Platform Engineer",
            level="advanced",
            children=[]
        ),
    ]


# IMPORTANT: Static routes MUST be defined BEFORE dynamic routes like /{prompt_id}
# FastAPI processes routes in order of definition

@router.get("", response_model=List[PromptInfo])
async def get_prompts(
    category: Optional[str] = None,
):
    """
    Get all available prompts.
    
    Query params:
    - category: Filter by category (support, sysadmin, devops, sre, cloud, platform, zero-to-it)
    """
    prompts = get_all_prompts()
    
    if category:
        prompts = [p for p in prompts if p.category == category]
    
    return prompts


@router.get("/career-paths", response_model=List[CareerPath])
async def get_career_paths_endpoint():
    """Get career paths for the interactive map."""
    return get_career_paths()


@router.get("/categories/list")
async def get_categories():
    """Get list of available categories."""
    return {
        "categories": [
            {"id": "zero-to-it", "name": "Zero to IT", "icon": "💻"},
            {"id": "support", "name": "IT Support", "icon": "🎧"},
            {"id": "sysadmin", "name": "SysAdmin", "icon": "🖥️"},
            {"id": "devops", "name": "DevOps", "icon": "🔄"},
            {"id": "sre", "name": "SRE", "icon": "📊"},
            {"id": "cloud", "name": "Cloud", "icon": "☁️"},
            {"id": "platform", "name": "Platform", "icon": "🏗️"},
        ]
    }


@router.get("/{prompt_id:path}", response_model=PromptDetail)
async def get_prompt(prompt_id: str):
    """
    Get a specific prompt by ID.
    
    ID format: category/slug (e.g., "support/support-beginner")
    """
    print(f"DEBUG: get_prompt called with prompt_id={prompt_id}")
    prompt = get_prompt_by_id(prompt_id)
    print(f"DEBUG: get_prompt_by_id returned={prompt is not None}")
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return prompt
