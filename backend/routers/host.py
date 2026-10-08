from typing import Annotated

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from database import get_db
from models import User
from schemas.booking import BookingResponse
from schemas.host import HostDashboardResponse, HostListingsResponse
from schemas.listing import ListingResponse
from services import get_host_dashboard, get_host_listings
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/host", tags=["host"])


@router.get("/dashboard", response_model=HostDashboardResponse)
def get_dashboard(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Get host dashboard stats and upcoming reservations."""
    return get_host_dashboard(db, current_user.id)


@router.get("/listings", response_model=HostListingsResponse)
def get_host_listings_endpoint(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Get all listings for the current host."""
    listings = get_host_listings(db, current_user.id)
    return {"items": listings}
