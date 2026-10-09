from routers.auth import me_router, router as auth_router
from routers.bookings import router as bookings_router
from routers.health import router as health_router
from routers.host import router as host_router
from routers.listings import router as listings_router
from routers.upload import router as upload_router
from routers.wishlist import router as wishlist_router

__all__ = [
    "auth_router",
    "me_router",
    "bookings_router",
    "health_router",
    "host_router",
    "listings_router",
    "upload_router",
    "wishlist_router",
]

