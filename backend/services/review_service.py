from sqlalchemy.orm import Session

from core.exceptions import NotFoundError, ValidationError
from models import Listing, Review


def create_review(db: Session, listing_id: int, review_data: dict) -> Review:
    """Create a review for a listing."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise NotFoundError("Listing not found")

    review = Review(listing_id=listing_id, **review_data)
    db.add(review)
    db.commit()
    db.refresh(review)

    return review


def get_listing_reviews(db: Session, listing_id: int) -> list[Review]:
    """Get all reviews for a listing."""
    return (
        db.query(Review)
        .filter(Review.listing_id == listing_id)
        .order_by(Review.created_at.desc())
        .all()
    )
