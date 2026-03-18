"""
Database configuration and initialization.
Supports both PostgreSQL (production) and mock data (development).
"""

import os
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db.schema import Base

# Database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://lms_user:lms_password@localhost:5432/ai_lms"
)

# Check if PostgreSQL is available
USE_POSTGRES = bool(os.getenv("DATABASE_URL", ""))

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Initialize database connection and create tables."""
    if USE_POSTGRES:
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
            print("Database tables created successfully!")
    else:
        print("Using mock database (DEV mode without DATABASE_URL)")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_db_session() -> AsyncSession:
    """Get a database session (for use outside of dependency injection)."""
    return async_session_maker()


# Global mock data storage for development (fallback)
MOCK_DB = {
    "users": [],
    "courses": [],
    "nodes": [],
    "progress": [],
}


def get_mock_db() -> dict:
    """Get mock database for development."""
    return MOCK_DB