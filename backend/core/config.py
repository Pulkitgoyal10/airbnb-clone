import os


def get_cors_origins() -> list[str]:
    """Get CORS origins from environment variable."""
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in origins.split(",")]
