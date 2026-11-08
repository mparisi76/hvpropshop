"use client";

import { useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

const INTERVAL_MS = 30_000;

/**
 * Keeps a "waiting for the vendor" page current: re-checks every 30s while the
 * tab is visible, immediately when the visitor returns to the tab, and on demand.
 */
export default function StatusRefresher() {
  const router = useRouter();
  const [checking, start] = useTransition();

  const check = useCallback(() => start(() => router.refresh()), [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-neutral-500" aria-live="polite">
      <span className="flex items-center gap-1.5">
        {checking ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
        )}
        {checking ? "Checking…" : "This page updates automatically"}
      </span>
      <button type="button" onClick={check} disabled={checking} className="btn-ghost h-8! px-2.5!">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        Check now
      </button>
    </div>
  );
}
