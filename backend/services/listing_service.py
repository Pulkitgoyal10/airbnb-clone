from datetime import date, datetime
from typing import Optional

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from availability import has_conflict
from core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from models import Booking, Listing, Review, User


def calculate_price_quote(
    price_per_night: int,
    cleaning_fee: int,
    check_in: date,
    check_out: date,
) -> dict:
    """Calculate pricing breakdown for a booking."""
    nights = (check_out - check_in).days
    nightly_total = nights * price_per_night
    subtotal = nightly_total
    service_fee = int(subtotal * 0.14)
    total = subtotal + cleaning_fee + service_fee

    return {
        "nights": nights,
        "nightly": price_per_night,
        "subtotal": subtotal,
        "cleaning_fee": cleaning_fee,
        "service_fee": service_fee,
        "total": total,
    }


def get_listing_by_id(db: Session, listing_id: int) -> Listing:
    """Get listing by ID."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise NotFoundError("Listing not found")
    return listing


def search_listings(
    db: Session,
    location: Optional[str] = None,
    category: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    bedrooms: Optional[int] = None,
    amenities: Optional[list[str]] = None,
    sort: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Listing], int]:
    """Search listings with filters and pagination."""
    query = db.query(Listing).filter(Listing.status == "published")

    # Location filter (case-insensitive match on city, address, or title)
    if location:
        location_lower = f"%{location.lower()}%"
        query = query.filter(
            or_(
                func.lower(Listing.city).like(location_lower),
                func.lower(Listing.address).like(location_lower),
                func.lower(Listing.title).like(location_lower),
            )
        )

    # Category filter
    if category:
        query = query.filter(Listing.category == category)

    # Guest capacity filter
    if guests:
        query = query.filter(Listing.max_guests >= guests)

    # Price range filter
    if min_price is not None:
        query = query.filter(Listing.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price_per_night <= max_price)

    # Bedrooms filter
    if bedrooms:
        query = query.filter(Listing.bedrooms >= bedrooms)

    # Amenities filter (listing must have all requested amenities)
    if amenities:
        for amenity in amenities:
            query = query.filter(Listing.amenities.contains([amenity]))

    # Date availability filter - exclude listings with overlapping confirmed bookings
    if check_in and check_out:
        # Use a subquery to check for conflicts efficiently
        conflict_subquery = (
            select(Booking.listing_id)
            .where(
                Booking.status == "confirmed",
                Booking.check_in < check_out,
                Booking.check_out > check_in,
            )
            .distinct()
        )
        query = query.filter(~Listing.id.in_(conflict_subquery))

    # Sorting
    if sort == "price_asc":
        query = query.order_by(Listing.price_per_night.asc())
    elif sort == "price_desc":
        query = query.order_by(Listing.price_per_night.desc())
    elif sort == "rating":
        # This is a simplified sort by avg_rating (could be optimized with a join)
        listings = query.all()
        listings.sort(key=lambda l: l.avg_rating, reverse=True)
        # Apply pagination manually after sorting
        total = len(listings)
        start = (page - 1) * page_size
        end = start + page_size
        return listings[start:end], total
    else:
        # Default sort by created_at desc
        query = query.order_by(Listing.created_at.desc())

    # Get total count
    total = query.count()

    # Apply pagination
    start = (page - 1) * page_size
    listings = query.offset(start).limit(page_size).all()

    return listings, total


def create_listing(db: Session, listing_data: dict, host_id: int) -> Listing:
    """Create a new listing."""
    listing = Listing(host_id=host_id, **listing_data)
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def update_listing(db: Session, listing_id: int, listing_data: dict, user_id: int) -> Listing:
    """Update a listing (owner only)."""
    listing = get_listing_by_id(db, listing_id)
    if listing.host_id != user_id:
        raise ForbiddenError("You can only edit your own listings")

    for key, value in listing_data.items():
        if value is not None:
            setattr(listing, key, value)

    db.commit()
    db.refresh(listing)
    return listing


def delete_listing(db: Session, listing_id: int, user_id: int) -> None:
    """Delete a listing (owner only) if no upcoming bookings."""
    listing = get_listing_by_id(db, listing_id)
    if listing.host_id != user_id:
        raise ForbiddenError("You can only delete your own listings")

    # Check for upcoming confirmed bookings
    today = date.today()
    upcoming_booking = (
        db.query(Booking)
        .filter(
            Booking.listing_id == listing_id,
            Booking.status == "confirmed",
            Booking.check_in >= today,
        )
        .first()
    )

    if upcoming_booking:
        raise ConflictError(
            "Cannot delete listing with upcoming bookings",
            code="HAS_UPCOMING_BOOKINGS",
        )

    db.delete(listing)
    db.commit()


def get_listing_detail(db: Session, listing_id: int) -> dict:
    """Get listing with host info, reviews, and rating aggregates."""
    listing = get_listing_by_id(db, listing_id)

    # Get host info
    host = db.query(User).filter(User.id == listing.host_id).first()

    # Get reviews
    reviews = db.query(Review).filter(Review.listing_id == listing_id).all()

    return {
        "id": listing.id,
        "host_id": listing.host_id,
        "title": listing.title,
        "description": listing.description,
        "category": listing.category,
        "city": listing.city,
        "address": listing.address,
        "price_per_night": listing.price_per_night,
        "cleaning_fee": listing.cleaning_fee,
        "image_urls": listing.image_urls,
        "max_guests": listing.max_guests,
        "bedrooms": listing.bedrooms,
        "beds": listing.beds,
        "bathrooms": listing.bathrooms,
        "amenities": listing.amenities,
        "status": listing.status,
        "created_at": listing.created_at,
        "avg_rating": listing.avg_rating,
        "review_count": listing.review_count,
        "guest_favourite": listing.guest_favourite,
        "first_image": listing.image_urls[0] if listing.image_urls else None,
        "host": {
            "id": host.id,
            "name": host.name,
            "avatar_url": host.avatar_url,
        } if host else None,
        "reviews": [
            {
                "id": r.id,
                "reviewer_name": r.reviewer_name,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at,
            }
            for r in reviews
        ],
    }


def get_blocked_ranges(db: Session, listing_id: int, from_date: Optional[date] = None) -> list[tuple[date, date]]:
    """Get blocked date ranges for a listing."""
    from availability import blocked_ranges
    return blocked_ranges(db, listing_id, from_date)
