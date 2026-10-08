from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReviewBase(BaseModel):
    rating: int
    comment: str = ""


class ReviewCreate(ReviewBase):
    reviewer_name: str


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    listing_id: int
    reviewer_name: str
    rating: int
    comment: str
    created_at: datetime
