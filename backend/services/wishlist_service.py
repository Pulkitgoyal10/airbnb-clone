from sqlalchemy.orm import Session

from core.exceptions import NotFoundError
from models import Favorite, Listing


def get_user_wishlist(db: Session, user_id: int) -> list[Listing]:
    """Get user's wishlist (favorite listings)."""
    listings = (
        db.query(Listing)
        .join(Favorite, Favorite.listing_id == Listing.id)
        .filter(Favorite.user_id == user_id)
        .all()
    )
    return listings


def add_to_wishlist(db: Session, user_id: int, listing_id: int) -> None:
    """Add a listing to user's wishlist."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise NotFoundError("Listing not found")

    # Check if already in wishlist
    existing = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        .first()
    )
    if existing:
        return  # Already in wishlist

    favorite = Favorite(user_id=user_id, listing_id=listing_id)
    db.add(favorite)
    db.commit()


def remove_from_wishlist(db: Session, user_id: int, listing_id: int) -> None:
    """Remove a listing from user's wishlist."""
    favorite = (
        db.query(Favorite)
        .filter(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        .first()
    )
    if favorite:
        db.delete(favorite)
        db.commit()
