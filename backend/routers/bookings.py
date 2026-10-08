from typing import Annotated

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from database import get_db
from models import User
from schemas.booking import BookingCreate, BookingDetailResponse, BookingResponse
from services import cancel_booking, create_booking, get_user_bookings
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", response_model=BookingResponse)
def create_new_booking(
    booking_data: BookingCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Create a new booking with conflict check."""
    booking = create_booking(
        db=db,
        listing_id=booking_data.listing_id,
        guest_id=current_user.id,
        check_in=booking_data.check_in,
        check_out=booking_data.check_out,
        guests=booking_data.guests,
    )
    return booking


@router.get("/me", response_model=list[BookingResponse])
def get_my_bookings(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list:
    """Get all bookings for current user."""
    return get_user_bookings(db, current_user.id)


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking_endpoint(
    booking_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Cancel a booking (owner only)."""
    return cancel_booking(db, booking_id, current_user.id)
