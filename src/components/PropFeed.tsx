"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import PropCard from "./PropCard";
import { Prop } from "@/types";

interface PropFeedProps {
  initialItems: Prop[];
  category?: string;
  search?: string;
  vendor?: string;
  loc?: string;
  sort?: string;
  near?: string;
  radius?: number;
  totalCount: number;
}

export default function PropFeed({
  initialItems,
  category,
  search,
  vendor,
  loc,
  sort,
  near,
  radius,
  totalCount,
}: PropFeedProps) {
  const [items, setItems] = useState<Prop[]>(initialItems);
  const [offset, setOffset] = useState(initialItems.length);
  const [loading, setLoading] = useState(false);

  const hasMore = items.length < totalCount;

  const loadMore = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        offset: String(offset),
        category: category || "",
        search: search || "",
      });
      if (vendor) params.set("vendor", vendor);
      if (loc) params.set("loc", loc);
      if (sort) params.set("sort", sort);
      if (near) params.set("near", near);
      if (radius) params.set("radius", String(radius));
      const response = await fetch(`/api/props?${params.toString()}`);
      const nextItems = await response.json();

      if (Array.isArray(nextItems) && nextItems.length > 0) {
        setItems((prev) => [...prev, ...nextItems]);
        setOffset((prev) => prev + nextItems.length);
      }
    } catch (e) {
      console.error("Load more error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => (
          <PropCard key={`${item.id}-${index}`} item={item} />
        ))}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2">
          <button onClick={loadMore} disabled={loading} className="btn-secondary min-w-40">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Loading
              </>
            ) : (
              "Load more"
            )}
          </button>
          <p className="text-xs text-neutral-500">
            Showing {items.length} of {totalCount}
          </p>
        </div>
      )}
    </div>
  );
}
