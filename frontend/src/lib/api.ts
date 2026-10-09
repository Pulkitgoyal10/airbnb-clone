const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  code: string;
  detail: string;

  constructor(detail: string, code: string = 'API_ERROR') {
    super(detail);
    this.name = 'ApiError';
    this.detail = detail;
    this.code = code;
  }
}

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new ApiError(response.statusText, 'NETWORK_ERROR');
    }

    throw new ApiError(errorData.detail || 'An error occurred', errorData.code || 'API_ERROR');
  }

  return response.json();
}

// Auth endpoints
export const authApi = {
  login: (emailOrPhone: string, name?: string) =>
    api<{ id: number; name: string; email: string; is_host: boolean; avatar_url: string | null; created_at: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email_or_phone: emailOrPhone, name }),
      }
    ),
  getMe: () =>
    api<{ id: number; name: string; email: string; is_host: boolean; avatar_url: string | null; created_at: string }>(
      '/api/auth/me'
    ),
  updateMode: (isHost: boolean) =>
    api<{ id: number; name: string; email: string; is_host: boolean; avatar_url: string | null; created_at: string }>(
      '/api/me/mode',
      {
        method: 'PATCH',
        body: JSON.stringify({ is_host: isHost }),
      }
    ),
  getUsers: () =>
    api<{ items: Array<{ id: number; name: string; email: string; is_host: boolean; avatar_url: string | null; created_at: string }> }>(
      '/api/auth/users'
    ),
};

