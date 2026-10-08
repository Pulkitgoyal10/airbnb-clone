'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hostApi, listingsApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function HostCalendarPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [blockedRanges, setBlockedRanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.is_host) {
        router.push('/');
        return;
      }

      try {
        const data = await hostApi.getListings();
        setListings(data.items);
        if (data.items.length > 0) {
          setSelectedListing(data.items[0].id);
          await fetchAvailability(data.items[0].id);
        }
      } catch (error) {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  const fetchAvailability = async (listingId: number) => {
    try {
      const data = await listingsApi.getAvailability(listingId);
      setBlockedRanges(data.blocked_ranges);
    } catch (error) {
      console.error('Failed to load availability');
    }
  };

  const handleListingChange = async (listingId: number) => {
    setSelectedListing(listingId);
    await fetchAvailability(listingId);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateBlocked = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];

    return blockedRanges.some((range) => {
      const checkIn = new Date(range.check_in);
      const checkOut = new Date(range.check_out);
      return date >= checkIn && date < checkOut;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const today = new Date();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1120px] px-5 py-10 md:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-8">
          <div>
            <p className="text-sm font-semibold text-gray-500">Planning</p>
            <h1 className="text-3xl font-semibold">Calendar</h1>
          </div>
          <select
            value={selectedListing || ''}
            onChange={(e) => handleListingChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
          >
            {listings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.title}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-gray-200 p-5 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-3">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isPast = date < today;
              const isBlocked = isDateBlocked(day);

              return (
                <div
                  key={day}
                  className={`m-1 flex aspect-square items-center justify-center rounded-xl text-sm ${
                    isPast ? 'text-gray-300' :
                    isBlocked ? 'bg-red-50 text-red-600 font-semibold' :
                    'hover:bg-gray-100'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-50" />
              <span className="text-gray-600">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-gray-300" />
              <span className="text-gray-600">Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
