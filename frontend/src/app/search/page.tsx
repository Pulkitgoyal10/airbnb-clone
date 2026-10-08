'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ListingCard } from '@/components/listing-card';
import { listingsApi } from '@/lib/api';
import type { ListingSummary } from '@/lib/types';

function Results() {
  const params = useSearchParams();
  const location = params.get('location') || '';
  const checkIn = params.get('check_in') || undefined;
  const checkOut = params.get('check_out') || undefined;
  const guests = params.get('guests') ? Number(params.get('guests')) : undefined;
  const category = params.get('category') || undefined;
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await listingsApi.search({
          location: location || undefined,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          category: category && category !== 'All' ? category : undefined,
          page: 1,
          page_size: 40,
        });
        if (!cancelled) setItems(data.items);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [location, checkIn, checkOut, guests, category]);

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-8 md:px-10">
      <h1 className="text-2xl font-semibold">
        {loading ? 'Searching…' : `${items.length} homes in ${location || 'India'}`}
      </h1>
      {loading ? (
        <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-7 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-xl font-semibold">No exact matches</h2>
          <p className="mt-2 text-[#717171]">Try a different destination or dates.</p>
          <Link href="/" className="mt-6 inline-flex rounded-lg bg-[#222] px-5 py-3 text-sm font-semibold text-white">
            Clear search
          </Link>
        </div>
      )}
    </section>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-10 py-20 text-center">Loading…</div>}>
      <Results />
    </Suspense>
  );
}
