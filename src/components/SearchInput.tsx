'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';

function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? '';
    if (inputRef.current) inputRef.current.value = currentSearch;
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
        className="w-full bg-slate-100 border-none rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none"
      />
    </form>
  );
}

export default function SearchInput() {
  return (
    <Suspense fallback={<div className="w-60 h-9 bg-slate-100 rounded-full" />}>
      <SearchField />
    </Suspense>
  );
}