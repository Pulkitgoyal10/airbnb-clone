'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, MapPin, Users, Bed, Bath, Maximize2, Heart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { listingsApi, wishlistApi, bookingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [listing, setListing] = useState<any>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingData, availabilityData] = await Promise.all([
          listingsApi.getById(Number(params.id)),
          listingsApi.getAvailability(Number(params.id)),
        ]);
        setListing(listingData);
        setAvailability(availabilityData);
      } catch (error) {
        toast.error('Failed to load listing');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  useEffect(() => {
    if (checkIn && checkOut) {
      const fetchQuote = async () => {
        try {
          const quoteData = await listingsApi.getQuote(
            Number(params.id),
            checkIn,
            checkOut,
            guests
          );
          setQuote(quoteData);
        } catch (error) {
          setQuote(null);
        }
      };
      fetchQuote();
    }
  }, [checkIn, checkOut, guests, params.id]);

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please log in to save listings');
      return;
    }

    try {
      if (isSaved) {
        await wishlistApi.remove(Number(params.id));
        setIsSaved(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistApi.add(Number(params.id));
        setIsSaved(true);
        toast.success('Saved to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const handleReserve = () => {
    if (!user) {
      toast.error('Please log in to book');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    router.push(`/book/${params.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!listing) {
    return <div className="min-h-screen flex items-center justify-center">Listing not found</div>;
  }

  const images = listing.image_urls.length ? listing.image_urls : ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'];
  const blockedDates = availability?.blocked_ranges || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-10">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-8">
          <div className="md:col-span-2 aspect-square md:aspect-auto rounded-xl overflow-hidden relative">
            <img
              src={images[currentPhoto % images.length]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => setCurrentPhoto((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white hover:bg-gray-100"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setCurrentPhoto((prev) => (prev + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white hover:bg-gray-100"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          {images.slice(1, 5).map((img: string, i: number) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden hidden md:block">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-semibold mb-2">{listing.title}</h1>
                <div className="flex items-center gap-2 text-sm">
                  <Star size={16} fill="currentColor" />
                  <span className="font-semibold">{listing.avg_rating.toFixed(2)}</span>
                  <span className="text-gray-500">· {listing.review_count} reviews</span>
                  <span className="text-gray-500">· {listing.city}</span>
                </div>
              </div>
              <button
                onClick={toggleWishlist}
                className="flex items-center gap-2 text-sm underline"
              >
                <Heart fill={isSaved ? '#FF385C' : 'none'} color={isSaved ? '#FF385C' : 'black'} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>

            <hr className="my-6" />

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                {listing.host?.name[0] || 'H'}
              </div>
              <div>
                <p className="font-semibold">Hosted by {listing.host?.name || 'Host'}</p>
                <p className="text-sm text-gray-500">Superhost · 5 years hosting</p>
              </div>
            </div>

            <hr className="my-6" />

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <Users size={24} />
                <div>
                  <p className="font-semibold">{listing.max_guests} guests</p>
                  <p className="text-sm text-gray-500">Maximum capacity</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Bed size={24} />
                <div>
                  <p className="font-semibold">{listing.bedrooms} bedrooms</p>
                  <p className="text-sm text-gray-500">Comfortable sleeping</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Bath size={24} />
                <div>
                  <p className="font-semibold">{listing.bathrooms} bathrooms</p>
                  <p className="text-sm text-gray-500">Clean facilities</p>
                </div>
              </div>
            </div>

            <hr className="my-6" />

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">About this place</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            <hr className="my-6" />

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
              <div className="grid grid-cols-2 gap-4">
                {listing.amenities.map((amenity: string) => (
                  <div key={amenity} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr className="my-6" />

            <div>
              <h2 className="text-xl font-semibold mb-4">{listing.reviews.length} reviews</h2>
              <div className="space-y-4">
                {listing.reviews.map((review: any) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        {review.reviewer_name[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{review.reviewer_name}</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Star size={14} fill="currentColor" />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-gray-300 shadow-lg p-6">
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <span className="text-2xl font-semibold">₹{listing.price_per_night.toLocaleString('en-IN')}</span>
                  <span className="text-gray-500"> night</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} fill="currentColor" />
                  <span>{listing.avg_rating.toFixed(2)}</span>
                  <span className="text-gray-500">· {listing.review_count} reviews</span>
                </div>
              </div>

              <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
                <div className="grid grid-cols-2 border-b">
                  <div className="p-3 border-r">
                    <label className="block text-xs font-semibold mb-1">CHECK-IN</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full text-sm outline-none"
                    />
                  </div>
                  <div className="p-3">
                    <label className="block text-xs font-semibold mb-1">CHECK-OUT</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="p-3">
                  <label className="block text-xs font-semibold mb-1">GUESTS</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full text-sm outline-none"
                  >
                    {Array.from({ length: listing.max_guests }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} guest{i + 1 > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleReserve}
                disabled={!checkIn || !checkOut}
                className="w-full rounded-lg bg-gradient-to-r from-[#E61E4D] to-[#BD1E59] text-white font-semibold py-3 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                Reserve
              </button>

              {quote && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="underline">₹{listing.price_per_night.toLocaleString('en-IN')} × {quote.nights} nights</span>
                    <span>₹{quote.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline">Cleaning fee</span>
                    <span>₹{quote.cleaning_fee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="underline">Service fee</span>
                    <span>₹{quote.service_fee.toLocaleString('en-IN')}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{quote.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {blockedDates.length > 0 && (
                <div className="mt-4 text-xs text-gray-500">
                  <p>Blocked dates:</p>
                  <ul className="mt-1 space-y-1">
                    {blockedDates.slice(0, 3).map((range: any, i: number) => (
                      <li key={i}>
                        {format(new Date(range.check_in), 'MMM dd')} - {format(new Date(range.check_out), 'MMM dd')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
