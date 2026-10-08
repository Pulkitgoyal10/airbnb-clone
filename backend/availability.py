from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from models import Booking


def ranges_overlap(new_in: date, new_out: date, ex_in: date, ex_out: date) -> bool:
    """Half-open ranges [in, out). Back-to-back stays (out == in) do NOT overlap.
    Equivalent to: NOT (new_in >= ex_out OR new_out <= ex_in)."""
    return new_in < ex_out and new_out > ex_in


def has_conflict(db: Session, listing_id: int, check_in: date, check_out: date,
                 exclude_booking_id: Optional[int] = None) -> bool:
    """True if any CONFIRMED booking on the listing overlaps the requested range."""
    stmt = select(Booking.id).where(
        Booking.listing_id == listing_id,
        Booking.status == "confirmed",
        and_(Booking.check_in < check_out, Booking.check_out > check_in),  # SQL form of the rule
    )
    if exclude_booking_id:
        stmt = stmt.where(Booking.id != exclude_booking_id)
    return db.execute(stmt.limit(1)).first() is not None


def blocked_ranges(db: Session, listing_id: int, from_date: Optional[date] = None) -> List[Tuple[date, date]]:
    """Confirmed bookings as (check_in, check_out) so the UI can disable calendar days."""
    from_date = from_date or date.today()
    stmt = select(Booking.check_in, Booking.check_out).where(
        Booking.listing_id == listing_id,
        Booking.status == "confirmed",
        Booking.check_out > from_date,
    ).order_by(Booking.check_in)
    return [(r.check_in, r.check_out) for r in db.execute(stmt)]