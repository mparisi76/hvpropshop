"use client";

import { useState } from "react";

/**
 * Optimistic category selection: highlight a clicked category immediately,
 * before the new page arrives. The pending choice is tied to the selection it
 * was made from, so it clears itself once navigation completes.
 */
export function usePendingCategory(selectedSlug: string | undefined) {
  const [pending, setPending] = useState<{ slug: string | undefined; from: string | undefined } | null>(null);
  const isPending = pending !== null && pending.from === selectedSlug && pending.slug !== selectedSlug;
  return {
    /** The category to show as selected */
    activeSlug: isPending ? pending!.slug : selectedSlug,
    /** True between the click and the new page arriving */
    isPending,
    /** Call from a category link's onClick */
    select: (slug: string | undefined) => setPending({ slug, from: selectedSlug }),
  };
}
