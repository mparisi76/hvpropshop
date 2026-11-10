"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

/** Body of every "something went wrong" page. */
export default function ErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-page max-w-xl! py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Something went wrong</h1>
      <p className="mt-2 text-neutral-600">
        Sorry about that. We&apos;ve been notified. Try again, and if it keeps happening, let us know.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" aria-hidden /> Try again
        </button>
        <Link href="/" className="btn-secondary">Go home</Link>
        <Link href="/contact" className="btn-ghost">Contact us</Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-neutral-400">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </div>
  );
}
