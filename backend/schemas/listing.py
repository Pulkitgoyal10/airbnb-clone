from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ListingBase(BaseModel):
    title: str
    description: str = ""
    category: str = "Homes"
    city: str
    address: str = ""
    price_per_night: int
    cleaning_fee: int = 0
    max_guests: int = 2
    bedrooms: int = 1
    beds: int = 1
    bathrooms: int = 1
    amenities: list[str] = []
    status: str = "published"


class ListingCreate(ListingBase):
    image_urls: list[str] = []


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    price_per_night: Optional[int] = None
    cleaning_fee: Optional[int] = None
    image_urls: Optional[list[str]] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    amenities: Optional[list[str]] = None
    status: Optional[str] = None


class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    host_id: int
    title: str
    description: str
    category: str
    city: str
    address: str
    price_per_night: int
    cleaning_fee: int
    image_urls: list[str]
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: int
    amenities: list[str]
    status: str
    created_at: datetime
    avg_rating: float
    review_count: int
    guest_favourite: bool
    first_image: Optional[str] = None


class ListingDetailResponse(ListingResponse):
    host: Optional[dict] = None
    reviews: list[dict] = []


class ListingSearchFilters(BaseModel):
    location: Optional[str] = None
    category: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    guests: Optional[int] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    bedrooms: Optional[int] = None
    amenities: Optional[str] = None  # CSV string
    sort: Optional[str] = None
    page: int = 1
    page_size: int = 20


class PaginatedListingsResponse(BaseModel):
    items: list[ListingResponse]
    total: int
    page: int
    page_size: int
    has_more: bool
