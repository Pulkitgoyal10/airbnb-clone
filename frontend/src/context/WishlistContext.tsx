'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { wishlistApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import type { ListingSummary } from '@/lib/types';

type WishlistContextType = {
  items: ListingSummary[];
  savedIds: Set<number>;
  loading: boolean;
  mounted: boolean;
  isSaved: (listingId: number) => boolean;
  toggle: (listingId: number, fallbackListing?: Partial<ListingSummary> | any) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistApi.get();
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const savedIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);

  const toggle = useCallback(
    async (listingId: number, fallbackListing?: Partial<ListingSummary> | any) => {
      if (!user) {
        toast.error('Please log in to save listings');
        return;
      }

      const currentlySaved = savedIds.has(listingId);
      const prevItems = items;

      if (currentlySaved) {
        // Optimistic remove
        setItems((prev) => prev.filter((item) => item.id !== listingId));
        toast.success('Removed from Wishlist');

        try {
          await wishlistApi.remove(listingId);
        } catch {
          // Revert optimistic update on failure
          setItems(prevItems);
          toast.error('Failed to remove from wishlist');
        }
      } else {
        // Optimistic add
        const optimisticItem: ListingSummary = {
          id: listingId,
          host_id: fallbackListing?.host_id ?? 0,
          title: fallbackListing?.title ?? 'Saved listing',
          description: fallbackListing?.description ?? '',
          category: fallbackListing?.category ?? 'Homes',
          city: fallbackListing?.city ?? '',
          address: fallbackListing?.address ?? '',
          price_per_night: fallbackListing?.price_per_night ?? 0,
          cleaning_fee: fallbackListing?.cleaning_fee ?? 0,
          amenities: fallbackListing?.amenities ?? [],
          status: fallbackListing?.status ?? 'published',
          created_at: fallbackListing?.created_at ?? new Date().toISOString(),
          avg_rating: fallbackListing?.avg_rating ?? 5.0,
          review_count: fallbackListing?.review_count ?? 0,
          guest_favourite: fallbackListing?.guest_favourite ?? false,
          image_urls: fallbackListing?.image_urls ?? (fallbackListing?.images ?? []),
          first_image:
            fallbackListing?.first_image ??
            fallbackListing?.image_urls?.[0] ??
            fallbackListing?.images?.[0] ??
            null,
          bedrooms: fallbackListing?.bedrooms ?? 1,
          beds: fallbackListing?.beds ?? 1,
          bathrooms: fallbackListing?.bathrooms ?? 1,
          max_guests: fallbackListing?.max_guests ?? 2,
        };

        setItems((prev) => [...prev.filter((i) => i.id !== listingId), optimisticItem]);
        toast.success('Saved to Wishlist');

        try {
          const addedListing = await wishlistApi.add(listingId);
          // Replace optimistic item with server response
          setItems((prev) =>
            prev.map((item) => (item.id === listingId ? (addedListing as unknown as ListingSummary) : item))
          );
        } catch {
          // Revert optimistic update on failure
          setItems(prevItems);
          toast.error('Failed to save to wishlist');
        }
      }
    },
    [items, savedIds, user],
  );

  const value = useMemo(
    () => ({
      items,
      savedIds,
      loading,
      mounted,
      isSaved: (listingId: number) => (mounted ? savedIds.has(listingId) : false),
      toggle,
      refresh,
    }),
    [items, savedIds, loading, mounted, toggle, refresh],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
