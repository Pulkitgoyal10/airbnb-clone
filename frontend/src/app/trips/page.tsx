'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsApi, listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { Calendar, MapPin, X, ChevronDown } from 'lucide-react';

type Tab = 'upcoming' | 'past' | 'cancelled';

export default function TripsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [listings, setListings] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        router.push('/');
        return;
      }

      try {
        const data = await bookingsApi.getMyBookings();
        setBookings(data);

        // Fetch listings for each booking
        const listingMap: Record<number, any> = {};
        await Promise.all(
          data.map(async (booking: any) => {
            try {
              const listing = await listingsApi.getById(booking.listing_id);
              listingMap[booking.listing_id] = listing;
            } catch (error) {
              console.error('Failed to fetch listing', booking.listing_id);
            }
          })
        );
        setListings(listingMap);
      } catch (error) {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [user, router]);

  const handleCancel = async (bookingId: number) => {
    setCancelling(bookingId);
    try {
      await bookingsApi.cancel(bookingId);
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      setShowCancelModal(null);
      toast.success('Booking cancelled');
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filteredBookings = bookings.filter((booking) => {
    if (tab === 'upcoming') return booking.status === 'confirmed' && booking.check_in >= today;
    if (tab === 'past') return booking.status === 'confirmed' && booking.check_out < today;
    if (tab === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

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
        <h1 className="text-3xl font-semibold mb-8">Trips</h1>

        <div className="flex gap-8 mb-8 border-b">
          {(['upcoming', 'past', 'cancelled'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-4 capitalize border-b-2 transition-colors ${
                tab === t ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No {tab} trips</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const listing = listings[booking.listing_id];
              if (!listing) return null;

              return (
                <div key={booking.id} className="border rounded-xl p-6">
                  <div className="flex gap-6">
                    <img
                      src={listing.image_urls[0] || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'}
                      alt=""
                      className="w-48 h-32 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{booking.check_in} - {booking.check_out}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{listing.city}</span>
                        </div>
                        <div>
                          <span className="font-semibold">₹{booking.total_price.toLocaleString('en-IN')}</span>
                          <span className="text-gray-500"> total</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.status === 'confirmed' && booking.check_in >= today && (
                          <button
                            onClick={() => setShowCancelModal(booking.id)}
                            disabled={cancelling === booking.id}
                            className="text-sm underline text-gray-600 hover:text-black disabled:opacity-50"
                          >
                            {cancelling === booking.id ? 'Cancelling...' : 'Cancel trip'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Cancel trip?</h2>
                <button onClick={() => setShowCancelModal(null)}>
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this trip? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(null)}
                  className="flex-1 rounded-lg border border-gray-300 font-semibold py-3 hover:bg-gray-50"
                >
                  Keep trip
                </button>
                <button
                  onClick={() => handleCancel(showCancelModal)}
                  className="flex-1 rounded-lg bg-gray-900 text-white font-semibold py-3 hover:bg-gray-800"
                >
                  Cancel trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
