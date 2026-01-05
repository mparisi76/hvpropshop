'use client';

import { useState } from 'react';
import PropCard from './PropCard';
import { Prop } from '@/types';
// We'll need a client-side fetcher or an API route to hit Directus
// import { getMoreProps } from '@/lib/api'; 

interface PropFeedProps {
  initialItems: Prop[];
  category?: string;
  search?: string;
}

export default function PropFeed({ initialItems, category, search }: PropFeedProps) {
  const [items, setItems] = useState<Prop[]>(initialItems);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 12); // Assuming 12 per page

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
    }
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {items.map((item) => (
          <PropCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pb-20">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Loading...' : 'Load More Props'}
          </button>
        </div>
      )}
    </div>
  );
}