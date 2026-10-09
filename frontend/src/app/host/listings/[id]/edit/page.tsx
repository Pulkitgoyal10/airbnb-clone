'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import ListingForm, { ListingFormData } from '@/components/listing-form';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [initialData, setInitialData] = useState<ListingFormData | null>(null);
  const [hostId, setHostId] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);

  const listingId = Number(params?.id);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !user.is_host) {
      router.push('/host');
      return;
    }

    const fetchListing = async () => {
      try {
        const listing = await listingsApi.getById(listingId);
        setHostId(listing.host_id);

        if (user && listing.host_id !== user.id) {
          toast.error('Only the owner can edit this listing');
          setFetching(false);
          return;
        }

        setInitialData({
          title: listing.title,
          description: listing.description || '',
          category: listing.category || 'Homes',
          city: listing.city,
          address: listing.address,
          price_per_night: listing.price_per_night,
          cleaning_fee: listing.cleaning_fee,
          max_guests: listing.max_guests,
          bedrooms: listing.bedrooms,
          beds: listing.beds,
          bathrooms: listing.bathrooms,
          amenities: listing.amenities || [],
          image_urls: listing.image_urls || [],
          status: listing.status || 'published',
        });
      } catch (error) {
        toast.error('Failed to load listing');
        router.push('/host/listings');
      } finally {
        setFetching(false);
      }
    };

    fetchListing();
  }, [listingId, user, userLoading, router]);

  if (userLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (hostId && user && hostId !== user.id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Only the owner of this listing has permission to edit it.
          </p>
          <Link
            href="/host/listings"
            className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <ListingForm
      mode="edit"
      listingId={listingId}
      hostId={hostId || undefined}
      initialData={initialData}
    />
  );
}
