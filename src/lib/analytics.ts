"use client";

/**
 * Send a custom event to whichever analytics tool is loaded (Umami or
 * Plausible). Does nothing if neither is configured, so it's always safe to call.
 */
type Props = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Props) => void };
    plausible?: (name: string, options?: { props?: Props }) => void;
  }
}

export function track(name: string, props?: Props) {
  if (typeof window === "undefined") return;
  const clean = props
    ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined && v !== null))
    : undefined;
  try {
    window.umami?.track(name, clean);
    window.plausible?.(name, clean ? { props: clean } : undefined);
  } catch {
    // Analytics must never break the page
  }
}
