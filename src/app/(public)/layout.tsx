import Link from "next/link";
import { Suspense } from "react";
import SearchInput from "@/components/SearchInput";
import Logo from "@/components/Logo";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 w-full h-16">
        <nav className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between gap-4 md:gap-8">
          <div className="flex flex-col items-start shrink-0">
            <Logo variant="dark" />
            <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
              The Hudson Valley’s premier database for props
            </p>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden sm:block">
              <Suspense fallback={<div className="w-60 h-9 bg-slate-100 rounded-full animate-pulse" />}>
                <SearchInput />
              </Suspense>
            </div>
            <a href="mailto:hudsonvalleypropshop@gmail.com" className="text-[10px] md:text-[11px] font-black uppercase tracking-widest px-2 md:px-4 py-2 text-slate-600 hover:text-black transition">
              Contact
            </a>
            <div className="h-4 w-px bg-slate-200 mx-1 hidden md:block" /> {/* Vertical Divider */}
  
            <Link 
              href="/login" 
              className="text-[10px] md:text-[11px] font-black uppercase tracking-widest px-3 md:px-5 py-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition shadow-sm"
            >
              Vendor Login
            </Link>
          </div>
        </nav>
      </header>

      <main className="grow">{children}</main>
    </>
  );
}