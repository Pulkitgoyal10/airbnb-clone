'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/listing-card';
import { useUser } from '@/context/UserContext';
import { useWishlist } from '@/context/WishlistContext';

export default function WishlistsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { items, loading, refresh } = useWishlist();

  useEffect(() => {
    if (!userLoading && !user) router.push('/');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
      void refresh();
    }
  }, [user, refresh]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold">Wishlists</h1>
      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#fff0f3] text-4xl text-[#FF385C]">
            ♡
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Create your first wishlist</h2>
          <p className="mt-3 text-[#666]">As you search, click the heart icon to save your favourite places.</p>
          <Link href="/" className="gradient-button mt-7 inline-block">
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
