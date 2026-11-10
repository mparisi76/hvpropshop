"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * Records an analytics event once when it renders (e.g. a search result or a
 * success message). Change `eventKey` to record again.
 */
export default function TrackEvent({
  name,
  props,
  eventKey,
}: {
  name: string;
  props?: Record<string, string | number | boolean | null | undefined>;
  eventKey?: string;
}) {
  const sent = useRef<string | null>(null);
  const key = eventKey ?? name;

  useEffect(() => {
    if (sent.current === key) return;
    sent.current = key;
    // Give the analytics script a moment to load on first page view
    const t = setTimeout(() => track(name, props), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
}
