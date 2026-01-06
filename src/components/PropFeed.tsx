'use client';

import { useState } from 'react';
import PropCard from './PropCard';
import { Prop } from '@/types';

interface PropFeedProps {
  initialItems: Prop[];
  category?: string;
  search?: string;
}

export default function PropFeed({ initialItems, category, search }: PropFeedProps) {
  const [items, setItems] = useState<Prop[]>(initialItems);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 12);

  const loadMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/props?offset=${offset}&category=${category || ''}&search=${search || ''}`
      );
      const nextItems = await response.json();
      
      if (nextItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...nextItems]);
        setOffset(prev => prev + nextItems.length);
        if (nextItems.length < 12) setHasMore(false);
      }
    } catch (e) {
      console.error("Load more error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-10">
        {items.map((item, index) => (
          <div 
            key={`${item.id}-${index}`} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${(index % 12) * 50}ms` }} // Staggered entry
          >
            <PropCard item={item} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-20">
          <button
            onClick={loadMore}
            disabled={loading}
            className="group relative px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all hover:bg-blue-600 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Fetching Props...
              </span>
            ) : (
              'Load More Inventory'
            )}
          </button>
        </div>
      )}
    </div>
  );
}