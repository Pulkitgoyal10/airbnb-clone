from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    x_user_id: Annotated[int | None, Header(alias="X-User-Id")] = None,
) -> User:
    """Mock auth dependency: reads X-User-Id header, defaults to first guest user."""
    if x_user_id is None:
        # Default to first guest user
        user = db.query(User).filter(User.is_host == False).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No guest users found in database",
            )
        return user

    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
