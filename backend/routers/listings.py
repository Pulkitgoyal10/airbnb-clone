from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from core.auth import get_current_user
from database import get_db
from models import User
from schemas.availability import AvailabilityResponse, BlockedRange
from schemas.listing import (
    ListingCreate,
    ListingDetailResponse,
    ListingResponse,
    ListingSearchFilters,
    ListingUpdate,
    PaginatedListingsResponse,
)
from schemas.quote import QuoteRequest, QuoteResponse
from schemas.review import ReviewCreate, ReviewResponse
from services import (
    calculate_price_quote,
    create_listing,
    delete_listing,
    get_blocked_ranges,
    get_listing_detail,
    get_listing_by_id,
    search_listings,
    update_listing,
)
from services.review_service import create_review, get_listing_reviews
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/listings", tags=["listings"])


@router.get("", response_model=PaginatedListingsResponse)
def search(
    db: Annotated[Session, Depends(get_db)],
    location: str | None = None,
    category: str | None = None,
    check_in: str | None = None,
    check_out: str | None = None,
    guests: int | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    bedrooms: int | None = None,
    amenities: str | None = None,
    sort: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    """Search listings with filters and pagination."""
    # Parse dates if provided
    check_in_date = date.fromisoformat(check_in) if check_in else None
    check_out_date = date.fromisoformat(check_out) if check_out else None

    # Parse amenities CSV
    amenities_list = amenities.split(",") if amenities else None

    listings, total = search_listings(
        db=db,
        location=location,
        category=category,
        check_in=check_in_date,
        check_out=check_out_date,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        bedrooms=bedrooms,
        amenities=amenities_list,
        sort=sort,
        page=page,
        page_size=page_size,
    )

    has_more = page * page_size < total

    return {
        "items": listings,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": has_more,
    }


@router.get("/{listing_id}", response_model=ListingDetailResponse)
def get_listing(
    listing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Get listing detail with host info and reviews."""
    return get_listing_detail(db, listing_id)


@router.get("/{listing_id}/availability", response_model=AvailabilityResponse)
def get_availability(
    listing_id: int,
    db: Annotated[Session, Depends(get_db)],
    from_date: str | None = None,
) -> dict:
    """Get blocked date ranges for a listing."""
    from_date_parsed = date.fromisoformat(from_date) if from_date else None
    ranges = get_blocked_ranges(db, listing_id, from_date_parsed)
    return {
        "blocked_ranges": [
            {"check_in": r[0], "check_out": r[1]} for r in ranges
        ]
    }


@router.post("/{listing_id}/quote", response_model=QuoteResponse)
def get_quote(
    listing_id: int,
    quote_req: QuoteRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Get price quote for a listing."""
    listing = get_listing_by_id(db, listing_id)
    return calculate_price_quote(
        listing.price_per_night,
        listing.cleaning_fee,
        quote_req.check_in,
        quote_req.check_out,
    )


@router.post("/{listing_id}/reviews", response_model=ReviewResponse)
def create_listing_review(
    listing_id: int,
    review_data: ReviewCreate,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Create a review for a listing."""
    review = create_review(db, listing_id, review_data.model_dump())
    return review


@router.get("/{listing_id}/reviews", response_model=list[ReviewResponse])
def get_listing_reviews_endpoint(
    listing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> list:
    """Get all reviews for a listing."""
    return get_listing_reviews(db, listing_id)


@router.post("", response_model=ListingResponse)
def create_new_listing(
    listing_data: ListingCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Create a new listing (requires host mode)."""
    return create_listing(db, listing_data.model_dump(), current_user.id)


@router.put("/{listing_id}", response_model=ListingResponse)
def update_listing_endpoint(
    listing_id: int,
    listing_data: ListingUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Update a listing (owner only)."""
    update_dict = {k: v for k, v in listing_data.model_dump().items() if v is not None}
    return update_listing(db, listing_id, update_dict, current_user.id)


@router.delete("/{listing_id}")
def delete_listing_endpoint(
    listing_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Delete a listing (owner only, no upcoming bookings)."""
    delete_listing(db, listing_id, current_user.id)
    return {"detail": "Listing deleted successfully"}
