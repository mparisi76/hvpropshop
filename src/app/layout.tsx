// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Suspense } from "react";

// Standard imports - NO dynamic imports needed if we wrap correctly
import CategoryBar from '@/components/CategoryBar';
import SearchInput from "@/components/SearchInput";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HV Prop Shop | Premium Rentals",
  description: "The Hudson Valley’s premier one-stop database",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch categories (This makes the layout "Async")
  const props = await directus.request(readItems('props', {
    fields: ['category'],
    limit: -1
  }));
  const uniqueCategories = Array.from(new Set(props.map(p => p.category))).filter(Boolean) as string[];

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-white flex flex-col min-h-screen`}>
        <nav className="sticky top-0 z-100 w-full border-b border-slate-100 bg-white/70 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-black tracking-tighter">
              HV<span className="text-blue-600">PROPSHOP</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                {/* 1. WRAP THE SEARCH HERE */}
                <Suspense fallback={<div className="w-60 h-9 bg-slate-100 rounded-full" />}>
                  <SearchInput />
                </Suspense>
              </div>
              <Link href="/" className="...">Catalog</Link>
            </div>
          </div>
        </nav>

        {/* 2. WRAP THE CATEGORY BAR HERE */}
        <Suspense fallback={<div className="h-12 bg-white" />}>
          <CategoryBar categories={uniqueCategories} />
        </Suspense>

        <main className="grow">{children}</main>
      </body>
    </html>
  );
}