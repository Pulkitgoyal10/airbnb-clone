'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi, listingsApi } from '@/lib/api';
import { CheckCircle, Calendar, MapPin, Users } from 'lucide-react';

export default function BookingConfirmedPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingData = await bookingsApi.getMyBookings();
        const foundBooking = bookingData.find((b: any) => b.id === Number(params.bookingId));
        if (foundBooking) {
          setBooking(foundBooking);
          const listingData = await listingsApi.getById(foundBooking.listing_id);
          setListing(listingData);
        }
      } catch (error) {
        console.error('Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!booking || !listing) {
    return <div className="min-h-screen flex items-center justify-center">Booking not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[800px] px-5 py-10">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={40} className="text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold mb-4">Booking confirmed!</h1>
          <p className="text-gray-600 mb-8">
            Your reservation has been successfully confirmed. You'll receive a confirmation email shortly.
          </p>

          <div className="border rounded-xl p-6 text-left mb-8">
            <h2 className="font-semibold text-lg mb-4">{listing.title}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar size={18} />
                <span>{booking.check_in} - {booking.check_out}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} />
                <span>{listing.city}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users size={18} />
                <span>{booking.guests} guest{booking.guests > 1 ? 's' : ''}</span>
              </div>
            </div>
            <hr className="my-4" />
            <div className="flex justify-between font-semibold">
              <span>Total paid</span>
              <span>₹{booking.total_price.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/trips')}
              className="rounded-lg bg-gray-900 text-white font-semibold px-6 py-3 hover:bg-gray-800"
            >
              View your trips
            </button>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg border border-gray-300 font-semibold px-6 py-3 hover:bg-gray-50"
            >
              Continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
