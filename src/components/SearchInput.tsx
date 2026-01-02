'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';

// This inner component handles the URL logic
function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? '';
    if (inputRef.current) {
      inputRef.current.value = currentSearch;
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = inputRef.current?.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (term) params.set('search', term);
    else params.delete('search');
    
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative group w-full max-w-60">
      <input
        ref={inputRef}
        type="text"
        name="search"
        placeholder="SEARCH THE VAULT..."
        className="w-full bg-slate-100 border-none rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-widest placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
      />
      <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-600 transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </form>
  );
}

// This is what the Layout actually imports
export default function SearchInput() {
  return (
    <Suspense fallback={
      <div className="w-60 h-9 bg-slate-100 rounded-full animate-pulse" />
    }>
      <SearchField />
    </Suspense>
  );
}