'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { AirbnbLogo } from '@/components/layout/AirbnbLogo';

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { login } = useUser();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!emailOrPhone.trim()) {
      toast.error('Enter an email or phone number');
      return;
    }
    setLoading(true);
    try {
      await login(emailOrPhone.trim(), name.trim() || undefined);
      toast.success('Welcome to Airbnb');
      onClose();
    } catch {
      toast.error('Could not log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="relative w-[min(560px,calc(100vw-24px))] rounded-3xl bg-white shadow-2xl">
        <button aria-label="Close" onClick={onClose} className="absolute left-5 top-5 rounded-full p-2 hover:bg-[#f7f7f7]">
          <X />
        </button>
        <div className="border-b border-[#eee] px-8 py-5 text-center font-semibold">Log in or sign up</div>
        <div className="p-8">
          <AirbnbLogo height={40} className="text-[#FF385C] mb-4" />
          <h2 className="mb-5 text-2xl font-semibold">Welcome to Airbnb</h2>
          <input className="auth-input" aria-label="Email or phone" placeholder="Email or phone" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} />
          <input className="auth-input mt-3" aria-label="Name" placeholder="Name (optional for new accounts)" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="gradient-button mt-4 w-full" onClick={onSubmit} disabled={loading}>
            {loading ? 'Continuing…' : 'Continue'}
          </button>
          <p className="mt-5 text-center text-xs text-[#717171]">By continuing, you agree to Airbnb&apos;s Terms of Service.</p>
        </div>
      </div>
    </div>
  );
}

export function LanguageModal({ onClose }: { onClose: () => void }) {
  const [currency, setCurrency] = useState('INR ₹');
  const [language, setLanguage] = useState('English');
  return (
    <div className="modal-backdrop">
      <div className="relative w-[min(520px,calc(100vw-24px))] rounded-3xl bg-white p-7 shadow-2xl">
        <button aria-label="Close" onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 hover:bg-[#f7f7f7]">
          <X />
        </button>
        <h2 className="text-2xl font-semibold">Language and region</h2>
        <h3 className="mt-7 text-sm font-semibold">Language</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['English', 'हिन्दी', 'ਪੰਜਾਬੀ'].map((x) => (
            <button className={`rounded-xl border p-3 text-sm ${language === x ? 'border-[#222] bg-[#f7f7f7]' : ''}`} onClick={() => { setLanguage(x); toast(`Language set to ${x}`); }} key={x}>
              {x}
            </button>
          ))}
        </div>
        <h3 className="mt-7 text-sm font-semibold">Currency</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {['INR ₹', 'USD $', 'EUR €'].map((x) => (
            <button className={`rounded-xl border px-4 py-3 text-sm ${currency === x ? 'border-[#222] bg-[#f7f7f7]' : ''}`} onClick={() => { setCurrency(x); toast(`Currency set to ${x}`); }} key={x}>
              {x}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
