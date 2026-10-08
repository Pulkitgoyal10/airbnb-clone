# Airbnb Clone API Overview

This document describes all API endpoints for the Airbnb clone backend.

## Base URL
`http://localhost:8000`

## Authentication
Mock authentication using the `X-User-Id` header. If not provided, defaults to the first guest user.

## Error Response Format
All errors follow this format:
```json
{
  "detail": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Health

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Authentication

### POST /api/auth/login
Demo login: find or create user by email/phone (no password check).

**Request Body:**
```json
{
  "email_or_phone": "user@example.com",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "is_host": false,
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00"
}
```

### GET /api/me
Get current user info.

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "is_host": false,
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00"
}
```

### PATCH /api/me/mode
Toggle host mode for current user.

**Request Body:**
```json
{
  "is_host": true
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "user@example.com",
  "is_host": true,
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00"
}
```

### GET /api/auth/users
Get all demo users for switch user menu.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "User 1",
      "email": "user1@example.com",
      "is_host": true,
      "avatar_url": null,
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

---

## Listings

### GET /api/listings
Search listings with filters and pagination.

**Query Parameters:**
- `location` (optional): Filter by city/address/title (case-insensitive)
- `category` (optional): Filter by category (Homes, Experiences, Services)
- `check_in` (optional): ISO date string (YYYY-MM-DD)
- `check_out` (optional): ISO date string (YYYY-MM-DD)
- `guests` (optional): Minimum guest capacity
- `min_price` (optional): Minimum price per night
- `max_price` (optional): Maximum price per night
- `bedrooms` (optional): Minimum bedrooms
- `amenities` (optional): CSV string of amenities
- `sort` (optional): Sort by (price_asc, price_desc, rating)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "host_id": 1,
      "title": "Modern 3BHK villa",
      "description": "A beautiful villa...",
      "category": "Homes",
      "city": "Chandigarh",
      "address": "Sector 9, Chandigarh",
      "price_per_night": 9379,
      "cleaning_fee": 800,
      "image_urls": ["https://..."],
      "max_guests": 6,
      "bedrooms": 3,
      "beds": 4,
      "bathrooms": 3,
      "amenities": ["Wifi", "Kitchen"],
      "status": "published",
      "created_at": "2024-01-01T00:00:00",
      "avg_rating": 4.8,
      "review_count": 8,
      "guest_favourite": true,
      "first_image": "https://..."
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

### GET /api/listings/{id}
Get listing detail with host info and reviews.

