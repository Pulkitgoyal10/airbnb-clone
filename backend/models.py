from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import (
    JSON, Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index,
    Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_host: Mapped[bool] = mapped_column(Boolean, default=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    listings: Mapped[List["Listing"]] = relationship(back_populates="host", cascade="all, delete-orphan")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="guest")
    favorites: Mapped[List["Favorite"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("category IN ('Homes','Experiences','Services')", name="ck_listing_category"),
        CheckConstraint("price_per_night >= 0", name="ck_listing_price"),
        CheckConstraint("status IN ('draft','published')", name="ck_listing_status"),
        Index("ix_listing_city_price", "city", "price_per_night"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(20), default="Homes", index=True)
    city: Mapped[str] = mapped_column(String(80), index=True)
    address: Mapped[str] = mapped_column(String(255), default="")
    price_per_night: Mapped[int] = mapped_column(Integer)          # INR, whole rupees
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    image_urls: Mapped[list] = mapped_column(JSON, default=list)
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    amenities: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="published")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    host: Mapped["User"] = relationship(back_populates="listings")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="listing", cascade="all, delete-orphan")
    reviews: Mapped[List["Review"]] = relationship(back_populates="listing", cascade="all, delete-orphan")

    @property
    def review_count(self) -> int:
        return len(self.reviews)

    @property
    def avg_rating(self) -> float:
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 2) if self.reviews else 0.0

    @property
    def guest_favourite(self) -> bool:
        return self.review_count >= 5 and self.avg_rating >= 4.9


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_booking_dates"),
        CheckConstraint("status IN ('confirmed','cancelled')", name="ck_booking_status"),
        Index("ix_booking_listing_dates", "listing_id", "check_in", "check_out"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    guests: Mapped[int] = mapped_column(Integer, default=1)
    total_price: Mapped[int] = mapped_column(Integer)               # snapshot at booking time
    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    listing: Mapped["Listing"] = relationship(back_populates="bookings")
    guest: Mapped["User"] = relationship(back_populates="bookings")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    reviewer_name: Mapped[str] = mapped_column(String(120))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    listing: Mapped["Listing"] = relationship(back_populates="reviews")


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "listing_id", name="uq_favorite"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))

    user: Mapped["User"] = relationship(back_populates="favorites")