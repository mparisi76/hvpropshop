"use client";

import { useState } from "react";
import PropCard from "./PropCard";
import { Prop } from "@/types";

interface PropFeedProps {
  initialItems: Prop[];
  category?: string;
  search?: string;
  totalCount: number;
}

export default function PropFeed({
  initialItems,
  category,
  search,
  totalCount,
}: PropFeedProps) {
  const [items, setItems] = useState<Prop[]>(initialItems);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);

  // Derived state: We have more if our current list is shorter than the total vault count
  const hasMore = items.length < totalCount;

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/props?offset=${offset}&category=${category || ""}&search=${
          search || ""
        }`
      );
      const nextItems = await response.json();

      if (nextItems.length > 0) {
        setItems((prev) => [...prev, ...nextItems]);
        setOffset((prev) => prev + nextItems.length);
      }
    } catch (e) {
      console.error("Load more error:", e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-12 lg:gap-16">
      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-10">
        {items.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="animate-fade-in-up"
            style={{ animationDelay: `${(index % 12) * 50}ms` }}
          >
            <PropCard item={item} />
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      <div className="flex justify-center pb-20">
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={loading}
            className="group relative px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Fetching Props...
              </span>
            ) : (
              "Load More Inventory"
            )}
          </button>
        ) : totalCount > 12 ? (
          /* Only show the "End of Vault" footer if the user actually 
             had more than one page of content to scroll through. 
          */
          <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="h-px w-24 bg-linear-to-r from-transparent via-slate-200 to-transparent" />

            <div className="text-center">
              <p className="text-slate-400 font-serif italic text-sm">
                You’ve reached the end
              </p>
              <button
                onClick={scrollToTop}
                className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold hover:text-blue-600 transition-colors"
              >
                Back to Top ↑
              </button>
            </div>

            <div className="h-px w-24 bg-linear-to-r from-transparent via-slate-200 to-transparent" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
