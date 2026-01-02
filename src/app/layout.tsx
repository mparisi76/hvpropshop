// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Suspense } from "react";
import dynamic from 'next/dynamic';

// 1. Dynamically import client components with SSR disabled to fix Vercel build errors
const CategoryBar = dynamic(() => import('@/components/CategoryBar'), {
  ssr: false,
  loading: () => <div className="h-12 border-b border-slate-50 bg-white" />
});

const SearchInput = dynamic(() => import('@/components/SearchInput'), {
  ssr: false,
  loading: () => <div className="w-60 h-9 bg-slate-100 rounded-full animate-pulse" />
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HV Prop Shop | Premium Rentals",
  description: "The Hudson Valley’s premier one-stop database for movie and photography props",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the unique categories from Directus
  const props = await directus.request(readItems('props', {
    fields: ['category'],
    limit: -1
  }));
  
  const uniqueCategories = Array.from(new Set(props.map(p => p.category))).filter(Boolean) as string[];

  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} antialiased bg-white flex flex-col min-h-screen`}>
        
        {/* NAVIGATION HEADER */}
        <nav className="sticky top-0 z-[100] w-full border-b border-slate-100 bg-white/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
            
            {/* 1. Brand */}
            <div className="flex flex-col items-start gap-0 shrink-0">
              <Link href="/" className="text-xl font-black tracking-tighter hover:text-blue-600 transition">
                HV<span className="text-blue-600">PROPSHOP</span>
              </Link>
              
              <div className="hidden lg:flex items-center gap-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  The Hudson Valley’s premier one-stop database for movie and photography props
                </p>
              </div>
            </div>

            {/* 2. Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <SearchInput />
              </div>
              <Link 
                href="/" 
                className="text-[11px] font-black uppercase tracking-widest px-4 py-2 text-slate-600 hover:text-black transition"
              >
                Catalog
              </Link>
              <Link 
                href="#" 
                className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-blue-600 transition shadow-sm"
              >
                Contact
              </Link>
            </div>
          </div>
        </nav>

        {/* 3. CATEGORY BAR */}
        <CategoryBar categories={uniqueCategories} />

        <main className="grow">
          {children}
        </main>
        
      </body>
    </html>
  );
}