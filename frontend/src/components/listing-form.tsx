'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { Check, X, Plus, Trash2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export const AMENITY_OPTIONS = [
  'Wifi',
  'Kitchen',
  'Free parking',
  'Air conditioning',
  'TV',
  'Washing machine',
  'Pool',
  'Gym',
  'Power backup',
  'Balcony',
  'Hot water',
  'Workspace',
  'Garden',
  'BBQ grill',
];

export interface ListingFormData {
  title: string;
  description: string;
  category: string;
  city: string;
  address: string;
  price_per_night: string | number;
  cleaning_fee: string | number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  image_urls: string[];
  status: string;
}

interface ListingFormProps {
  mode: 'create' | 'edit';
  initialData?: ListingFormData;
  listingId?: number;
  hostId?: number;
}

const defaultFormData: ListingFormData = {
  title: '',
  description: '',
  category: 'Homes',
  city: '',
  address: '',
  price_per_night: '',
  cleaning_fee: '',
  max_guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: [],
  image_urls: [],
  status: 'published',
};

export default function ListingForm({
  mode,
  initialData,
  listingId,
  hostId,
}: ListingFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ListingFormData>(
    initialData || defaultFormData
  );
  const [imageUrl, setImageUrl] = useState('');

  const steps = [
    { title: 'Basic info', icon: 1 },
    { title: 'Location', icon: 2 },
    { title: 'Amenities', icon: 3 },
    { title: 'Photos', icon: 4 },
    { title: 'Pricing & Capacity', icon: 5 },
    { title: 'Review', icon: 6 },
  ];

  // Owner check for edit mode
  const isOwner = mode === 'create' || !hostId || (user && user.id === hostId);

  if (mode === 'edit' && !isOwner) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          Only the owner of this listing can edit or delete it.
        </p>
        <Link
          href="/host/listings"
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Back to Listings
        </Link>
      </div>
    );
  }

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addImageUrl = () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;
    if (!formData.image_urls.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, trimmed],
      }));
      setImageUrl('');
    } else {
      toast.error('This photo URL has already been added');
    }
  };

  const removeImageUrl = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((u) => u !== url),
    }));
  };

  const validate = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a listing title');
      setStep(0);
      return false;
    }
    if (!formData.city.trim() || !formData.address.trim()) {
      toast.error('Please enter city and address');
      setStep(1);
      return false;
    }
    if (formData.image_urls.length === 0) {
      toast.error('Please add at least one photo by URL');
      setStep(3);
      return false;
    }
    const price = Number(formData.price_per_night);
    if (!price || price <= 0) {
      toast.error('Please enter a valid price per night');
      setStep(4);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || 'A wonderful stay.',
      category: formData.category || 'Homes',
      city: formData.city.trim(),
      address: formData.address.trim(),
      price_per_night: Math.round(Number(formData.price_per_night)),
      cleaning_fee: Math.round(Number(formData.cleaning_fee) || 0),
      max_guests: Number(formData.max_guests) || 1,
      bedrooms: Number(formData.bedrooms) || 1,
      beds: Number(formData.beds) || 1,
      bathrooms: Number(formData.bathrooms) || 1,
      amenities: formData.amenities,
      image_urls: formData.image_urls,
      status: formData.status || 'published',
    };

    try {
      if (mode === 'create') {
        await listingsApi.create(payload);
        toast.success('Listing created successfully!');
      } else {
        if (!listingId) throw new Error('Listing ID is missing');
        await listingsApi.update(listingId, payload);
        toast.success('Listing updated successfully!');
      }
      router.push('/host/listings');
      router.refresh();
    } catch (error: any) {
      toast.error(error?.detail || error?.message || `Failed to ${mode === 'create' ? 'create' : 'update'} listing`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Back"
          >
            <X size={24} />
          </button>
          <h1 className="text-2xl font-semibold">
            {mode === 'create' ? 'Create a new listing' : 'Edit listing'}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-24">
              {steps.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex w-full items-center gap-4 border-l-2 py-3 pl-4 text-left transition-colors ${
                    i === step
                      ? 'border-black font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-full text-sm ${
                      i < step
                        ? 'bg-black text-white'
                        : i === step
                        ? 'bg-black text-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {i < step ? <Check size={16} /> : s.icon}
                  </span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Step 0: Basic info */}
            {step === 0 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">Let's start with the basics</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Modern 3BHK villa with pool"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your place..."
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      >
                        <option value="Homes">Homes</option>
                        <option value="Experiences">Experiences</option>
                        <option value="Services">Services</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Location */}
            {step === 1 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">Where's your place located?</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Chandigarh"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g., Sector 9, Chandigarh"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Amenities */}
            {step === 2 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">What amenities do you offer?</h2>
                <div className="grid grid-cols-2 gap-4">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-4 rounded-xl border-2 text-left transition-colors ${
                        formData.amenities.includes(amenity)
                          ? 'border-black bg-gray-50'
                          : 'border-gray-300 hover:border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{amenity}</span>
                        {formData.amenities.includes(amenity) && <Check size={18} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Photos by URL */}
            {step === 3 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-2">Add photos by URL</h2>
                <p className="text-gray-500 mb-6">
                  Provide image links for your listing gallery. At least one image is required.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addImageUrl();
                        }
                      }}
                      placeholder="Paste image URL (e.g., https://images.unsplash.com/...)"
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="flex items-center gap-1 rounded-lg bg-gray-900 text-white px-5 py-3 font-semibold hover:bg-gray-800"
                    >
                      <Plus size={20} />
                      Add
                    </button>
                  </div>
                  {formData.image_urls.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                      No photos added yet. Paste an image URL above and click Add.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {formData.image_urls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImageUrl(url)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow hover:bg-gray-100"
                            aria-label="Remove photo"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-2 left-2 rounded bg-black/75 px-2 py-0.5 text-xs font-semibold text-white">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Pricing & Capacity */}
            {step === 4 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">Price & Capacity</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Price per night (₹)</label>
                    <input
                      type="number"
                      value={formData.price_per_night}
                      onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                      placeholder="e.g., 5000"
                      min={1}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Cleaning fee (₹)</label>
                    <input
                      type="number"
                      value={formData.cleaning_fee}
                      onChange={(e) => setFormData({ ...formData, cleaning_fee: e.target.value })}
                      placeholder="e.g., 500"
                      min={0}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Max guests</label>
                      <input
                        type="number"
                        value={formData.max_guests}
                        onChange={(e) => setFormData({ ...formData, max_guests: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bedrooms</label>
                      <input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Beds</label>
                      <input
                        type="number"
                        value={formData.beds}
                        onChange={(e) => setFormData({ ...formData, beds: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bathrooms</label>
                      <input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">Review your listing</h2>
                <div className="space-y-4 rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Title</span>
                    <span className="font-semibold text-right">{formData.title || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Category</span>
                    <span className="font-semibold">{formData.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Location</span>
                    <span className="font-semibold text-right">
                      {formData.address ? `${formData.address}, ` : ''}{formData.city || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold">
                      ₹{Number(formData.price_per_night || 0).toLocaleString('en-IN')} / night
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Cleaning fee</span>
                    <span className="font-semibold">
                      ₹{Number(formData.cleaning_fee || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-semibold">
                      {formData.max_guests} guests · {formData.bedrooms} bed · {formData.bathrooms} bath
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Amenities</span>
                    <span className="font-semibold">{formData.amenities.length} selected</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Photos</span>
                    <span className="font-semibold">{formData.image_urls.length} added</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Status</span>
                    <span className="capitalize font-semibold">{formData.status}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-5 md:static md:border-0 md:p-0 md:mt-10">
              <div className="mx-auto max-w-[1200px] flex items-center justify-between px-5 md:px-0">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 0}
                  className="font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={step === steps.length - 1 ? handleSubmit : nextStep}
                  disabled={loading}
                  className="rounded-lg bg-gray-900 text-white px-8 py-3 font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading
                    ? mode === 'create'
                      ? 'Creating...'
                      : 'Saving...'
                    : step === steps.length - 1
                    ? mode === 'create'
                      ? 'Publish listing'
                      : 'Save changes'
                    : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
