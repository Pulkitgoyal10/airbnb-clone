'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListingCard } from '@/components/listing-card';
import { listingsApi } from '@/lib/api';
import type { ListingSummary } from '@/lib/types';
import type { Tab } from '@/components/search-bar';

const originals = [
  {
    title: 'A stay with a story',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85&sig=1',
  },
  {
    title: 'Find your happy place',
    image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=85&sig=2',
  },
  {
    title: 'Design-led escapes',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85&sig=3',
  },
  {
    title: 'Made for slow mornings',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85&sig=4',
  },
];

function Section({ title, items }: { title: string; items: ListingSummary[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-[1400px] py-7">
      <h2 className="mb-4 px-10 text-[21px] font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-6 px-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.slice(0, 10).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('category') || 'Homes') as Tab;
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const category = tab === 'All' ? undefined : tab;
        const data = await listingsApi.search({ category, page: 1, page_size: 40 });
        if (!cancelled) setListings(data.items);
      } catch {
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const byCity = (city: string) => listings.filter((l) => l.city.toLowerCase() === city.toLowerCase());

  return (
    <div>
      {loading && listings.length === 0 ? (
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-10 py-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-3 aspect-[20/19] rounded-xl bg-gray-200" />
              <div className="mb-2 h-4 rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {tab === 'All' ? (
            <>
              <Section title="Popular homes in Chandigarh" items={byCity('Chandigarh')} />
              <Section title="Available in Zirakpur this weekend" items={byCity('Zirakpur')} />
              <Section title="Homes in Mohali" items={byCity('Mohali')} />
              <Section title="Stay near Gurgaon" items={byCity('Gurgaon')} />
              <Section title="Guest favourites" items={listings.filter((l) => l.guest_favourite)} />
              <Section title="All homes" items={listings} />
              <section className="mx-auto max-w-[1400px] px-5 py-7 md:px-10">
                <h2 className="mb-4 text-[21px] font-semibold">Airbnb Originals</h2>
                <div className="horizontal-row tall-row">
                  {originals.map((x) => (
                    <div key={x.title} className="min-w-[220px]">
                      <div className="relative aspect-[.85] overflow-hidden rounded-xl">
                        <img src={x.image} alt={x.title} className="size-full object-cover" />
                        <span className="absolute bottom-4 left-4 right-4 text-lg font-semibold text-white">{x.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <Section title="Homes near you" items={listings} />
          )}
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="px-10 py-20 text-center text-[#717171]">Loading…</div>}>
      <HomeContent />
    </Suspense>
  );
}
