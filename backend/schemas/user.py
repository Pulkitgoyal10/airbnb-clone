from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    name: Optional[str] = None
    email: str


class UserLogin(BaseModel):
    email_or_phone: str
    name: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    is_host: bool
    avatar_url: Optional[str] = None
    created_at: datetime


class UserModeUpdate(BaseModel):
    is_host: bool


class UserMeResponse(UserResponse):
    pass


class UserListResponse(BaseModel):
    items: list[UserResponse]
