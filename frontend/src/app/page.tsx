'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { listingsApi, wishlistApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';

type Tab = 'all' | 'homes' | 'experiences' | 'services';

interface Listing {
  id: number;
  title: string;
  city: string;
  price_per_night: number;
  image_urls: string[];
  avg_rating: number;
  review_count: number;
  guest_favourite: boolean;
  first_image: string | null;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as Tab || 'homes';
  const [tab, setTab] = useState<Tab>(categoryParam);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useUser();
  const [savedListings, setSavedListings] = useState<Set<number>>(new Set());

  const fetchListings = useCallback(async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const category = tab === 'all' ? undefined : tab === 'homes' ? 'Homes' : tab === 'experiences' ? 'Experiences' : 'Services';
      const data = await listingsApi.search({
        category,
        location: location || undefined,
        page: pageNum,
        page_size: 20,
      });

      if (reset) {
        setListings(data.items);
      } else {
        setListings(prev => [...prev, ...data.items]);
      }
      setHasMore(data.has_more);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [tab, location]);

  const debouncedFetch = useCallback(debounce((loc: string) => {
    setPage(1);
    fetchListings(1, true);
  }, 500), [fetchListings]);

  useEffect(() => {
    fetchListings(1, true);
  }, [tab]);

  useEffect(() => {
    if (location) {
      debouncedFetch(location);
    }
  }, [location, debouncedFetch]);

  const toggleWishlist = async (listingId: number, isSaved: boolean) => {
    if (!user) {
      toast.error('Please log in to save listings');
      return;
    }

    try {
      if (isSaved) {
        await wishlistApi.remove(listingId);
        setSavedListings(prev => {
          const newSet = new Set(prev);
          newSet.delete(listingId);
          return newSet;
        });
        toast.success('Removed from wishlist');
      } else {
        await wishlistApi.add(listingId);
        setSavedListings(prev => new Set(prev).add(listingId));
        toast.success('Saved to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const ListingCard = ({ listing }: { listing: Listing }) => {
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const isSaved = savedListings.has(listing.id);
    const images = listing.image_urls.length ? listing.image_urls : ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'];

    return (
      <Link href={`/rooms/${listing.id}`} className="group block">
        <div className="relative w-full aspect-[20/19] rounded-xl overflow-hidden mb-3 bg-gray-200">
          <img
            src={images[currentPhoto % images.length]}
            alt={listing.title}
            className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(listing.id, isSaved);
            }}
            className={`absolute right-3 top-3 p-2 rounded-full transition-transform active:scale-125 ${isSaved ? 'bg-white' : 'bg-white/80'}`}
          >
            <Heart fill={isSaved ? '#FF385C' : 'none'} color={isSaved ? '#FF385C' : 'black'} size={20} />
          </button>
          {listing.guest_favourite && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-semibold text-sm">
              Guest favourite
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              setCurrentPhoto((prev) => (prev - 1 + images.length) % images.length);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setCurrentPhoto((prev) => (prev + 1) % images.length);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
            <div className="flex items-center gap-1">
              <Star size={14} fill="currentColor" />
              <span className="text-sm">{listing.avg_rating.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">{listing.city}</p>
          <p className="text-gray-500 text-sm">{listing.review_count} reviews</p>
          <p className="mt-1">
            <span className="font-semibold">₹{listing.price_per_night.toLocaleString('en-IN')}</span>
            <span className="text-gray-500"> night</span>
          </p>
        </div>
      </Link>
    );
  };

  if (tab === 'experiences' || tab === 'services') {
    return (
      <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-10">
        <div className="flex items-center gap-7 mb-8">
          {(['all', 'homes', 'experiences', 'services'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`capitalize pb-2 border-b-2 transition-colors ${
                tab === t ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold mb-4">Coming soon</h2>
          <p className="text-gray-500">{tab === 'experiences' ? 'Experiences' : 'Services'} will be available soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-10">
        <div className="flex items-center gap-7 mb-8">
          {(['all', 'homes', 'experiences', 'services'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`capitalize pb-2 border-b-2 transition-colors ${
                tab === t ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mb-8 flex gap-4">
          <input
            type="text"
            placeholder="Search by location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:border-black"
          />
        </div>

        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[20/19] rounded-xl bg-gray-200 mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchListings(nextPage, false);
                  }}
                  disabled={loading}
                  className="rounded-lg bg-gray-900 px-8 py-3 text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Show more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
