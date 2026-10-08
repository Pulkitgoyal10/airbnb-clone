'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { wishlistApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function WishlistsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const data = await wishlistApi.get();
        setWishlist(data.items);
      } catch (error) {
        toast.error('Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user, router]);

  const handleRemove = async (listingId: number) => {
    try {
      await wishlistApi.remove(listingId);
      setWishlist(wishlist.filter(item => item.id !== listingId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-10">
        <h1 className="text-3xl font-semibold mb-8">Wishlists</h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">No saved places yet</p>
            <p className="text-gray-400 mt-2">When you save a place, it'll appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {wishlist.map((listing) => {
              const [currentPhoto, setCurrentPhoto] = useState(0);
              const images = listing.image_urls.length ? listing.image_urls : ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'];

              return (
                <div key={listing.id} className="group">
                  <Link href={`/rooms/${listing.id}`}>
                    <div className="relative w-full aspect-[20/19] rounded-xl overflow-hidden mb-3 bg-gray-200">
                      <img
                        src={images[currentPhoto % images.length]}
                        alt={listing.title}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(listing.id);
                        }}
                        className="absolute right-3 top-3 p-2 rounded-full bg-white hover:bg-gray-100"
                      >
                        <Heart fill="#FF385C" color="#FF385C" size={20} />
                      </button>
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
                  </Link>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
