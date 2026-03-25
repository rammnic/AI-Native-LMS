"""
AI-Native LMS Backend
FastAPI application with PostgreSQL and JWT auth.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, courses, progress, ai_proxy, admin, prompts
from app.db.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events."""
    # Startup - initialize database
    logger.info("Starting AI-Native LMS API...")
    await init_db()
    logger.info("Database initialized successfully!")
    logger.info("Application started successfully!")
    yield
    # Shutdown
    logger.info("Application shutting down...")


app = FastAPI(
    title="AI-Native LMS API",
    description="Backend for AI-powered learning management system",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(courses.router, prefix="/api/v1/courses", tags=["courses"])
app.include_router(courses.nodes_router, prefix="/api/v1/courses/nodes", tags=["nodes"])
app.include_router(progress.router, prefix="/api/v1/progress", tags=["progress"])
app.include_router(ai_proxy.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(prompts.router, prefix="/api/v1/prompts", tags=["prompts"])

logger.info("All routes registered successfully")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "AI-Native LMS API is running",
        "version": "0.1.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "database": "connected" if os.getenv("DATABASE_URL") else "mock",
        "ai_mock_enabled": os.getenv("AI_MOCK_ENABLED", "true").lower() == "true",
    }