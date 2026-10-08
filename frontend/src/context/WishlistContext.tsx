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
  isSaved: (listingId: number) => boolean;
  toggle: (listingId: number) => Promise<void>;
  refresh: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [items, setItems] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(false);

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
    async (listingId: number) => {
      if (!user) {
        toast.error('Please log in to save listings');
        return;
      }
      const currentlySaved = savedIds.has(listingId);
      try {
        if (currentlySaved) {
          await wishlistApi.remove(listingId);
          setItems((prev) => prev.filter((item) => item.id !== listingId));
          toast.success('Removed from Wishlist');
        } else {
          const listing = await wishlistApi.add(listingId);
          setItems((prev) => [...prev.filter((item) => item.id !== listing.id), listing]);
          toast.success('Saved to Wishlist');
        }
      } catch {
        toast.error('Failed to update wishlist');
      }
    },
    [savedIds, user],
  );

  const value = useMemo(
    () => ({
      items,
      savedIds,
      loading,
      isSaved: (listingId: number) => savedIds.has(listingId),
      toggle,
      refresh,
    }),
    [items, savedIds, loading, toggle, refresh],
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
