from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BookingBase(BaseModel):
    check_in: date
    check_out: date
    guests: int = 1


class BookingCreate(BookingBase):
    listing_id: int


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int
    total_price: int
    status: str
    created_at: datetime


class BookingDetailResponse(BookingResponse):
    listing: Optional[dict] = None
    guest: Optional[dict] = None
