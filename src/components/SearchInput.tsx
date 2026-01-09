"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, Suspense } from "react";

function SearchField() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Read directly from URL - no useEffect or extra state needed
  const currentSearch = searchParams.get("search") ?? "";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const term = inputRef.current?.value.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (term) params.set("search", term);
    else params.delete("search");

    router.push(`/?${params.toString()}`);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative group w-full max-w-72">
      <div className="relative flex items-center">
        <input
          // The key ensures React resets the input DOM element when the search is cleared
          key={currentSearch}
          ref={inputRef}
          type="text"
          name="search"
          defaultValue={currentSearch}
          placeholder="SEARCH DATABASE..."
          className="w-full bg-slate-100 border-2 border-transparent focus:border-slate-200 focus:bg-white rounded-full pl-5 pr-10 py-3 text-[11px] font-semibold tracking-wider outline-none transition-all placeholder:text-slate-400"
        />

        {currentSearch ? (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
            aria-label="Clear search"
          >
            {/* Inline X Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        ) : (
          <div className="absolute right-4 text-slate-300 pointer-events-none">
            {/* Inline Search Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        )}
      </div>
    </form>
  );
}

export default function SearchInput() {
  return (
    <Suspense
      fallback={
        <div className="w-72 h-11 bg-slate-100 rounded-full animate-pulse" />
      }
    >
      <SearchField />
    </Suspense>
  );
}
