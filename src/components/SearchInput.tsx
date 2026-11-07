"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  // Read directly from URL - no extra state needed
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
    <form onSubmit={handleSearch} role="search" className="relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        aria-hidden
      />
      <input
        // The key resets the input when the search is cleared
        key={currentSearch}
        ref={inputRef}
        type="search"
        name="search"
        defaultValue={currentSearch}
        placeholder="Search props, furniture, vehicles…"
        aria-label="Search inventory"
        className="input h-10 pl-9 pr-9 bg-neutral-50 focus:bg-white [&::-webkit-search-cancel-button]:hidden"
      />
      {currentSearch && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
