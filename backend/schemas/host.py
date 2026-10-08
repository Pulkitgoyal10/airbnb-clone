from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from schemas.booking import BookingResponse
from schemas.listing import ListingResponse


class HostDashboardStats(BaseModel):
    active_listings: int
    upcoming_bookings: int
    total_earnings: int


class HostDashboardResponse(BaseModel):
    stats: HostDashboardStats
    reservations: list[BookingResponse]


class HostListingsResponse(BaseModel):
    items: list[ListingResponse]
