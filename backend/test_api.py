import pytest
from datetime import date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from models import Booking, Listing, User
from services import (
    create_booking,
    cancel_booking,
    create_listing,
    delete_listing,
    calculate_price_quote,
    search_listings,
    update_listing,
)
from services.booking_service import validate_booking_dates
from core.exceptions import ConflictError, ForbiddenError, ValidationError


# Test database setup
TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def sample_user(db):
    """Create a sample user."""
    user = User(
        name="Test User",
        email="test@example.com",
        password_hash="demo",
        is_host=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def sample_listing(db, sample_user):
    """Create a sample listing."""
    listing = Listing(
        host_id=sample_user.id,
        title="Test Listing",
        description="A test listing",
        category="Homes",
        city="Test City",
        address="123 Test St",
        price_per_night=1000,
        cleaning_fee=200,
        max_guests=4,
        bedrooms=2,
        beds=2,
        bathrooms=1,
        amenities=["Wifi", "Kitchen"],
        status="published",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


@pytest.fixture
def sample_guest(db):
    """Create a sample guest user."""
    guest = User(
        name="Guest User",
        email="guest@example.com",
        password_hash="demo",
        is_host=False,
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return guest


class TestBookingOverlap:
    """Test booking overlap edge cases."""

    def test_partial_overlap_rejected(self, db, sample_listing, sample_guest):
        """Test that partial overlap is rejected."""
        today = date.today()

        # Create first booking
        booking1 = create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )
        assert booking1.status == "confirmed"

        # Try to create overlapping booking (partial overlap)
        with pytest.raises(ConflictError) as exc_info:
            create_booking(
                db,
                sample_listing.id,
                sample_guest.id,
                today + timedelta(days=12),
                today + timedelta(days=18),
                2,
            )
        assert exc_info.value.code == "DATES_UNAVAILABLE"

    def test_back_to_back_allowed(self, db, sample_listing, sample_guest):
        """Test that back-to-back bookings are allowed."""
        today = date.today()

        # Create first booking
        booking1 = create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )
        assert booking1.status == "confirmed"

        # Create back-to-back booking (check_out of first == check_in of second)
        booking2 = create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=15),
            today + timedelta(days=20),
            2,
        )
        assert booking2.status == "confirmed"

    def test_cancel_frees_dates(self, db, sample_listing, sample_guest):
        """Test that cancelling a booking frees the dates."""
        today = date.today()

        # Create first booking
        booking1 = create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )
        assert booking1.status == "confirmed"

        # Cancel the booking
        cancelled = cancel_booking(db, booking1.id, sample_guest.id)
        assert cancelled.status == "cancelled"

        # Now we should be able to book the same dates
        booking2 = create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )
        assert booking2.status == "confirmed"

    def test_exact_overlap_rejected(self, db, sample_listing, sample_guest):
        """Test that exact overlap is rejected."""
        today = date.today()

        # Create first booking
        booking1 = create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )
        assert booking1.status == "confirmed"

        # Try to create exact same booking
        with pytest.raises(ConflictError) as exc_info:
            create_booking(
                db,
                sample_listing.id,
                sample_guest.id,
                today + timedelta(days=10),
                today + timedelta(days=15),
                2,
            )
        assert exc_info.value.code == "DATES_UNAVAILABLE"


class TestQuoteMath:
    """Test pricing calculation."""

    def test_quote_calculation(self):
        """Test that quote math is correct."""
        check_in = date(2024, 1, 10)
        check_out = date(2024, 1, 15)  # 5 nights
        price_per_night = 1000
        cleaning_fee = 200

        quote = calculate_price_quote(price_per_night, cleaning_fee, check_in, check_out)

        assert quote["nights"] == 5
        assert quote["nightly"] == 1000
        assert quote["subtotal"] == 5000  # 5 * 1000
        assert quote["cleaning_fee"] == 200
        assert quote["service_fee"] == 700  # 14% of 5000
        assert quote["total"] == 5900  # 5000 + 200 + 700

    def test_service_fee_calculation(self):
        """Test that service fee is exactly 14% of subtotal."""
        check_in = date(2024, 1, 10)
        check_out = date(2024, 1, 13)  # 3 nights
        price_per_night = 2000
        cleaning_fee = 300

        quote = calculate_price_quote(price_per_night, cleaning_fee, check_in, check_out)

        expected_service_fee = int(3 * 2000 * 0.14)  # 840
        assert quote["service_fee"] == expected_service_fee


