// import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import SearchInput from "@/components/SearchInput";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      {/* Added overflow-x-hidden to body as a safety net */}
      <body
        className={`${inter.className} antialiased bg-white flex flex-col min-h-screen overflow-x-hidden`}
      >
        {/* HEADER: Made sticky and added solid background + z-index */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100 w-full h-16">
          <nav className="max-w-7xl mx-auto">
            <div className="px-4 md:px-6 h-20 md:h-16 flex items-center justify-between gap-4 md:gap-8">
              {/* 1. Brand - Compact */}
              <div className="flex flex-col items-start gap-0 shrink-0">
                <Link
                  href="/"
                  className="text-xl font-black tracking-tighter hover:text-blue-600 transition"
                >
                  HV<span className="text-blue-600">PROPSHOP</span>
                </Link>

                <div className="flex items-center gap-4">
                  <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight max-w-45 md:max-w-none">
                    The Hudson Valley’s premier database for props
                  </p>
                </div>
              </div>

              {/* 3. Navigation Actions */}
              <div className="flex items-center gap-1 md:gap-2">
                <div className="hidden sm:block">
                  <Suspense
                    fallback={
                      <div className="w-60 h-9 bg-slate-100 rounded-full animate-pulse" />
                    }
                  >
                    <SearchInput />
                  </Suspense>
                </div>
                <Link
                  href="/"
                  className="text-[10px] md:text-[11px] font-black uppercase tracking-widest px-2 md:px-4 py-2 text-slate-600 hover:text-black transition"
                >
                  Catalog
                </Link>
                <a
                  href="mailto:hudsonvalleypropshop@gmail.com?subject=HV Prop Shop Inquiry"
                  className="text-[10px] md:text-[11px] font-black uppercase tracking-widest px-2 md:px-4 py-2 text-slate-600 hover:text-black transition shrink-0"
                >
                  Contact
                </a>
              </div>
            </div>
          </nav>
        </header>

        <main className="grow">{children}</main>
      </body>
    </html>
  );
}