**Response:**
```json
{
  "id": 1,
  "host_id": 1,
  "title": "Modern 3BHK villa",
  "description": "A beautiful villa...",
  "category": "Homes",
  "city": "Chandigarh",
  "address": "Sector 9, Chandigarh",
  "price_per_night": 9379,
  "cleaning_fee": 800,
  "image_urls": ["https://..."],
  "max_guests": 6,
  "bedrooms": 3,
  "beds": 4,
  "bathrooms": 3,
  "amenities": ["Wifi", "Kitchen"],
  "status": "published",
  "created_at": "2024-01-01T00:00:00",
  "avg_rating": 4.8,
  "review_count": 8,
  "guest_favourite": true,
  "first_image": "https://...",
  "host": {
    "id": 1,
    "name": "Host Name",
    "avatar_url": "https://..."
  },
  "reviews": [
    {
      "id": 1,
      "reviewer_name": "John",
      "rating": 5,
      "comment": "Great place!",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### GET /api/listings/{id}/availability
Get blocked date ranges for a listing.

**Query Parameters:**
- `from_date` (optional): ISO date string to start from (default: today)

**Response:**
```json
{
  "blocked_ranges": [
    {
      "check_in": "2024-01-10",
      "check_out": "2024-01-15"
    }
  ]
}
```

### POST /api/listings/{id}/quote
Get price quote for a listing.

**Request Body:**
```json
{
  "check_in": "2024-01-10",
  "check_out": "2024-01-15",
  "guests": 2
}
```

**Response:**
```json
{
  "nights": 5,
  "nightly": 9379,
  "subtotal": 46895,
  "cleaning_fee": 800,
  "service_fee": 6565,
  "total": 54260
}
```

### POST /api/listings/{id}/reviews
Create a review for a listing.

**Request Body:**
```json
{
  "reviewer_name": "John Doe",
  "rating": 5,
  "comment": "Great place!"
}
```

**Response:**
```json
{
  "id": 1,
  "listing_id": 1,
  "reviewer_name": "John Doe",
  "rating": 5,
  "comment": "Great place!",
  "created_at": "2024-01-01T00:00:00"
}
```

### GET /api/listings/{id}/reviews
Get all reviews for a listing.

**Response:**
```json
[
  {
    "id": 1,
    "listing_id": 1,
    "reviewer_name": "John Doe",
    "rating": 5,
    "comment": "Great place!",
    "created_at": "2024-01-01T00:00:00"
  }
]
```

### POST /api/listings
Create a new listing (requires host mode).

**Request Body:**
```json
{
  "title": "New Listing",
  "description": "A nice place",
  "category": "Homes",
  "city": "Chandigarh",
  "address": "Sector 10",
  "price_per_night": 5000,
  "cleaning_fee": 500,
  "max_guests": 4,
  "bedrooms": 2,
  "beds": 2,
  "bathrooms": 1,
  "amenities": ["Wifi", "Kitchen"],
  "status": "published",
  "image_urls": ["https://..."]
}
```

**Response:**
```json
{
  "id": 2,
  "host_id": 1,
  "title": "New Listing",
  "description": "A nice place",
  "category": "Homes",
  "city": "Chandigarh",
  "address": "Sector 10",
  "price_per_night": 5000,
  "cleaning_fee": 500,
  "image_urls": ["https://..."],
  "max_guests": 4,
  "bedrooms": 2,
  "beds": 2,
  "bathrooms": 1,
  "amenities": ["Wifi", "Kitchen"],
  "status": "published",
  "created_at": "2024-01-01T00:00:00",
  "avg_rating": 0.0,
  "review_count": 0,
  "guest_favourite": false,
  "first_image": "https://..."
}
```

### PUT /api/listings/{id}
Update a listing (owner only).

**Request Body:**
```json
{
  "title": "Updated Title",
  "price_per_night": 6000
}
```

**Response:**
```json
{
  "id": 1,
  "host_id": 1,
  "title": "Updated Title",
  "description": "A beautiful villa...",
  "category": "Homes",
  "city": "Chandigarh",
  "address": "Sector 9, Chandigarh",
  "price_per_night": 6000,
  "cleaning_fee": 800,
  "image_urls": ["https://..."],
  "max_guests": 6,
  "bedrooms": 3,
  "beds": 4,
  "bathrooms": 3,
  "amenities": ["Wifi", "Kitchen"],
  "status": "published",
  "created_at": "2024-01-01T00:00:00",
  "avg_rating": 4.8,
  "review_count": 8,
  "guest_favourite": true,
  "first_image": "https://..."
}
```

### DELETE /api/listings/{id}
Delete a listing (owner only, no upcoming bookings).

**Response:**
```json
{
  "detail": "Listing deleted successfully"
}
```

**Error (409):**
```json
{
  "detail": "Cannot delete listing with upcoming bookings",
  "code": "HAS_UPCOMING_BOOKINGS"
}
```

---

## Bookings

### POST /api/bookings
Create a new booking with conflict check.

**Request Body:**
```json
{
  "listing_id": 1,
  "check_in": "2024-01-10",
  "check_out": "2024-01-15",
  "guests": 2
}
```

**Response:**
```json
{
  "id": 1,
  "listing_id": 1,
  "guest_id": 1,
  "check_in": "2024-01-10",
  "check_out": "2024-01-15",
  "guests": 2,
  "total_price": 54260,
  "status": "confirmed",
  "created_at": "2024-01-01T00:00:00"
}
```

**Error (409):**
```json
{
  "detail": "Requested dates are not available",
  "code": "DATES_UNAVAILABLE"
}
```

### GET /api/bookings/me
Get all bookings for current user.

**Response:**
```json
[
  {
    "id": 1,
    "listing_id": 1,
    "guest_id": 1,
    "check_in": "2024-01-10",
    "check_out": "2024-01-15",
    "guests": 2,
    "total_price": 54260,
    "status": "confirmed",
    "created_at": "2024-01-01T00:00:00"
  }
]
```

### POST /api/bookings/{id}/cancel
Cancel a booking (owner only).

**Response:**
```json
{
  "id": 1,
  "listing_id": 1,
  "guest_id": 1,
  "check_in": "2024-01-10",
  "check_out": "2024-01-15",
  "guests": 2,
  "total_price": 54260,
  "status": "cancelled",
  "created_at": "2024-01-01T00:00:00"
}
```

---

## Wishlist

### GET /api/wishlist
Get user's wishlist.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "host_id": 1,
      "title": "Modern 3BHK villa",
      "description": "A beautiful villa...",
      "category": "Homes",
      "city": "Chandigarh",
      "address": "Sector 9, Chandigarh",
      "price_per_night": 9379,
      "cleaning_fee": 800,
      "image_urls": ["https://..."],
      "max_guests": 6,
      "bedrooms": 3,
      "beds": 4,
      "bathrooms": 3,
      "amenities": ["Wifi", "Kitchen"],
      "status": "published",
      "created_at": "2024-01-01T00:00:00",
      "avg_rating": 4.8,
      "review_count": 8,
      "guest_favourite": true,
      "first_image": "https://..."
    }
  ]
}
```

