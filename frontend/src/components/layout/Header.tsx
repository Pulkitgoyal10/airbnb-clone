'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, CircleUserRound, Globe2, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { authApi } from '@/lib/api';
import { AuthModal, LanguageModal } from '@/components/auth-modal';
import { SearchBar, type Tab } from '@/components/search-bar';

function ImageCategoryIcon({ type }: { type: Tab }) {
  const sources: Record<Tab, string> = {
    All: 'https://a0.muscache.com/im/pictures/AirbnbPlatformAssets/AirbnbPlatformAssets-search-bar-icons/original/a811de29-114f-43a0-b8c5-698d4564bd04.png?im_w=240',
    Homes: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/4aae4ed7-5939-4e76-b100-e69440ebeae4.png?im_w=240',
    Experiences: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/1e24b1c9-b070-48d9-8a70-91aae3151830.png?im_w=240',
    Services: 'https://a0.muscache.com/im/pictures/airbnb-platform-assets/AirbnbPlatformAssets-search-bar-icons/original/2bf5d36d-e731-4465-a8ef-91abbf2ae8ce.png?im_w=240',
  };
  return <img src={sources[type]} alt={type} className="h-16 w-16 object-contain transition-transform duration-200 hover:scale-110" />;
}

export function Header() {
  const { user, loading, toggleHostMode, switchUser, logout } = useUser();
  const [menu, setMenu] = useState(false);
  const [auth, setAuth] = useState(false);
  const [language, setLanguage] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<Array<{ id: number; name: string; is_host: boolean }>>([]);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHostRoute = pathname.startsWith('/host');
  const isHome = pathname === '/';
  const hideChrome = pathname.startsWith('/host/listings/new') || pathname.includes('/edit');
  const tab = ((searchParams.get('category') || 'Homes') as Tab);

  const fetchUsers = async () => {
    try {
      const data = await authApi.getUsers();
      setAllUsers(data.items);
    } catch {
      /* ignore */
    }
  };

  const handleToggleMode = async () => {
    try {
      const currentlyHost = user?.is_host;
      await toggleHostMode();
      toast.success(currentlyHost ? 'Switched to traveling' : 'Switched to hosting');
      router.push(currentlyHost ? '/' : '/host');
    } catch {
      toast.error('Failed to switch mode');
    }
  };

  if (hideChrome) return null;

  return (
    <header className="sticky top-0 z-30 bg-white/95 text-[#222] backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 md:px-8">
        <Link href="/" aria-label="Airbnb home" className="text-[22px] font-bold tracking-[-1.2px] text-[#FF385C]">
          airbnb
        </Link>
        {!isHostRoute && (
          <nav className="hidden items-stretch gap-7 md:flex">
            {(['All', 'Homes', 'Experiences', 'Services'] as Tab[]).map((x) => (
              <Link
                key={x}
                href={`/?category=${x}`}
                className={`top-tab flex cursor-pointer flex-row items-center gap-4 pb-2 ${tab === x ? 'active border-b-2 border-black' : ''}`}
              >
                <ImageCategoryIcon type={x} />
                <span className={x === 'Homes' ? 'text-xl font-semibold text-[#222222]' : 'text-xl text-[#717171] transition-colors hover:text-[#222222]'}>{x}</span>
              </Link>
            ))}
          </nav>
        )}
        {isHostRoute && (
          <nav className="hidden items-center gap-8 md:flex">
            {[
              ['Today', '/host'],
              ['Calendar', '/host/calendar'],
              ['Listings', '/host/listings'],
            ].map(([item, href]) => (
              <Link key={item} href={href} className="text-sm font-semibold hover:underline">
                {item}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-1">
          {!isHostRoute && (
            <button className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-[#f7f7f7] lg:block" onClick={() => (user ? handleToggleMode() : setAuth(true))}>
              {user?.is_host ? 'Switch to hosting' : 'Become a host'}
            </button>
          )}
          {isHostRoute && (
            <Link href="/" className="hidden rounded-full px-4 py-3 text-sm font-semibold hover:bg-[#f7f7f7] lg:block">
              Switch to traveling
            </Link>
          )}
          <button aria-label="Choose language" onClick={() => setLanguage(true)} className="rounded-full p-3 hover:bg-[#f7f7f7]">
            <Globe2 />
          </button>
          <div className="relative">
            <button
              aria-label="Open account menu"
              className="menu-button"
              onClick={() => {
                setMenu(!menu);
                if (!menu) void fetchUsers();
              }}
            >
              <Menu size={18} />
              <span className="flex size-7 items-center justify-center rounded-full bg-[#F7DDF2] text-xs font-semibold">
                {user ? user.name[0].toUpperCase() : <CircleUserRound />}
              </span>
            </button>
            {menu && (
              <div className="popover right-0 top-14 w-64 p-2 text-sm">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading…</div>
                ) : user ? (
                  <>
                    <div className="border-b border-[#eee] px-3 py-2">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-[#717171]">{user.email}</p>
                    </div>
                    <Link href="/trips" className="menu-item" onClick={() => setMenu(false)}>Trips</Link>
                    <Link href="/wishlists" className="menu-item" onClick={() => setMenu(false)}>Wishlists</Link>
                    {user.is_host && (
                      <Link href="/host" className="menu-item" onClick={() => setMenu(false)}>Host dashboard</Link>
                    )}
                    <div className="my-2 border-t border-[#eee]" />
                    <button
                      onClick={() => setSwitchOpen(!switchOpen)}
                      className="menu-item flex w-full items-center justify-between"
                    >
                      Switch demo user <ChevronDown size={16} />
                    </button>
                    {switchOpen &&
                      allUsers.map((u) => (
                        <button
                          key={u.id}
                          className="menu-item pl-5 text-[#555]"
                          onClick={async () => {
                            await switchUser(u.id);
                            setMenu(false);
                            toast.success(`Switched to ${u.name}`);
                            router.refresh();
                          }}
                        >
                          {u.name} ({u.is_host ? 'Host' : 'Guest'})
                        </button>
                      ))}
                    <button
                      onClick={() => {
                        logout();
                        setMenu(false);
                        router.push('/');
                      }}
                      className="menu-item"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setAuth(true); setMenu(false); }} className="menu-item font-semibold">Log in</button>
                    <button onClick={() => { setAuth(true); setMenu(false); }} className="menu-item">Sign up</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {!isHostRoute && (
        <nav className="mx-auto flex max-w-[520px] justify-between px-8 pb-3 md:hidden">
          {(['All', 'Homes', 'Experiences', 'Services'] as Tab[]).map((x) => (
            <Link key={x} href={`/?category=${x}`} className={`mobile-tab ${tab === x ? 'active' : ''}`}>
              {x}
            </Link>
          ))}
        </nav>
      )}
      {isHome && (
        <div className="search-gradient px-5 pb-5">
          <SearchBar tab={tab} />
        </div>
      )}
      {auth && <AuthModal onClose={() => setAuth(false)} />}
      {language && <LanguageModal onClose={() => setLanguage(false)} />}
    </header>
  );
}
