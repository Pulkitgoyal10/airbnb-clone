from pydantic import BaseModel, ConfigDict

from schemas.listing import ListingResponse


class WishlistResponse(BaseModel):
    items: list[ListingResponse]
