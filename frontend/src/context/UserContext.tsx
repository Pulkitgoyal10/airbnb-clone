'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, ApiError } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  is_host: boolean;
  avatar_url: string | null;
  created_at: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  mounted: boolean;
  login: (emailOrPhone: string, name?: string) => Promise<void>;
  logout: () => void;
  toggleHostMode: (forceHost?: boolean) => Promise<void>;
  switchUser: (userId: number) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load user from localStorage on mount
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (savedUserId) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      localStorage.setItem('userId', userData.id.toString());
    } catch (error) {
      // If user not found, clear localStorage
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        localStorage.removeItem('userId');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrPhone: string, name?: string) => {
    const userData = await authApi.login(emailOrPhone, name);
    setUser(userData);
    localStorage.setItem('userId', userData.id.toString());
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  const toggleHostMode = async (forceHost?: boolean) => {
    if (!user) return;
    const targetMode = forceHost !== undefined ? forceHost : !user.is_host;
    const userData = await authApi.updateMode(targetMode);
    setUser(userData);
  };

  const switchUser = async (userId: number) => {
    localStorage.setItem('userId', userId.toString());
    await refreshUser();
  };

  return (
    <UserContext.Provider value={{ user, loading, mounted, login, logout, toggleHostMode, switchUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
