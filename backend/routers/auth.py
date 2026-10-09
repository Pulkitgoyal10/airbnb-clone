from typing import Annotated

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from database import get_db
from models import User
from schemas.user import UserListResponse, UserLogin, UserMeResponse, UserModeUpdate, UserResponse
from services import get_all_users, get_or_create_user, update_user_mode
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=UserResponse)
def login(
    credentials: UserLogin,
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Demo login: find or create user by email/phone (no password check)."""
    return get_or_create_user(db, credentials.email_or_phone, credentials.name)


@router.get("/me", response_model=UserMeResponse)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current user info."""
    return current_user


@router.patch("/me/mode", response_model=UserResponse)
def update_mode(
    mode_update: UserModeUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Toggle host mode for current user."""
    return update_user_mode(db, current_user.id, mode_update.is_host)


@router.get("/users", response_model=UserListResponse)
def list_users(
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Get all demo users for switch user menu."""
    users = get_all_users(db)
    return {"items": users}


me_router = APIRouter(prefix="/api/me", tags=["me"])


@me_router.get("", response_model=UserMeResponse)
def get_me_direct(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current user info via /api/me."""
    return current_user


@me_router.patch("/mode", response_model=UserResponse)
def update_mode_direct(
    mode_update: UserModeUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Toggle host mode for current user via /api/me/mode."""
    return update_user_mode(db, current_user.id, mode_update.is_host)

