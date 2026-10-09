'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { bookingsApi, listingsApi } from '@/lib/api';
import { AirbnbLogo } from '@/components/layout/AirbnbLogo';
import { formatInr, listingImages, type Booking, type ListingDetail } from '@/lib/types';

export default function BookingConfirmedPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const bookings = await bookingsApi.getMyBookings();
        const found = bookings.find((b) => b.id === Number(params.bookingId)) || null;
        setBooking(found);
        if (found) setListing(await listingsApi.getById(found.listing_id));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [params.bookingId]);

  if (loading) return <div className="py-20 text-center">Loading…</div>;
  if (!booking || !listing) return <div className="py-20 text-center">Booking not found</div>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-14 text-center">
      <Link href="/" aria-label="Airbnb home" className="inline-block mb-6">
        <AirbnbLogo className="h-8 w-auto text-[#FF385C] mx-auto" height={32} />
      </Link>
      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#fff0f3] text-4xl text-[#FF385C]">✓</div>
      <h1 className="mt-6 text-3xl font-semibold">Your trip is confirmed</h1>
      <p className="mt-3 text-[#666]">Your {listing.city} stay is booked. We&apos;ve sent the details to your email.</p>
      <div className="mx-auto mt-8 max-w-md rounded-2xl border p-5 text-left">
        <div className="flex gap-4">
          <img src={listingImages(listing)[0]} alt="" className="size-24 rounded-xl object-cover" />
          <div>
            <b>{listing.title}</b>
            <p className="mt-2 text-sm text-[#666]">{booking.check_in} – {booking.check_out}</p>
            <p className="mt-1 text-sm">{booking.guests} guests · {formatInr(booking.total_price)}</p>
          </div>
        </div>
      </div>
      <button onClick={() => router.push('/trips')} className="gradient-button mt-7 inline-block">View trips</button>
    </main>
  );
}
