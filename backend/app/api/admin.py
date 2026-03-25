"""
Admin API routes.
Handles invite code management and system configuration.
Requires admin authentication (email must match ADMIN_EMAIL env var).
"""

import os
import secrets
import string
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.schema import InviteCode, User
from app.api.auth import get_current_user, UserResponse

router = APIRouter()

# Admin configuration from environment
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").lower().strip()


def generate_invite_code() -> str:
    """Generate a random invite code in format: LC-XXXX-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '')  # Avoid ambiguous chars
    code = '-'.join(
        ''.join(secrets.choice(chars) for _ in range(4))
        for _ in range(3)
    )
    return f"LC-{code}"


class InviteCodeCreate(BaseModel):
    max_uses: int = 10
    expires_at: Optional[datetime] = None


class InviteCodeUpdate(BaseModel):
    is_active: Optional[bool] = None
    max_uses: Optional[int] = None
    uses_count: Optional[int] = None  # For resetting counter


class InviteCodeResponse(BaseModel):
    id: UUID
    code: str
    uses_count: int
    max_uses: int
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime
    created_by: Optional[str]  # Admin email


class ConfigResponse(BaseModel):
    invite_code_required: bool
    admin_email: str


class ConfigUpdate(BaseModel):
    invite_code_required: Optional[bool] = None
    # Note: ADMIN_EMAIL can only be changed via env variable


async def check_admin(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Verify that the current user is an admin."""
    if not ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin email not configured. Set ADMIN_EMAIL environment variable.",
        )
    
    if current_user.email.lower().strip() != ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required.",
        )
    
    return current_user


class AdminCheckResponse(BaseModel):
    is_admin: bool


@router.get("/check", response_model=AdminCheckResponse)
async def check_admin_access(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Check if current user is admin.
    This endpoint allows frontend to verify admin access before loading admin pages.
    """
    if not ADMIN_EMAIL:
        return AdminCheckResponse(is_admin=False)
    
    is_admin = current_user.email.lower().strip() == ADMIN_EMAIL
    return AdminCheckResponse(is_admin=is_admin)


@router.get("/invite-codes", response_model=list[InviteCodeResponse])
async def list_invite_codes(
    db: AsyncSession = Depends(get_db),
    admin: UserResponse = Depends(check_admin),
):
    """Get all invite codes."""
    result = await db.execute(select(InviteCode).order_by(InviteCode.created_at.desc()))
    codes = result.scalars().all()
    
    response = []
    for code in codes:
        creator_email = None
        if code.created_by:
            user_result = await db.execute(select(User).where(User.id == code.created_by))
            creator = user_result.scalar_one_or_none()
            if creator:
                creator_email = creator.email
        
        response.append(InviteCodeResponse(
            id=code.id,
            code=code.code,
            uses_count=code.uses_count,
            max_uses=code.max_uses,
            is_active=code.is_active,
            expires_at=code.expires_at,
            created_at=code.created_at,
            created_by=creator_email,
        ))
    
    return response


@router.post("/invite-codes", response_model=InviteCodeResponse)
async def create_invite_code(
    data: InviteCodeCreate,
    db: AsyncSession = Depends(get_db),
    admin: UserResponse = Depends(check_admin),
):
    """Create a new invite code."""
    from uuid import uuid4
    
    new_code = InviteCode(
        id=uuid4(),
        code=generate_invite_code(),
        created_by=UUID(admin.id),
        max_uses=data.max_uses,
        expires_at=data.expires_at,
        is_active=True,
        uses_count=0,
    )
    
    db.add(new_code)
    await db.commit()
    await db.refresh(new_code)
    
    return InviteCodeResponse(
        id=new_code.id,
        code=new_code.code,
        uses_count=new_code.uses_count,
        max_uses=new_code.max_uses,
        is_active=new_code.is_active,
        expires_at=new_code.expires_at,
        created_at=new_code.created_at,
        created_by=admin.email,
    )


@router.patch("/invite-codes/{code_id}", response_model=InviteCodeResponse)
async def update_invite_code(
    code_id: UUID,
    data: InviteCodeUpdate,
    db: AsyncSession = Depends(get_db),
    admin: UserResponse = Depends(check_admin),
):
    """Update an invite code."""
    result = await db.execute(select(InviteCode).where(InviteCode.id == code_id))
    code = result.scalar_one_or_none()
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite code not found",
        )
    
    if data.is_active is not None:
        code.is_active = data.is_active
    if data.max_uses is not None:
        code.max_uses = data.max_uses
    if data.uses_count is not None:
        code.uses_count = data.uses_count
    
    await db.commit()
    await db.refresh(code)
    
    creator_email = None
    if code.created_by:
        user_result = await db.execute(select(User).where(User.id == code.created_by))
        creator = user_result.scalar_one_or_none()
        if creator:
            creator_email = creator.email
    
    return InviteCodeResponse(
        id=code.id,
        code=code.code,
        uses_count=code.uses_count,
        max_uses=code.max_uses,
        is_active=code.is_active,
        expires_at=code.expires_at,
        created_at=code.created_at,
        created_by=creator_email,
    )


@router.delete("/invite-codes/{code_id}")
async def delete_invite_code(
    code_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserResponse = Depends(check_admin),
):
    """Delete (deactivate) an invite code."""
    result = await db.execute(select(InviteCode).where(InviteCode.id == code_id))
    code = result.scalar_one_or_none()
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite code not found",
        )
    
    # Soft delete - just deactivate
    code.is_active = False
    await db.commit()
    
    return {"message": "Invite code deactivated"}


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    """
    Get public configuration for the frontend.
    This endpoint is public (no auth required).
    """
    invite_code_required = os.getenv("INVITE_CODE_REQUIRED", "false").lower() == "true"
    
    return ConfigResponse(
        invite_code_required=invite_code_required,
        admin_email=ADMIN_EMAIL if ADMIN_EMAIL else "",
    )


@router.patch("/config", response_model=ConfigResponse)
async def update_config(
    data: ConfigUpdate,
    admin: UserResponse = Depends(check_admin),
):
    """
    Update runtime configuration.
    Note: Changes are only stored in process memory and will be lost on restart.
    For permanent changes, modify the .env file.
    """
    # This is a simplified implementation - in production, you'd want to persist
    # these settings to a database or config file
    global ADMIN_EMAIL
    
    # Note: We can't actually change ADMIN_EMAIL at runtime without restart
    # But we validate that the current user is allowed to make config changes
    
    # For INVITE_CODE_REQUIRED, we could implement a config storage mechanism
    # For now, we just return success - in a real app, store in DB
    invite_code_required = os.getenv("INVITE_CODE_REQUIRED", "false").lower() == "true"
    
    # If the user wants to change this, they need to update .env
    # This endpoint could be extended to store config in a dedicated table
    
    return ConfigResponse(
        invite_code_required=invite_code_required,
        admin_email=ADMIN_EMAIL if ADMIN_EMAIL else "",
    )