### PUT /api/wishlist/{listing_id}
Add a listing to wishlist.

**Response:**
```json
{
  "id": 1,
  "host_id": 1,
  "title": "Modern 3BHK villa",
  "description": "A beautiful villa...",
  "category": "Homes",
  "city": "Chandigarh",
  "address": "Sector 9, Chandigarh",
  "price_per_night": 9379,
  "cleaning_fee": 800,
  "image_urls": ["https://..."],
  "max_guests": 6,
  "bedrooms": 3,
  "beds": 4,
  "bathrooms": 3,
  "amenities": ["Wifi", "Kitchen"],
  "status": "published",
  "created_at": "2024-01-01T00:00:00",
  "avg_rating": 4.8,
  "review_count": 8,
  "guest_favourite": true,
  "first_image": "https://..."
}
```

### DELETE /api/wishlist/{listing_id}
Remove a listing from wishlist.

**Response:**
```json
{
  "detail": "Removed from wishlist"
}
```

---

## Host

### GET /api/host/dashboard
Get host dashboard stats and upcoming reservations.

**Response:**
```json
{
  "stats": {
    "active_listings": 5,
    "upcoming_bookings": 3,
    "total_earnings": 150000
  },
  "reservations": [
    {
      "id": 1,
      "listing_id": 1,
      "guest_id": 2,
      "check_in": "2024-01-10",
      "check_out": "2024-01-15",
      "guests": 2,
      "total_price": 54260,
      "status": "confirmed",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### GET /api/host/listings
Get all listings for the current host.

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "host_id": 1,
      "title": "Modern 3BHK villa",
      "description": "A beautiful villa...",
      "category": "Homes",
      "city": "Chandigarh",
      "address": "Sector 9, Chandigarh",
      "price_per_night": 9379,
      "cleaning_fee": 800,
      "image_urls": ["https://..."],
      "max_guests": 6,
      "bedrooms": 3,
      "beds": 4,
      "bathrooms": 3,
      "amenities": ["Wifi", "Kitchen"],
      "status": "published",
      "created_at": "2024-01-01T00:00:00",
      "avg_rating": 4.8,
      "review_count": 8,
      "guest_favourite": true,
      "first_image": "https://..."
    }
  ]
}
```

---

## Uploads

### POST /api/uploads
Upload a file and return its URL.

**Request:** multipart/form-data with file

**Response:**
```json
{
  "url": "/uploads/uuid-filename.jpg"
}
```

---

## Common Error Codes

- `NOT_FOUND`: Resource not found (404)
- `FORBIDDEN`: Access forbidden (403)
- `DATES_UNAVAILABLE`: Requested dates conflict with existing booking (409)
- `HAS_UPCOMING_BOOKINGS`: Cannot delete listing with upcoming bookings (409)
- `VALIDATION_ERROR`: Input validation failed (400)
- `CONFLICT`: General conflict (409)
