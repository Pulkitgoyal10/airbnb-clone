'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { bookingsApi, listingsApi, ApiError } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { AuthModal } from '@/components/auth-modal';
import { formatInr, listingImages, type ListingDetail, type Quote } from '@/lib/types';

function BookForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [auth, setAuth] = useState(false);
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = Number(searchParams.get('guests') || '1');
  const id = Number(params.id);

  useEffect(() => {
    const load = async () => {
      try {
        const listingData = await listingsApi.getById(id);
        setListing(listingData);
        if (checkIn && checkOut) {
          const quoteData = await listingsApi.getQuote(id, checkIn, checkOut, guests);
          setQuote(quoteData);
        }
      } catch {
        toast.error('Failed to load listing');
        router.push(`/rooms/${id}`);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, checkIn, checkOut, guests, router]);

  const handleConfirm = async () => {
    if (!user) {
      setAuth(true);
      return;
    }
    setProcessing(true);
    try {
      const booking = await bookingsApi.create(id, checkIn, checkOut, guests);
      toast.success('Booking confirmed!');
      router.push(`/book/confirmed/${booking.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'DATES_UNAVAILABLE') {
        toast.error('These dates are no longer available. Please choose new dates.');
      } else {
        toast.error(error instanceof ApiError ? error.detail : 'Failed to create booking');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }
  if (!listing) return null;
  const image = listingImages(listing)[0];

  return (
    <main className="min-h-screen px-6 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 font-semibold">
        <ArrowLeft size={18} /> Confirm and pay
      </button>
      <div className="mx-auto mt-8 grid max-w-6xl gap-10 lg:grid-cols-[1fr_380px]">
        <section>
          <h1 className="text-3xl font-semibold">Confirm and pay</h1>
          <div className="mt-8 border-b pb-7">
            <h2 className="text-xl font-semibold">Your trip</h2>
            <p className="mt-4">
              Dates <span className="float-right">{checkIn} – {checkOut}</span>
            </p>
            <p className="mt-3">
              Guests <span className="float-right">{guests} guest{guests > 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="mt-7">
            <h2 className="text-xl font-semibold">Pay with</h2>
            <div className="mt-5 grid gap-3">
              <input className="auth-input" placeholder="Card number" />
              <div className="grid grid-cols-2 gap-3">
                <input className="auth-input" placeholder="MM / YY" />
                <input className="auth-input" placeholder="CVV" />
              </div>
              <input className="auth-input" placeholder="Cardholder name" />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-[#555]">
              <Lock size={12} /> This is a secure demo. No real payment will be processed.
            </p>
          </div>
          <div className="mt-8 border-y py-7">
            <h2 className="text-xl font-semibold">Cancellation policy</h2>
            <p className="mt-3 text-sm text-[#555]">Free cancellation before check-in. Cancel before check-in for a partial refund.</p>
          </div>
          <button disabled={processing} onClick={handleConfirm} className="gradient-button mt-7 w-full md:w-auto">
            {processing ? 'Processing…' : <><Lock size={16} /> Confirm and pay</>}
          </button>
        </section>
        <aside className="booking-card h-fit">
          <div className="flex gap-4">
            <img src={image} className="size-24 rounded-xl object-cover" alt="" />
            <div>
              <b>{listing.title}</b>
              <p className="mt-1 text-sm text-[#666]">{listing.city} · {listing.avg_rating ? listing.avg_rating.toFixed(2) : 'New'} ★</p>
            </div>
          </div>
          <div className="mt-6 border-t pt-5">
            <h2 className="font-semibold">Price details</h2>
            {quote ? (
              <>
                <p className="mt-4 flex justify-between">
                  <span>{formatInr(quote.nightly)} x {quote.nights} nights</span>
                  <span>{formatInr(quote.subtotal)}</span>
                </p>
                <p className="mt-3 flex justify-between">
                  <span>Cleaning fee</span>
                  <span>{formatInr(quote.cleaning_fee)}</span>
                </p>
                <p className="mt-3 flex justify-between">
                  <span>Service fee</span>
                  <span>{formatInr(quote.service_fee)}</span>
                </p>
                <p className="mt-5 flex justify-between border-t pt-4 font-bold">
                  <span>Total</span>
                  <span>{formatInr(quote.total)}</span>
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-[#666]">Select dates to see price details.</p>
            )}
          </div>
        </aside>
      </div>
      {auth && <AuthModal onClose={() => setAuth(false)} />}
    </main>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">Loading…</div>}>
      <BookForm />
    </Suspense>
  );
}
