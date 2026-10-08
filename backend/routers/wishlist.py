from typing import Annotated

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from database import get_db
from models import User
from schemas.listing import ListingResponse
from schemas.wishlist import WishlistResponse
from services import add_to_wishlist, get_user_wishlist, remove_from_wishlist
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])


@router.get("", response_model=WishlistResponse)
def get_wishlist(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Get user's wishlist."""
    listings = get_user_wishlist(db, current_user.id)
    return {"items": listings}


@router.put("/{listing_id}", response_model=ListingResponse)
def add_to_wishlist_endpoint(
    listing_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Add a listing to wishlist."""
    add_to_wishlist(db, current_user.id, listing_id)
    # Return the listing
    from services.listing_service import get_listing_by_id
    return get_listing_by_id(db, listing_id)


@router.delete("/{listing_id}")
def remove_from_wishlist_endpoint(
    listing_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Remove a listing from wishlist."""
    remove_from_wishlist(db, current_user.id, listing_id)
    return {"detail": "Removed from wishlist"}
