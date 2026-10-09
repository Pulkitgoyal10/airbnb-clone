'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hostApi } from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'sonner';
import { CalendarDays, Home, IndianRupee, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HostDashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading, toggleHostMode } = useUser();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

    const fetchDashboard = async () => {
      try {
        const data = await hostApi.getDashboard();
        setDashboard(data);
      } catch (error) {
        toast.error('Failed to load host dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user, userLoading, router]);

  if (userLoading || (loading && user?.is_host)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (user && !user.is_host) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-[800px] px-5 py-24 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-rose-50 text-[#FF385C]">
            <Sparkles size={36} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Become a host on Airbnb</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto text-base">
            Turn your extra space into extra income. Join our community of hosts today and start earning.
          </p>
          <button
            onClick={async () => {
              setBecomingHost(true);
              try {
                await toggleHostMode(true);
                toast.success('Welcome to hosting!');
              } catch {
                toast.error('Failed to switch to host mode');
              } finally {
                setBecomingHost(false);
              }
            }}
            disabled={becomingHost}
            className="rounded-xl bg-[#FF385C] px-8 py-3.5 font-semibold text-white hover:bg-[#E00B41] disabled:opacity-50 transition shadow-sm text-base"
          >
            {becomingHost ? 'Activating host mode...' : 'Become a host'}
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
            <p className="text-sm font-semibold text-gray-500">Hosting</p>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
          </div>
          <Link
            href="/host/listings/new"
            className="flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-3 font-semibold hover:bg-gray-800"
          >
            <Plus size={20} />
            Create listing
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <StatCard
            icon={<Home size={24} />}
            label="Active listings"
            value={dashboard?.stats?.active_listings ?? 0}
          />
          <StatCard
            icon={<CalendarDays size={24} />}
            label="Upcoming bookings"
            value={dashboard?.stats?.upcoming_bookings ?? 0}
          />
          <StatCard
            icon={<IndianRupee size={24} />}
            label="Total earnings"
            value={`₹${(dashboard?.stats?.total_earnings ?? 0).toLocaleString('en-IN')}`}
          />
        </div>

        <h2 className="text-xl font-semibold mb-4">Upcoming reservations</h2>

        {!dashboard?.reservations || dashboard.reservations.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No upcoming reservations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboard.reservations.map((reservation: any) => (
              <div key={reservation.id} className="border rounded-xl p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Booking #{reservation.id}</p>
                    <p className="text-sm text-gray-500">
                      {reservation.check_in} – {reservation.check_out}
                    </p>
                    <p className="text-sm text-gray-500">
                      {reservation.guests} guest{reservation.guests > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{Number(reservation.total_price).toLocaleString('en-IN')}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide inline-block mt-1 ${
                        reservation.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {reservation.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gray-200 p-5">
      <div className="text-gray-500 mb-2">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
