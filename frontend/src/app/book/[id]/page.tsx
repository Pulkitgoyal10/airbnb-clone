'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { bookingsApi, listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { CreditCard, Lock } from 'lucide-react';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = Number(searchParams.get('guests') || '1');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await listingsApi.getById(Number(params.id));
        setListing(data);
      } catch (error) {
        toast.error('Failed to load listing');
        router.push(`/rooms/${params.id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [params.id, router]);

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please log in to book');
      return;
    }

    setProcessing(true);
    try {
      const booking = await bookingsApi.create(
        Number(params.id),
        checkIn,
        checkOut,
        guests
      );
      toast.success('Booking confirmed!');
      router.push(`/book/confirmed/${booking.id}`);
    } catch (error: any) {
      if (error.code === 'DATES_UNAVAILABLE') {
        toast.error('These dates are no longer available. Please choose new dates.');
      } else {
        toast.error(error.detail || 'Failed to create booking');
      }
    } finally {
      setProcessing(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-[800px] px-5 py-10">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm underline"
        >
          Back
        </button>

        <h1 className="text-3xl font-semibold mb-8">Confirm and pay</h1>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <img
              src={listing.image_urls[0] || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'}
              alt=""
              className="w-32 h-32 rounded-xl object-cover"
            />
            <div>
              <h2 className="font-semibold text-lg">{listing.title}</h2>
              <p className="text-gray-500 text-sm">{listing.city}</p>
              <div className="flex items-center gap-1 mt-2 text-sm">
                <span className="font-semibold">₹{listing.price_per_night.toLocaleString('en-IN')}</span>
                <span className="text-gray-500">night</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Dates</span>
              <span>{checkIn} - {checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests</span>
              <span>{guests} guest{guests > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-4">Price details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>₹{listing.price_per_night.toLocaleString('en-IN')} × {(new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)} nights</span>
              <span>₹{((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24) * listing.price_per_night).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Cleaning fee</span>
              <span>₹{listing.cleaning_fee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Service fee</span>
              <span>₹{Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24) * listing.price_per_night * 0.14).toLocaleString('en-IN')}</span>
            </div>
            <hr />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>₹{((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24) * listing.price_per_night + listing.cleaning_fee + Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24) * listing.price_per_night * 0.14)).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Pay with card
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Card number"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="MM / YY"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
              <input
                type="text"
                placeholder="CVV"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-gray-500 mt-4">
            <Lock size={12} />
            This is a secure demo. No real payment will be processed.
          </p>
        </div>

        <button
          onClick={handleConfirmBooking}
          disabled={processing}
          className="w-full rounded-lg bg-gradient-to-r from-[#E61E4D] to-[#BD1E59] text-white font-semibold py-4 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : 'Confirm and pay'}
        </button>
      </div>
    </div>
  );
}
