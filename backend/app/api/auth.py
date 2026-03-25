"""
Auth API routes.
Handles user registration, login, and profile with JWT.
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
import re
from pydantic import BaseModel, field_validator
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

router = APIRouter()

# Security
SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# bcrypt используется напрямую
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    invite_code: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        # Flexible email validation - accepts most email formats
        if not v or len(v) < 3:
            raise ValueError('Email must be at least 3 characters')
        # Basic check for @ symbol
        if '@' not in v:
            raise ValueError('Email must contain @')
        return v


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v or len(v) < 3:
            raise ValueError('Email must be at least 3 characters')
        if '@' not in v:
            raise ValueError('Email must contain @')
        return v


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AuthConfigResponse(BaseModel):
    """Public auth configuration for frontend."""
    invite_code_required: bool


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def create_access_token(data: dict) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Get current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Query user from database
    from app.db.schema import User
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        created_at=user.created_at,
    )


@router.get("/config", response_model=AuthConfigResponse)
async def get_auth_config():
    """
    Get public auth configuration for frontend.
    This endpoint is public (no auth required).
    Returns whether invite code is required for registration.
    """
    invite_code_required = os.getenv("INVITE_CODE_REQUIRED", "false").lower() == "true"
    return AuthConfigResponse(invite_code_required=invite_code_required)


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    from app.db.schema import User, InviteCode

    # Check if invite code is required and valid
    invite_code_required = os.getenv("INVITE_CODE_REQUIRED", "false").lower() == "true"
    
    if invite_code_required:
        if not user_data.invite_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite code is required for registration",
            )
        
        # Validate invite code
        result = await db.execute(
            select(InviteCode).where(InviteCode.code == user_data.invite_code)
        )
        invite = result.scalar_one_or_none()
        
        if not invite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid invite code",
            )
        
        if not invite.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite code is no longer active",
            )
        
        if invite.expires_at and invite.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite code has expired",
            )
        
        if invite.uses_count >= invite.max_uses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite code has reached maximum uses",
            )

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create new user
    new_user = User(
        id=uuid.uuid4(),
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name or user_data.email.split("@")[0],
    )

    db.add(new_user)
    
    # Increment invite code usage counter if invite code was used
    if invite_code_required and user_data.invite_code:
        await db.execute(
            update(InviteCode)
            .where(InviteCode.code == user_data.invite_code)
            .values(uses_count=InviteCode.uses_count + 1)
        )
    
    await db.commit()
    await db.refresh(new_user)

    # Create token
    access_token = create_access_token(data={"sub": str(new_user.id)})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(new_user.id),
            email=new_user.email,
            name=new_user.name,
            created_at=new_user.created_at,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login user."""
    from app.db.schema import User

    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create token
    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            created_at=user.created_at,
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get current user profile."""
    return current_user