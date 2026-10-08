export type User = {
  id: number;
  name: string;
  email: string;
  is_host: boolean;
  avatar_url: string | null;
  created_at: string;
};

export type ListingSummary = {
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
};

export type ListingDetail = ListingSummary & {
  host: { id: number; name: string; avatar_url: string | null } | null;
  reviews: Array<{
    id: number;
    reviewer_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
};

export type Booking = {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
};

export type Quote = {
  nights: number;
  nightly: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
};

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85';

export function formatInr(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function listingImages(listing: { image_urls?: string[]; first_image?: string | null }) {
  if (listing.image_urls?.length) return listing.image_urls;
  if (listing.first_image) return [listing.first_image];
  return [FALLBACK_IMAGE];
}
