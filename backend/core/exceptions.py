from typing import Any


class APIError(Exception):
    """Base exception for API errors with consistent error shape."""

    def __init__(self, detail: str, code: str, status_code: int = 400):
        self.detail = detail
        self.code = code
        self.status_code = status_code
        super().__init__(detail)


class NotFoundError(APIError):
    """Resource not found."""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, code="NOT_FOUND", status_code=404)


class ForbiddenError(APIError):
    """Access forbidden."""

    def __init__(self, detail: str = "Access forbidden"):
        super().__init__(detail=detail, code="FORBIDDEN", status_code=403)


class ConflictError(APIError):
    """Resource conflict."""

    def __init__(self, detail: str, code: str = "CONFLICT"):
        super().__init__(detail=detail, code=code, status_code=409)


class ValidationError(APIError):
    """Validation error."""

    def __init__(self, detail: str, code: str = "VALIDATION_ERROR"):
        super().__init__(detail=detail, code=code, status_code=400)