class TestOwnerOnly:
    """Test owner-only operations."""

    def test_update_listing_owner_only(self, db, sample_listing, sample_user):
        """Test that only the owner can update a listing."""
        other_user = User(
            name="Other User",
            email="other@example.com",
            password_hash="demo",
            is_host=True,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)

        # Try to update with wrong owner
        with pytest.raises(ForbiddenError):
            update_listing(
                db,
                sample_listing.id,
                {"title": "Updated Title"},
                other_user.id,
            )

    def test_delete_listing_owner_only(self, db, sample_listing, sample_user):
        """Test that only the owner can delete a listing."""
        other_user = User(
            name="Other User",
            email="other@example.com",
            password_hash="demo",
            is_host=True,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)

        # Try to delete with wrong owner
        with pytest.raises(ForbiddenError):
            delete_listing(db, sample_listing.id, other_user.id)

    def test_cancel_booking_owner_only(self, db, sample_listing, sample_guest):
        """Test that only the booking owner can cancel."""
        today = date.today()

        booking = create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )

        other_user = User(
            name="Other User",
            email="other@example.com",
            password_hash="demo",
            is_host=False,
        )
        db.add(other_user)
        db.commit()
        db.refresh(other_user)

        # Try to cancel with wrong user
        with pytest.raises(ValidationError):
            cancel_booking(db, booking.id, other_user.id)


class TestSearchFilters:
    """Test search filters and pagination."""

    def test_location_filter(self, db, sample_user):
        """Test location filter (case-insensitive)."""
        listing1 = Listing(
            host_id=sample_user.id,
            title="Listing in Chandigarh",
            description="Test",
            category="Homes",
            city="Chandigarh",
            address="Sector 9",
            price_per_night=1000,
            cleaning_fee=100,
            max_guests=2,
            bedrooms=1,
            beds=1,
            bathrooms=1,
            amenities=[],
            status="published",
        )
        listing2 = Listing(
            host_id=sample_user.id,
            title="Listing in Delhi",
            description="Test",
            category="Homes",
            city="Delhi",
            address="Connaught Place",
            price_per_night=1500,
            cleaning_fee=100,
            max_guests=2,
            bedrooms=1,
            beds=1,
            bathrooms=1,
            amenities=[],
            status="published",
        )
        db.add_all([listing1, listing2])
        db.commit()

        # Search for chandigarh (lowercase)
        listings, total = search_listings(db, location="chandigarh")
        assert total == 1
        assert listings[0].city == "Chandigarh"

    def test_price_range_filter(self, db, sample_user):
        """Test price range filter."""
        listing1 = Listing(
            host_id=sample_user.id,
            title="Cheap Listing",
            description="Test",
            category="Homes",
            city="Test",
            address="Test",
            price_per_night=500,
            cleaning_fee=100,
            max_guests=2,
            bedrooms=1,
            beds=1,
            bathrooms=1,
            amenities=[],
            status="published",
        )
        listing2 = Listing(
            host_id=sample_user.id,
            title="Expensive Listing",
            description="Test",
            category="Homes",
            city="Test",
            address="Test",
            price_per_night=5000,
            cleaning_fee=100,
            max_guests=2,
            bedrooms=1,
            beds=1,
            bathrooms=1,
            amenities=[],
            status="published",
        )
        db.add_all([listing1, listing2])
        db.commit()

        # Search for listings under 2000
        listings, total = search_listings(db, min_price=0, max_price=2000)
        assert total == 1
        assert listings[0].price_per_night == 500

    def test_pagination(self, db, sample_user):
        """Test pagination."""
        # Create 25 listings
        for i in range(25):
            listing = Listing(
                host_id=sample_user.id,
                title=f"Listing {i}",
                description="Test",
                category="Homes",
                city="Test",
                address="Test",
                price_per_night=1000 + i,
                cleaning_fee=100,
                max_guests=2,
                bedrooms=1,
                beds=1,
                bathrooms=1,
                amenities=[],
                status="published",
            )
            db.add(listing)
        db.commit()

        # First page
        listings, total = search_listings(db, page=1, page_size=10)
        assert total == 25
        assert len(listings) == 10

        # Second page
        listings, total = search_listings(db, page=2, page_size=10)
        assert total == 25
        assert len(listings) == 10

        # Third page (5 items)
        listings, total = search_listings(db, page=3, page_size=10)
        assert total == 25
        assert len(listings) == 5

    def test_availability_filter(self, db, sample_listing, sample_guest):
        """Test that listings with confirmed bookings are excluded when filtering by dates."""
        today = date.today()

        # Create a booking
        create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )

        # Search for same dates - should exclude this listing
        listings, total = search_listings(
            db,
            check_in=today + timedelta(days=10),
            check_out=today + timedelta(days=15),
        )
        assert total == 0

        # Search for different dates - should include this listing
        listings, total = search_listings(
            db,
            check_in=today + timedelta(days=20),
            check_out=today + timedelta(days=25),
        )
        assert total == 1


