'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hostApi, listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { Edit3, Trash2, Plus, X, Home } from 'lucide-react';
import Link from 'next/link';

export default function HostListingsPage() {
  const router = useRouter();
  const { user, loading: userLoading, toggleHostMode } = useUser();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [becomingHost, setBecomingHost] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    if (!user.is_host) {
      setLoading(false);
      return;
    }

    const fetchListings = async () => {
      try {
        const data = await hostApi.getListings();
        setListings(data.items);
      } catch (error) {
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [user, userLoading, router]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await listingsApi.delete(deleteId);
      setListings((prev) => prev.filter((l) => l.id !== deleteId));
      setDeleteId(null);
      toast.success('Listing deleted');
    } catch (error: any) {
      if (
        error?.code === 'HAS_UPCOMING_BOOKINGS' ||
        error?.detail?.includes('HAS_UPCOMING_BOOKINGS') ||
        error?.message?.includes('HAS_UPCOMING_BOOKINGS') ||
        error?.detail?.includes('upcoming bookings')
      ) {
        toast.error('Cannot delete listing with upcoming bookings');
      } else {
        toast.error(error?.detail || error?.message || 'Failed to delete listing');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (user && !user.is_host) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-[800px] px-5 py-20 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-rose-50 text-[#FF385C]">
            <Home size={32} />
          </div>
          <h1 className="text-3xl font-semibold mb-3">Host your home on Airbnb</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You need host mode enabled to manage listings. Become a host with one click!
          </p>
          <button
            onClick={async () => {
              setBecomingHost(true);
              try {
                await toggleHostMode(true);
                toast.success('Welcome to hosting!');
              } catch {
                toast.error('Failed to become a host');
              } finally {
                setBecomingHost(false);
              }
            }}
            disabled={becomingHost}
            className="rounded-xl bg-[#FF385C] px-8 py-3.5 font-semibold text-white hover:bg-[#E00B41] disabled:opacity-50 transition"
          >
            {becomingHost ? 'Switching...' : 'Become a host'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1120px] px-5 py-10 md:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-gray-500">Manage your homes</p>
            <h1 className="text-3xl font-semibold">Listings</h1>
          </div>
          <Link
            href="/host/listings/new"
            className="flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-3 font-semibold hover:bg-gray-800"
          >
            <Plus size={20} />
            Create listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No listings yet</p>
            <Link
              href="/host/listings/new"
              className="inline-block mt-4 text-gray-900 underline font-semibold"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_140px] gap-4 border-b bg-gray-50 px-5 py-4 text-xs font-semibold text-gray-500">
              <span>Listing</span>
              <span>City</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            {listings.map((listing) => {
              const isOwner = user?.id === listing.host_id;

              return (
                <div
                  key={listing.id}
                  className="grid items-center gap-4 border-b px-5 py-4 last:border-0 md:grid-cols-[2fr_1fr_1fr_140px]"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        listing.image_urls?.[0] ||
                        'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'
                      }
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-semibold">{listing.title}</p>
                      <p className="text-sm text-gray-500">
                        ₹{Number(listing.price_per_night).toLocaleString('en-IN')} / night
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{listing.city}</span>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      listing.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {listing.status}
                  </span>
                  <div className="flex justify-end gap-1">
                    {isOwner ? (
                      <>
                        <Link
                          href={`/host/listings/${listing.id}/edit`}
                          className="rounded-full p-2 hover:bg-gray-100"
                          aria-label={`Edit ${listing.title}`}
                          title="Edit listing"
                        >
                          <Edit3 size={17} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(listing.id)}
                          className="rounded-full p-2 hover:bg-red-50 text-red-600"
                          aria-label={`Delete ${listing.title}`}
                          title="Delete listing"
                        >
                          <Trash2 size={17} />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 self-center">View only</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-7 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delete listing?</h2>
              <button
                onClick={() => setDeleteId(null)}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6 text-sm">
              This action cannot be undone. Are you sure you want to delete this listing?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-lg border border-gray-300 font-semibold py-2.5 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 text-white font-semibold py-2.5 text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