// Listings endpoints
export const listingsApi = {
  search: (params: {
    location?: string;
    category?: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
    amenities?: string;
    sort?: string;
    page?: number;
    page_size?: number;
  }) =>
    api<{
      items: Array<{
        id: number;
        host_id: number;
        title: string;
        description: string;
        category: string;
        city: string;
        address: string;
        price_per_night: number;
        cleaning_fee: number;
        image_urls: string[];
        max_guests: number;
        bedrooms: number;
        beds: number;
        bathrooms: number;
        amenities: string[];
        status: string;
        created_at: string;
        avg_rating: number;
        review_count: number;
        guest_favourite: boolean;
        first_image: string | null;
      }>;
      total: number;
      page: number;
      page_size: number;
      has_more: boolean;
    }>(`/api/listings?${new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
          .map(([key, value]) => [key, String(value)]),
      ),
    ).toString()}`),

  getById: (id: number) =>
    api<{
      id: number;
      host_id: number;
      title: string;
      description: string;
      category: string;
      city: string;
      address: string;
      price_per_night: number;
      cleaning_fee: number;
      image_urls: string[];
      max_guests: number;
      bedrooms: number;
      beds: number;
      bathrooms: number;
      amenities: string[];
      status: string;
      created_at: string;
      avg_rating: number;
      review_count: number;
      guest_favourite: boolean;
      first_image: string | null;
      host: { id: number; name: string; avatar_url: string | null } | null;
      reviews: Array<{
        id: number;
        reviewer_name: string;
        rating: number;
        comment: string;
        created_at: string;
      }>;
    }>(`/api/listings/${id}`),

  getAvailability: (id: number, fromDate?: string) =>
    api<{
      blocked_ranges: Array<{ check_in: string; check_out: string }>;
    }>(`/api/listings/${id}/availability${fromDate ? `?from_date=${fromDate}` : ''}`),

  getQuote: (id: number, checkIn: string, checkOut: string, guests: number) =>
    api<{
      nights: number;
      nightly: number;
      subtotal: number;
      cleaning_fee: number;
      service_fee: number;
      total: number;
    }>(`/api/listings/${id}/quote`, {
      method: 'POST',
      body: JSON.stringify({ check_in: checkIn, check_out: checkOut, guests }),
    }),

  createReview: (id: number, reviewerName: string, rating: number, comment: string) =>
    api<{
      id: number;
      listing_id: number;
      reviewer_name: string;
      rating: number;
      comment: string;
      created_at: string;
    }>(`/api/listings/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ reviewer_name: reviewerName, rating, comment }),
    }),

  getReviews: (id: number) =>
    api<Array<{
      id: number;
      listing_id: number;
      reviewer_name: string;
      rating: number;
      comment: string;
      created_at: string;
    }>>(`/api/listings/${id}/reviews`),

  create: (data: {
    title: string;
    description: string;
    category: string;
    city: string;
    address: string;
    price_per_night: number;
    cleaning_fee: number;
    image_urls: string[];
    max_guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    amenities: string[];
    status: string;
  }) =>
    api<{
      id: number;
      host_id: number;
      title: string;
      description: string;
      category: string;
      city: string;
      address: string;
      price_per_night: number;
      cleaning_fee: number;
      image_urls: string[];
      max_guests: number;
      bedrooms: number;
      beds: number;
      bathrooms: number;
      amenities: string[];
      status: string;
      created_at: string;
      avg_rating: number;
      review_count: number;
      guest_favourite: boolean;
      first_image: string | null;
    }>(`/api/listings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<{
    title: string;
    description: string;
    category: string;
    city: string;
    address: string;
    price_per_night: number;
    cleaning_fee: number;
    image_urls: string[];
    max_guests: number;
    bedrooms: number;
    beds: number;
    bathrooms: number;
    amenities: string[];
    status: string;
  }>) =>
    api<{
      id: number;
      host_id: number;
      title: string;
      description: string;
      category: string;
      city: string;
      address: string;
      price_per_night: number;
      cleaning_fee: number;
      image_urls: string[];
      max_guests: number;
      bedrooms: number;
      beds: number;
      bathrooms: number;
      amenities: string[];
      status: string;
      created_at: string;
      avg_rating: number;
      review_count: number;
      guest_favourite: boolean;
      first_image: string | null;
    }>(`/api/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api<{ detail: string }>(`/api/listings/${id}`, {
      method: 'DELETE',
    }),
};

// Bookings endpoints
export const bookingsApi = {
  create: (listingId: number, checkIn: string, checkOut: string, guests: number) =>
    api<{
      id: number;
      listing_id: number;
      guest_id: number;
      check_in: string;
      check_out: string;
      guests: number;
      total_price: number;
      status: string;
      created_at: string;
    }>(`/api/bookings`, {
      method: 'POST',
      body: JSON.stringify({
        listing_id: listingId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      }),
    }),

  getMyBookings: () =>
    api<Array<{
      id: number;
      listing_id: number;
      guest_id: number;
      check_in: string;
      check_out: string;
      guests: number;
      total_price: number;
      status: string;
      created_at: string;
    }>>(`/api/bookings/me`),

  cancel: (id: number) =>
    api<{
      id: number;
      listing_id: number;
      guest_id: number;
      check_in: string;
      check_out: string;
      guests: number;
      total_price: number;
      status: string;
      created_at: string;
    }>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
    }),
};

// Wishlist endpoints
export const wishlistApi = {
  get: () =>
    api<{
      items: Array<{
        id: number;
        host_id: number;
        title: string;
        description: string;
        category: string;
        city: string;
        address: string;
        price_per_night: number;
        cleaning_fee: number;
        image_urls: string[];
        max_guests: number;
        bedrooms: number;
        beds: number;
        bathrooms: number;
        amenities: string[];
        status: string;
        created_at: string;
        avg_rating: number;
        review_count: number;
        guest_favourite: boolean;
        first_image: string | null;
      }>;
    }>(`/api/wishlist`),

  add: (listingId: number) =>
    api<{
      id: number;
      host_id: number;
      title: string;
      description: string;
      category: string;
      city: string;
      address: string;
      price_per_night: number;
      cleaning_fee: number;
      image_urls: string[];
      max_guests: number;
      bedrooms: number;
      beds: number;
      bathrooms: number;
      amenities: string[];
      status: string;
      created_at: string;
      avg_rating: number;
      review_count: number;
      guest_favourite: boolean;
      first_image: string | null;
    }>(`/api/wishlist/${listingId}`, {
      method: 'PUT',
    }),

  remove: (listingId: number) =>
    api<{ detail: string }>(`/api/wishlist/${listingId}`, {
      method: 'DELETE',
    }),
};

// Host endpoints
export const hostApi = {
  getDashboard: () =>
    api<{
      stats: {
        active_listings: number;
        upcoming_bookings: number;
        total_earnings: number;
      };
      reservations: Array<{
        id: number;
        listing_id: number;
        guest_id: number;
        check_in: string;
        check_out: string;
        guests: number;
        total_price: number;
        status: string;
        created_at: string;
      }>;
    }>(`/api/host/dashboard`),

  getListings: () =>
    api<{
      items: Array<{
        id: number;
        host_id: number;
        title: string;
        description: string;
        category: string;
        city: string;
        address: string;
        price_per_night: number;
        cleaning_fee: number;
        image_urls: string[];
        max_guests: number;
        bedrooms: number;
        beds: number;
        bathrooms: number;
        amenities: string[];
        status: string;
        created_at: string;
        avg_rating: number;
        review_count: number;
        guest_favourite: boolean;
        first_image: string | null;
      }>;
    }>(`/api/host/listings`),
};

// Upload endpoint
export const uploadApi = {
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (userId) {
      headers['X-User-Id'] = userId;
    }

    const response = await fetch(`${API_URL}/api/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError('Upload failed', 'UPLOAD_ERROR');
    }

    return response.json();
  },
};
