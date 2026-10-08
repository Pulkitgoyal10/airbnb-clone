'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CookingPot,
  Grid2X2,
  Heart,
  KeyRound,
  Map,
  MessageSquare,
  Share2,
  Sparkles,
  SprayCan,
  Star,
  Tag,
  Wifi,
  Wind,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { useWishlist } from '@/context/WishlistContext';
import { AuthModal } from '@/components/auth-modal';
import { formatInr, listingImages, type ListingDetail, type Quote } from '@/lib/types';

const amenityIcons: Record<string, typeof Wifi> = {
  Wifi,
  Kitchen: CookingPot,
  'Air conditioning': Wind,
  Workspace: BriefcaseBusiness,
  'Dedicated workspace': BriefcaseBusiness,
};

function isBlocked(date: Date, ranges: Array<{ check_in: string; check_out: string }>) {
  const day = format(date, 'yyyy-MM-dd');
  return ranges.some((range) => day >= range.check_in && day < range.check_out);
}

function CalendarMonth({
  year,
  month,
  checkIn,
  checkOut,
  blocked,
  onSelect,
}: {
  year: number;
  month: number;
  checkIn: string;
  checkOut: string;
  blocked: Array<{ check_in: string; check_out: string }>;
  onSelect: (iso: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const name = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
  return (
    <div className="flex-1">
      <h3 className="text-center text-lg font-semibold">{name}</h3>
      <div className="mt-5 grid grid-cols-7 gap-y-3 text-center text-sm">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`e-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const iso = format(date, 'yyyy-MM-dd');
          const past = date < today;
          const blockedDay = isBlocked(date, blocked);
          const selected = iso === checkIn || iso === checkOut;
          const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut;
          return (
            <button
              key={iso}
              type="button"
              disabled={past || blockedDay}
              onClick={() => onSelect(iso)}
              className={`mx-auto flex size-9 items-center justify-center rounded-full ${
                past || blockedDay
                  ? 'cursor-not-allowed text-gray-300 line-through'
                  : selected
                    ? 'bg-[#222] text-white'
                    : inRange
                      ? 'bg-gray-100'
                      : 'hover:border hover:border-black'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { isSaved, toggle } = useWishlist();
  const id = Number(params.id);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [blocked, setBlocked] = useState<Array<{ check_in: string; check_out: string }>>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    const load = async () => {
      try {
        const [listingData, availability] = await Promise.all([
          listingsApi.getById(id),
          listingsApi.getAvailability(id),
        ]);
        setListing(listingData);
        setBlocked(availability.blocked_ranges);
      } catch {
        toast.error('Failed to load listing');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, router]);

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setQuote(null);
      return;
    }
    listingsApi
      .getQuote(id, checkIn, checkOut, guests)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [id, checkIn, checkOut, guests]);

  const images = useMemo(() => (listing ? listingImages(listing) : []), [listing]);

  const onSelectDate = (iso: string) => {
    if (!checkIn || checkOut || iso <= checkIn) {
      setCheckIn(iso);
      setCheckOut('');
    } else {
      setCheckOut(iso);
    }
  };

  const handleReserve = () => {
    if (!user) {
      setAuth(true);
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Please select check-in and check-out dates');
      return;
    }
    router.push(`/book/${id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }
  if (!listing) return <div className="py-20 text-center">Listing not found</div>;

  const saved = isSaved(listing.id);

  return (
    <div className="min-h-screen bg-white px-5 pb-24 text-[#222] md:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-2 py-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{listing.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium">
              <Star size={15} fill="currentColor" /> {listing.avg_rating ? listing.avg_rating.toFixed(2) : 'New'} · {listing.review_count} reviews ·{' '}
              <span className="underline">{listing.city}, India</span>
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:bg-gray-100">
              <Share2 size={17} /> Share
            </button>
            <button onClick={() => void toggle(listing.id)} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:bg-gray-100">
              <Heart fill={saved ? '#FF385C' : 'none'} color={saved ? '#FF385C' : 'currentColor'} size={17} /> {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        <section className="relative mt-5 grid h-[60vh] min-h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl" aria-label="Property photos">
          <img src={images[0]} alt={listing.title} className="col-span-2 row-span-2 h-full w-full object-cover" />
          {images.slice(1, 5).map((image, index) => (
            <img key={`${image}-${index}`} src={image} alt={`Property view ${index + 2}`} className="h-full w-full object-cover" />
          ))}
          <button onClick={() => setGalleryOpen(true)} className="absolute bottom-5 right-5 flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold shadow-md">
            <Grid2X2 size={16} /> Show all photos
          </button>
        </section>
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section>
            <h2 className="text-2xl font-semibold">Entire home in {listing.city}</h2>
            <p className="mt-2 text-gray-600">
              {listing.max_guests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds · {listing.bathrooms} baths
            </p>
            <div className="my-8 flex items-center gap-4 border-y border-gray-200 py-6">
              <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-[#fce7f3] text-lg font-semibold">
                {listing.host?.avatar_url ? <img src={listing.host.avatar_url} alt="" className="size-full object-cover" /> : listing.host?.name?.[0] || 'H'}
              </div>
              <div>
                <p className="font-semibold">Hosted by {listing.host?.name || 'Host'}</p>
                <p className="text-sm text-gray-600">Superhost · 5 years hosting</p>
              </div>
              <Sparkles className="ml-auto" size={24} />
            </div>
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold">What this place offers</h3>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {listing.amenities.map((label) => {
                  const Icon = amenityIcons[label] || Wifi;
                  return (
                    <div key={label} className="flex items-center gap-4">
                      <Icon size={22} strokeWidth={1.5} />
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <section className="border-b border-gray-200 py-8">
              <h3 className="text-2xl font-semibold">About this space</h3>
              <p className="mt-4 max-w-2xl leading-7">{listing.description}</p>
              <button onClick={() => setAboutOpen(true)} className="mt-4 flex items-center gap-1 font-semibold underline">
                Show more <ChevronRight className="size-4" />
              </button>
            </section>
            <section className="border-b border-gray-200 py-10">
              <h3 className="text-2xl font-semibold">Select dates</h3>
              <p className="mt-2 text-gray-500">{checkIn && checkOut ? `${checkIn} – ${checkOut}` : 'Add your travel dates for exact pricing'}</p>
              <div className="mt-8 flex flex-col gap-12 md:flex-row">
                <CalendarMonth year={now.getFullYear()} month={now.getMonth()} checkIn={checkIn} checkOut={checkOut} blocked={blocked} onSelect={onSelectDate} />
                <CalendarMonth
                  year={now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()}
                  month={(now.getMonth() + 1) % 12}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  blocked={blocked}
                  onSelect={onSelectDate}
                />
              </div>
              <div className="mt-8 flex items-center justify-end">
                <button className="text-sm font-semibold underline" onClick={() => { setCheckIn(''); setCheckOut(''); }}>
                  Clear dates
                </button>
              </div>
            </section>
            <section className="py-10">
              <h3 className="flex items-center gap-2 text-2xl font-semibold">
                <Star className="size-6" fill="currentColor" /> {listing.avg_rating ? listing.avg_rating.toFixed(2) : 'New'} · {listing.review_count} reviews
              </h3>
              <div className="mt-10 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
                {listing.reviews.map((review) => (
                  <article key={review.id}>
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-full bg-gray-200 font-semibold">{review.reviewer_name[0]}</div>
                      <div>
                        <p className="font-semibold">{review.reviewer_name}</p>
                        <p className="text-sm text-gray-500">{review.created_at.slice(0, 10)}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm">
                      {'★'.repeat(review.rating)}
                    </p>
                    <p className="mt-2 leading-6">{review.comment}</p>
                  </article>
                ))}
              </div>
            </section>
          </section>
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="booking-card bg-white">
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl">{formatInr(listing.price_per_night)}</strong>
                <span>night</span>
              </div>
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-400">
                <div className="grid grid-cols-2 border-b border-gray-400">
                  <label className="p-3 text-xs font-semibold uppercase">
                    Check-in
                    <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 block w-full bg-transparent text-sm font-normal outline-none" />
                  </label>
                  <label className="border-l border-gray-400 p-3 text-xs font-semibold uppercase">
                    Checkout
                    <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 block w-full bg-transparent text-sm font-normal outline-none" />
                  </label>
                </div>
                <label className="block p-3 text-xs font-semibold uppercase">
                  Guests
                  <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-1 block w-full bg-transparent text-sm font-normal outline-none">
                    {Array.from({ length: listing.max_guests }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} guest{i + 1 > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button onClick={handleReserve} className="gradient-button mt-5 w-full">
                {checkIn && checkOut ? 'Reserve' : 'Check availability'}
              </button>
              <p className="mt-4 text-center text-sm text-gray-500">You won&apos;t be charged yet</p>
              {quote && (
                <div className="mt-5 space-y-3 text-sm">
                  <p className="flex justify-between">
                    <span className="underline">
                      {formatInr(quote.nightly)} x {quote.nights} nights
                    </span>
                    <span>{formatInr(quote.subtotal)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="underline">Cleaning fee</span>
                    <span>{formatInr(quote.cleaning_fee)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="underline">Service fee</span>
                    <span>{formatInr(quote.service_fee)}</span>
                  </p>
                  <p className="flex justify-between border-t pt-4 font-bold">
                    <span>Total</span>
                    <span>{formatInr(quote.total)}</span>
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
        {galleryOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-5 md:p-12">
            <button onClick={() => setGalleryOpen(false)} className="mb-6 rounded-full border px-4 py-2 font-semibold">
              Close
            </button>
            <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
              {images.map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt={`Gallery photo ${index + 1}`} className="w-full rounded-xl object-cover" />
              ))}
            </div>
          </div>
        )}
        {aboutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl md:p-9">
              <button onClick={() => setAboutOpen(false)} className="absolute left-6 top-6 rounded-full p-2 hover:bg-gray-100" aria-label="Close about this space">
                <X className="size-5" />
              </button>
              <h2 className="mb-8 text-3xl font-semibold">About this space</h2>
              <p className="leading-7">{listing.description}</p>
            </div>
          </div>
        )}
        {auth && <AuthModal onClose={() => setAuth(false)} />}
      </div>
    </div>
  );
}
