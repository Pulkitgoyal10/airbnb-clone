import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/context/UserContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Airbnb | Vacation rentals, cabins, beach houses & more',
  description: 'Book unique homes and experiences',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <UserProvider>
          <WishlistProvider>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <main className="min-h-screen bg-white text-[#222]">{children}</main>
            <Footer />
            <Toaster position="bottom-center" toastOptions={{ className: 'airbnb-toast' }} />
          </WishlistProvider>
        </UserProvider>
      </body>
    </html>
  );
}
