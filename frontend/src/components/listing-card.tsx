'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { formatInr, listingImages, type ListingSummary } from '@/lib/types';
import { useWishlist } from '@/context/WishlistContext';

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const [photo, setPhoto] = useState(0);
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(listing.id);
  const photos = listingImages(listing);

  return (
    <article className="group min-w-0">
      <Link href={`/rooms/${listing.id}`} className="block">
        <div className="relative mb-3 aspect-[20/19] w-full overflow-hidden rounded-xl bg-[#eee]">
          <img src={photos[photo % photos.length]} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          <button
            type="button"
            aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void toggle(listing.id, listing);
            }}
            className={`heart absolute right-3 top-3 transition-transform active:scale-125 ${saved ? 'saved' : ''}`}
          >
            <Heart fill={saved ? '#FF385C' : 'none'} color={saved ? '#FF385C' : 'white'} size={22} />
          </button>
          {listing.guest_favourite && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold">Guest favourite</span>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-[#222]">Prices include all fees</span>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                className="carousel-arrow left-3"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhoto((value) => (value - 1 + photos.length) % photos.length);
                }}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                className="carousel-arrow right-3"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhoto((value) => (value + 1) % photos.length);
                }}
              >
                <ChevronRight />
              </button>
            </>
          )}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            {Array.from({ length: Math.min(5, photos.length) }, (_, i) => (
              <span key={i} aria-hidden="true" className={`size-1.5 rounded-full ${i === photo % 5 ? 'bg-white' : 'bg-white/60'}`} />
            ))}
          </div>
        </div>
      </Link>
      <div>
        <div className="flex items-start justify-between gap-2 text-[15px]">
          <b className="font-semibold text-[#222222]">{listing.title}</b>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Star size={13} fill="currentColor" /> {listing.avg_rating ? listing.avg_rating.toFixed(2) : 'New'}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {listing.city} · {listing.bedrooms} beds · {listing.bathrooms} bath
        </p>
        <p className="mt-2 text-sm">
          <b>{formatInr(listing.price_per_night)}</b> <span className="font-normal text-gray-500">night</span>
        </p>
      </div>
    </article>
  );
}
