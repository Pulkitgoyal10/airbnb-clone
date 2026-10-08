'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

type DateRange = { from?: Date; to?: Date };
import { Minus, Plus, Search } from 'lucide-react';

export type Tab = 'All' | 'Homes' | 'Experiences' | 'Services';
type Panel = 'where' | 'when' | 'who' | null;

function MonthGrid({
  year,
  month,
  range,
  onSelect,
}: {
  year: number;
  month: number;
  range: DateRange | undefined;
  onSelect: (date: Date) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1));
  return (
    <div className="min-w-0 flex-1">
      <h3 className="mb-5 text-center text-base font-semibold">{monthName}</h3>
      <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-gray-500">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const past = date < today;
          const selected = Boolean(
            (range?.from && date.getTime() === range.from.getTime()) ||
              (range?.to && date.getTime() === range.to.getTime()),
          );
          return (
            <button
              type="button"
              key={day}
              disabled={past}
              aria-label={`${monthName} ${day}`}
              onClick={() => onSelect(date)}
              className={`mx-auto flex size-9 items-center justify-center rounded-full border border-transparent transition ${past ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer hover:border-black'} ${selected ? 'bg-black text-white hover:bg-black' : ''}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SearchBar({ tab }: { tab: Tab }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [range, setRange] = useState<DateRange>();
  const [location, setLocation] = useState('');
  const [guests, setGuests] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const labels =
    tab === 'Homes'
      ? ['Where', 'Check in + Check out', 'Who']
      : tab === 'Experiences'
        ? ['Where', 'When', 'Type of experience']
        : tab === 'Services'
          ? ['Where', 'When', 'Type of service']
          : ['Where', 'When', 'Who'];
  const active = panel !== null;
  const now = new Date();

  const doSearch = () => {
    const q = new URLSearchParams();
    if (location) q.set('location', location);
    if (range?.from) q.set('check_in', format(range.from, 'yyyy-MM-dd'));
    if (range?.to) q.set('check_out', format(range.to, 'yyyy-MM-dd'));
    if (guests) q.set('guests', String(guests));
    if (tab !== 'All') q.set('category', tab);
    router.push(`/search?${q.toString()}`);
  };

  const selectDate = (date: Date) => {
    if (!range?.from || range.to || date < range.from) setRange({ from: date });
    else setRange({ from: range.from, to: date });
  };

  useEffect(() => {
    const f = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPanel(null);
    };
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null);
    document.addEventListener('mousedown', f);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', f);
      document.removeEventListener('keydown', k);
    };
  }, []);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[850px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSearch();
        }}
        className={`search-pill flex h-16 items-center rounded-full border border-gray-200 bg-white p-1 shadow-md transition-colors ${active ? 'bg-[#EBEBEB]' : ''}`}
      >
        <button type="button" className={`search-segment flex-1 text-left ${panel === 'where' ? 'active' : ''}`} onClick={() => setPanel(panel === 'where' ? null : 'where')}>
          <span>{labels[0]}</span>
          <strong>{location || 'Search destinations'}</strong>
        </button>
        <i className="segment-divider" />
        <button type="button" className={`search-segment hidden flex-1 text-left sm:block ${panel === 'when' ? 'active' : ''}`} onClick={() => setPanel(panel === 'when' ? null : 'when')}>
          <span>{labels[1]}</span>
          <strong>
            {range?.from ? (range.to ? `${format(range.from, 'd MMM')} – ${format(range.to, 'd MMM')}` : format(range.from, 'd MMM')) : 'Add dates'}
          </strong>
        </button>
        <i className="segment-divider hidden sm:block" />
        <button type="button" className={`search-segment flex-1 text-left ${panel === 'who' ? 'active' : ''}`} onClick={() => setPanel(panel === 'who' ? null : 'who')}>
          <span>{labels[2]}</span>
          <strong>{guests ? `${guests} guest${guests > 1 ? 's' : ''}` : 'Add guests'}</strong>
        </button>
        <button type="submit" aria-label="Search" className={`search-submit ${active ? 'expanded' : ''}`}>
          <Search data-icon="inline-start" />
          {active && <span>Search</span>}
        </button>
      </form>
      {panel === 'where' && (
        <div className="popover left-0 top-[76px] w-[360px] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Search by region</p>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="auth-input mb-3"
            placeholder="Search destinations"
            aria-label="Destination"
          />
          <div className="grid grid-cols-2 gap-2">
            {['Chandigarh', 'Mohali', 'Zirakpur', 'Gurgaon', 'Panchkula'].map((x) => (
              <button type="button" key={x} onClick={() => { setLocation(x); setPanel(null); }} className="rounded-xl p-3 text-left text-sm hover:bg-gray-100">
                {x}
              </button>
            ))}
          </div>
        </div>
      )}
      {panel === 'when' && (
        <div className="absolute left-1/2 top-[76px] z-40 flex w-[min(760px,calc(100vw-32px))] -translate-x-1/2 flex-row gap-8 overflow-auto rounded-3xl bg-white p-8 shadow-2xl">
          <MonthGrid year={now.getFullYear()} month={now.getMonth()} range={range} onSelect={selectDate} />
          <MonthGrid year={now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()} month={(now.getMonth() + 1) % 12} range={range} onSelect={selectDate} />
        </div>
      )}
      {panel === 'who' && (
        <div className="popover right-0 top-[76px] w-[330px] p-5">
          {['Adults', 'Children', 'Infants'].map((x, i) => (
            <div key={x} className="flex items-center justify-between border-b border-gray-100 py-4 last:border-0">
              <div>
                <p className="font-medium">{x}</p>
                <p className="text-sm text-gray-500">{i === 0 ? 'Ages 13 or above' : i === 1 ? 'Ages 2–12' : 'Under 2'}</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" aria-label={`Decrease ${x}`} onClick={() => setGuests(Math.max(0, guests - 1))} className="flex size-8 items-center justify-center rounded-full border">
                  <Minus />
                </button>
                <span>{i === 0 ? guests : 0}</span>
                <button type="button" aria-label={`Increase ${x}`} onClick={() => setGuests(guests + 1)} className="flex size-8 items-center justify-center rounded-full border">
                  <Plus />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
