'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listingsApi, uploadApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { Check, X, Plus, Trash2 } from 'lucide-react';

const amenityOptions = [
  'Wifi', 'Kitchen', 'Free parking', 'Air conditioning', 'TV',
  'Washing machine', 'Pool', 'Gym', 'Power backup', 'Balcony',
  'Hot water', 'Workspace', 'Garden', 'BBQ grill'
];

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
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
    amenities: [] as string[],
    image_urls: [] as string[],
    status: 'published',
  });

  const [imageUrl, setImageUrl] = useState('');

  const steps = [
    { title: 'Basic info', icon: 1 },
    { title: 'Location', icon: 2 },
    { title: 'Amenities', icon: 3 },
    { title: 'Photos', icon: 4 },
    { title: 'Pricing', icon: 5 },
    { title: 'Review', icon: 6 },
  ];

  useEffect(() => {
    if (!user || !user.is_host) {
      router.push('/');
    }
  }, [user, router]);

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addImageUrl = () => {
    if (imageUrl && !formData.image_urls.includes(imageUrl)) {
      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, imageUrl]
      }));
      setImageUrl('');
    }
  };

  const removeImageUrl = (url: string) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter(u => u !== url)
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await listingsApi.create({
        ...formData,
        price_per_night: Number(formData.price_per_night),
        cleaning_fee: Number(formData.cleaning_fee),
      });
      toast.success('Listing created successfully!');
      router.push('/host/listings');
    } catch (error) {
      toast.error('Failed to create listing');
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

  if (!user?.is_host) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
          <h1 className="text-2xl font-semibold">Create a new listing</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          {/* Sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-24">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`flex w-full items-center gap-4 border-l-2 py-3 pl-4 text-left transition-colors ${
                    i === step ? 'border-black font-semibold' : 'border-transparent text-gray-500'
                  }`}
                >
                  <span className={`flex size-8 items-center justify-center rounded-full text-sm ${
                    i < step ? 'bg-black text-white' :
                    i === step ? 'bg-black text-white' : 'bg-gray-200'
                  }`}>
                    {i < step ? <Check size={16} /> : s.icon}
                  </span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
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
                      placeholder="e.g., Modern 3BHK villa"
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
                </div>
              </div>
            )}

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

            {step === 2 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">What amenities do you offer?</h2>
                <div className="grid grid-cols-2 gap-4">
                  {amenityOptions.map((amenity) => (
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

            {step === 3 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">Add some photos</h2>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste image URL here..."
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="rounded-lg bg-gray-900 text-white px-4 py-3 font-semibold hover:bg-gray-800"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.image_urls.map((url) => (
                      <div key={url} className="relative aspect-square rounded-xl overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(url)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-white hover:bg-gray-100"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">Now, set your price</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Price per night (₹)</label>
                    <input
                      type="number"
                      value={formData.price_per_night}
                      onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                      placeholder="1000"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Cleaning fee (₹)</label>
                    <input
                      type="number"
                      value={formData.cleaning_fee}
                      onChange={(e) => setFormData({ ...formData, cleaning_fee: e.target.value })}
                      placeholder="200"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Max guests</label>
                      <input
                        type="number"
                        value={formData.max_guests}
                        onChange={(e) => setFormData({ ...formData, max_guests: Number(e.target.value) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bedrooms</label>
                      <input
                        type="number"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Beds</label>
                      <input
                        type="number"
                        value={formData.beds}
                        onChange={(e) => setFormData({ ...formData, beds: Number(e.target.value) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Bathrooms</label>
                      <input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                        min={1}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold mb-6">Review your listing</h2>
                <div className="space-y-4 rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Title</span>
                    <span className="font-semibold">{formData.title || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Location</span>
                    <span className="font-semibold">{formData.city || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold">₹{formData.price_per_night || 0} / night</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-semibold">{formData.max_guests} guests · {formData.bedrooms} bedrooms</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Amenities</span>
                    <span className="font-semibold">{formData.amenities.length} selected</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Photos</span>
                    <span className="font-semibold">{formData.image_urls.length} added</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-5 md:static md:border-0 md:p-0 md:mt-10">
              <div className="mx-auto max-w-[1200px] flex items-center justify-between px-5 md:px-0">
                <button
                  onClick={prevStep}
                  disabled={step === 0}
                  className="font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={step === steps.length - 1 ? handleSubmit : nextStep}
                  disabled={loading}
                  className="rounded-lg bg-gray-900 text-white px-8 py-3 font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : step === steps.length - 1 ? 'Publish' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
