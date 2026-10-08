from datetime import date

from pydantic import BaseModel


class BlockedRange(BaseModel):
    check_in: date
    check_out: date


class AvailabilityResponse(BaseModel):
    blocked_ranges: list[BlockedRange]
