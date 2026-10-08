from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.exceptions import NotFoundError
from models import Booking, Listing, User


def get_host_dashboard(db: Session, user_id: int) -> dict:
    """Get host dashboard stats and upcoming reservations."""
    # Verify user is a host
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_host:
        raise NotFoundError("Host not found")

    # Get stats
    active_listings = (
        db.query(func.count(Listing.id))
        .filter(Listing.host_id == user_id, Listing.status == "published")
        .scalar()
    )

    today = date.today()
    upcoming_bookings = (
        db.query(func.count(Booking.id))
        .join(Listing, Listing.id == Booking.listing_id)
        .filter(
            Listing.host_id == user_id,
            Booking.status == "confirmed",
            Booking.check_in >= today,
        )
        .scalar()
    )

    total_earnings = (
        db.query(func.sum(Booking.total_price))
        .join(Listing, Listing.id == Booking.listing_id)
        .filter(
            Listing.host_id == user_id,
            Booking.status == "confirmed",
        )
        .scalar()
        or 0
    )

    stats = {
        "active_listings": active_listings or 0,
        "upcoming_bookings": upcoming_bookings or 0,
        "total_earnings": total_earnings,
    }

    # Get upcoming reservations
    reservations = (
        db.query(Booking)
        .join(Listing, Listing.id == Booking.listing_id)
        .filter(
            Listing.host_id == user_id,
            Booking.status == "confirmed",
            Booking.check_in >= today,
        )
        .order_by(Booking.check_in)
        .all()
    )

    return {"stats": stats, "reservations": reservations}


def get_host_listings(db: Session, user_id: int) -> list[Listing]:
    """Get all listings for a host."""
    return (
        db.query(Listing)
        .filter(Listing.host_id == user_id)
        .order_by(Listing.created_at.desc())
        .all()
    )
