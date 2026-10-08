'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, CircleUserRound, Globe2, X, ChevronDown } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export function Header() {
  const { user, loading, toggleHostMode, switchUser, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switchUserOpen, setSwitchUserOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const isHostRoute = pathname.startsWith('/host');
  const isTravelRoute = !isHostRoute;

  const fetchUsers = async () => {
    try {
      const data = await authApi.getUsers();
      setAllUsers(data.items);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleToggleMode = async () => {
    try {
      await toggleHostMode();
      toast.success(user?.is_host ? 'Switched to traveling' : 'Switched to hosting');
      router.push(user?.is_host ? '/' : '/host');
    } catch (error) {
      toast.error('Failed to switch mode');
    }
  };

  const handleSwitchUser = async (userId: number) => {
    try {
      await switchUser(userId);
      setSwitchUserOpen(false);
      toast.success('User switched');
      router.refresh();
    } catch (error) {
      toast.error('Failed to switch user');
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 md:px-8">
        <Link href="/" className="text-[22px] font-bold tracking-[-1.2px] text-[#FF385C]">
          airbnb
        </Link>

        {isTravelRoute && (
          <nav className="hidden items-stretch gap-7 md:flex">
            {['All', 'Homes', 'Experiences', 'Services'].map((item) => (
              <Link
                key={item}
                href={`/?category=${item.toLowerCase()}`}
                className="flex flex-col items-center gap-1 pb-2 text-sm font-medium text-gray-500 hover:text-black border-b-2 border-transparent hover:border-black transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {isTravelRoute && (
            <button
              onClick={handleToggleMode}
              className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-gray-100 lg:block"
            >
              {user?.is_host ? 'Switch to traveling' : 'Become a host'}
            </button>
          )}

          {isHostRoute && (
            <Link
              href="/"
              className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-gray-100 lg:block"
            >
              Switch to traveling
            </Link>
          )}

          <button
            className="rounded-full p-3 hover:bg-gray-100"
            aria-label="Choose language"
          >
            <Globe2 size={20} />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                if (!userMenuOpen) fetchUsers();
              }}
              className="flex items-center gap-2 rounded-full border border-gray-300 p-1 pl-3 hover:shadow-md transition-shadow"
            >
              <Menu size={18} />
              <div className="flex size-8 items-center justify-center rounded-full bg-gray-500 text-white text-xs font-semibold">
                {user ? user.name[0].toUpperCase() : <CircleUserRound size={20} />}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-14 w-64 rounded-xl bg-white shadow-xl border border-gray-200 p-2">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                ) : user ? (
                  <>
                    <div className="border-b border-gray-200 p-3">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/trips"
                      className="block px-4 py-3 text-sm hover:bg-gray-100 rounded-lg"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Trips
                    </Link>
                    <Link
                      href="/wishlists"
                      className="block px-4 py-3 text-sm hover:bg-gray-100 rounded-lg"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Wishlists
                    </Link>
                    {user.is_host && (
                      <Link
                        href="/host"
                        className="block px-4 py-3 text-sm hover:bg-gray-100 rounded-lg"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Host Dashboard
                      </Link>
                    )}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={() => setSwitchUserOpen(!switchUserOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-100 rounded-lg"
                      >
                        <span>Switch demo user</span>
                        <ChevronDown size={16} />
                      </button>
                      {switchUserOpen && (
                        <div className="mt-2 pl-4">
                          {allUsers.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => handleSwitchUser(u.id)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-lg"
                            >
                              {u.name} ({u.is_host ? 'Host' : 'Guest'})
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 rounded-lg text-red-600"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      // Show auth modal (to be implemented)
                      toast.info('Auth modal coming soon');
                    }}
                    className="w-full px-4 py-3 text-sm font-semibold rounded-lg hover:bg-gray-100"
                  >
                    Log in
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
