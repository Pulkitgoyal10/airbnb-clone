from datetime import date

from pydantic import BaseModel


class QuoteRequest(BaseModel):
    check_in: date
    check_out: date
    guests: int = 1


class QuoteResponse(BaseModel):
    nights: int
    nightly: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int
