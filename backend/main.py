from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import Base, engine
from core import get_cors_origins, APIError
from routers import (
    auth_router,
    me_router,
    bookings_router,
    health_router,
    host_router,
    listings_router,
    upload_router,
    wishlist_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Seed database if empty
    from database import SessionLocal
    from models import User

    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Database is empty. Running seed...")
            import seed
            seed.main()
        else:
            print(f"Database has {user_count} users. Skipping seed.")
    finally:
        db.close()

    yield

    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Airbnb Clone API",
    description="Backend API for Airbnb clone application",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler for consistent error shape
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )

# Include routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(listings_router)
app.include_router(bookings_router)
app.include_router(wishlist_router)
app.include_router(host_router)
app.include_router(upload_router)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
