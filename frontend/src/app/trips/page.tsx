'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { bookingsApi, listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { formatInr, listingImages, type Booking, type ListingDetail } from '@/lib/types';

type Tab = 'upcoming' | 'past' | 'cancelled';

export default function TripsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Record<number, ListingDetail>>({});
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<number | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    const load = async () => {
      try {
        const data = await bookingsApi.getMyBookings();
        setBookings(data);
        const map: Record<number, ListingDetail> = {};
        await Promise.all(
          data.map(async (booking) => {
            try {
              map[booking.listing_id] = await listingsApi.getById(booking.listing_id);
            } catch {
              /* ignore missing listing */
            }
          }),
        );
        setListings(map);
      } catch {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user, userLoading, router]);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await bookingsApi.cancel(cancelId);
      setBookings((prev) => prev.map((b) => (b.id === cancelId ? { ...b, status: 'cancelled' } : b)));
      setCancelId(null);
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = bookings.filter((booking) => {
    if (tab === 'upcoming') return booking.status === 'confirmed' && booking.check_in >= today;
    if (tab === 'past') return booking.status === 'confirmed' && booking.check_out < today;
    return booking.status === 'cancelled';
  });

  if (loading || userLoading) return <div className="py-20 text-center">Loading…</div>;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Trips</h1>
      <div className="mt-8 flex gap-6 border-b">
        {(['upcoming', 'past', 'cancelled'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`capitalize pb-4 ${tab === t ? 'border-b-2 border-black font-semibold' : 'text-[#666]'}`}>
            {t}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="py-20 text-center text-[#666]">No {tab} trips</p>
      ) : (
        filtered.map((booking) => {
          const listing = listings[booking.listing_id];
          if (!listing) return null;
          return (
            <div key={booking.id} className="mt-8 rounded-2xl border p-5 md:flex md:items-center md:justify-between">
              <div className="flex gap-4">
                <img src={listingImages(listing)[0]} alt="" className="size-28 rounded-xl object-cover" />
                <div>
                  <h2 className="font-semibold">{listing.title}</h2>
                  <p className="mt-2 text-sm text-[#666]">{booking.check_in} – {booking.check_out}</p>
                  <p className="mt-1 text-sm text-[#666]">{booking.guests} guests · {booking.status} · {formatInr(booking.total_price)}</p>
                </div>
              </div>
              {booking.status === 'confirmed' && booking.check_in >= today && (
                <button onClick={() => setCancelId(booking.id)} className="mt-5 rounded-lg border px-4 py-3 font-semibold md:mt-0">
                  Cancel trip
                </button>
              )}
            </div>
          );
        })
      )}
      {cancelId && (
        <div className="modal-backdrop">
          <div className="w-[min(440px,calc(100vw-32px))] rounded-3xl bg-white p-7">
            <button onClick={() => setCancelId(null)} className="float-right" aria-label="Close">
              <X />
            </button>
            <h2 className="text-xl font-semibold">Cancel this trip?</h2>
            <p className="mt-3 text-sm text-[#555]">Your cancellation policy allows a full refund.</p>
            <button onClick={() => setCancelId(null)} className="gradient-button mt-6 w-full">Keep trip</button>
            <button onClick={handleCancel} className="mt-3 w-full py-3 font-semibold underline">Cancel trip</button>
          </div>
        </div>
      )}
    </main>
  );
}
