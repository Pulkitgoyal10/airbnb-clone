from sqlalchemy.orm import Session

from core.exceptions import NotFoundError
from models import User


def get_or_create_user(db: Session, email_or_phone: str, name: str | None = None) -> User:
    """Find user by email or phone, or create a new one."""
    user = db.query(User).filter(User.email == email_or_phone).first()
    if user:
        return user

    # Create new user
    user = User(
        email=email_or_phone,
        name=name or email_or_phone.split("@")[0],
        password_hash="demo",  # Mock password
        is_host=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: int) -> User:
    """Get user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    return user


def update_user_mode(db: Session, user_id: int, is_host: bool) -> User:
    """Toggle host mode for user."""
    user = get_user_by_id(db, user_id)
    user.is_host = is_host
    db.commit()
    db.refresh(user)
    return user


def get_all_users(db: Session) -> list[User]:
    """Get all users for demo switch user menu."""
    return db.query(User).order_by(User.id).all()
