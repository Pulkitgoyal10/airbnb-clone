from datetime import date, timedelta

from sqlalchemy.orm import Session

from availability import has_conflict
from core.exceptions import ConflictError, ValidationError
from models import Booking, Listing


def validate_booking_dates(check_in: date, check_out: date) -> None:
    """Validate booking date constraints."""
    today = date.today()

    if check_in < today:
        raise ValidationError("Check-in date must be today or in the future")

    if check_out <= check_in:
        raise ValidationError("Check-out date must be after check-in date")

    max_nights = 30
    if (check_out - check_in).days > max_nights:
        raise ValidationError(f"Maximum stay is {max_nights} nights")


def create_booking(
    db: Session,
    listing_id: int,
    guest_id: int,
    check_in: date,
    check_out: date,
    guests: int,
) -> Booking:
    """Create a booking with conflict check in a single transaction."""
    # Validate dates
    validate_booking_dates(check_in, check_out)

    # Get listing
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise ValidationError("Listing not found")

    # Validate guest count
    if guests > listing.max_guests:
        raise ValidationError(f"Maximum {listing.max_guests} guests allowed")

    # Check for conflicts
    if has_conflict(db, listing_id, check_in, check_out):
        raise ConflictError("Requested dates are not available", code="DATES_UNAVAILABLE")

    # Calculate price
    from services.listing_service import calculate_price_quote
    price_info = calculate_price_quote(
        listing.price_per_night,
        listing.cleaning_fee,
        check_in,
        check_out,
    )

    # Create booking (use BEGIN IMMEDIATE to prevent concurrent conflicts)
    booking = Booking(
        listing_id=listing_id,
        guest_id=guest_id,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        total_price=price_info["total"],
        status="confirmed",
    )

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


def get_user_bookings(db: Session, user_id: int) -> list[Booking]:
    """Get all bookings for a user."""
    return (
        db.query(Booking)
        .filter(Booking.guest_id == user_id)
        .order_by(Booking.created_at.desc())
        .all()
    )


def cancel_booking(db: Session, booking_id: int, user_id: int) -> Booking:
    """Cancel a booking (owner only)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise ValidationError("Booking not found")

    if booking.guest_id != user_id:
        raise ValidationError("You can only cancel your own bookings")

    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)

    return booking