class TestBookingValidation:
    """Test booking validation."""

    def test_check_in_before_today_rejected(self, db, sample_listing, sample_guest):
        """Test that check-in before today is rejected."""
        yesterday = date.today() - timedelta(days=1)

        with pytest.raises(ValidationError) as exc_info:
            create_booking(
                db,
                sample_listing.id,
                sample_guest.id,
                yesterday,
                date.today() + timedelta(days=5),
                2,
            )
        assert "future" in exc_info.value.detail.lower()

    def test_check_out_before_check_in_rejected(self, db, sample_listing, sample_guest):
        """Test that check-out before check-in is rejected."""
        today = date.today()

        with pytest.raises(ValidationError) as exc_info:
            create_booking(
                db,
                sample_listing.id,
                sample_guest.id,
                today + timedelta(days=10),
                today + timedelta(days=5),
                2,
            )
        assert "after" in exc_info.value.detail.lower()

    def test_max_nights_validation(self, db, sample_listing, sample_guest):
        """Test that maximum 30 nights is enforced."""
        today = date.today()

        with pytest.raises(ValidationError) as exc_info:
            create_booking(
                db,
                sample_listing.id,
                sample_guest.id,
                today + timedelta(days=10),
                today + timedelta(days=45),  # 35 nights
                2,
            )
        assert "30" in exc_info.value.detail

    def test_guests_exceeds_max_rejected(self, db, sample_listing, sample_guest):
        """Test that exceeding max_guests is rejected."""
        today = date.today()

        with pytest.raises(ValidationError) as exc_info:
            create_booking(
                db,
                sample_listing.id,
                sample_guest.id,
                today + timedelta(days=10),
                today + timedelta(days=15),
                10,  # Exceeds max_guests=4
            )
        assert "guest" in exc_info.value.detail.lower()


class TestDeleteListing:
    """Test listing deletion with upcoming bookings."""

    def test_delete_with_upcoming_bookings_rejected(self, db, sample_listing, sample_guest):
        """Test that deleting a listing with upcoming bookings is rejected."""
        today = date.today()

        # Create an upcoming booking
        create_booking(
            db,
            sample_listing.id,
            sample_guest.id,
            today + timedelta(days=10),
            today + timedelta(days=15),
            2,
        )

        # Try to delete
        with pytest.raises(ConflictError) as exc_info:
            delete_listing(db, sample_listing.id, sample_listing.host_id)
        assert exc_info.value.code == "HAS_UPCOMING_BOOKINGS"

    def test_delete_with_past_bookings_allowed(self, db, sample_listing, sample_guest):
        """Test that deleting a listing with only past bookings is allowed."""
        today = date.today()

        # Create a past booking
        past_booking = Booking(
            listing_id=sample_listing.id,
            guest_id=sample_guest.id,
            check_in=today - timedelta(days=20),
            check_out=today - timedelta(days=15),
            guests=2,
            total_price=5000,
            status="confirmed",
        )
        db.add(past_booking)
        db.commit()

        # Should be able to delete
        delete_listing(db, sample_listing.id, sample_listing.host_id)

        # Verify listing is deleted
        from models import Listing
        listing = db.query(Listing).filter(Listing.id == sample_listing.id).first()
        assert listing is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
