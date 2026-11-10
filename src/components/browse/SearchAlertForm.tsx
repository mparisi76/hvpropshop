"use client";

import { useActionState } from "react";
import { BellRing, Check } from "lucide-react";
import TrackEvent from "@/components/TrackEvent";
import { createSearchAlertAction, type SearchAlertState } from "@/app/actions/createSearchAlert";

/** "Notify me when it's listed", shown on searches with no results. */
export default function SearchAlertForm({
  query,
  category,
  near,
  radius,
}: {
  query: string;
  category?: string;
  near?: string;
  radius?: number;
}) {
  const [state, action, pending] = useActionState<SearchAlertState, FormData>(createSearchAlertAction, null);

  if (state?.success) {
    return (
      <div className="mt-6 flex items-start gap-2 rounded-md border border-green-200 bg-accent-soft px-4 py-3 text-left text-sm text-accent">
        <TrackEvent name="Search alert created" props={{ query: query.toLowerCase() }} />
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Done. We&apos;ll email <span className="font-medium">{state.email}</span> when &ldquo;{query}&rdquo; is listed.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 w-full max-w-sm rounded-md border border-neutral-200 bg-neutral-50 p-4 text-left">
      <p className="flex items-center gap-2 text-sm font-medium">
        <BellRing className="h-4 w-4 text-neutral-500" aria-hidden /> Get an email when &ldquo;{query}&rdquo; is listed
      </p>
      <input type="hidden" name="query" value={query} />
      {category && <input type="hidden" name="category" value={category} />}
      {near && <input type="hidden" name="near" value={near} />}
      {radius && <input type="hidden" name="radius" value={radius} />}
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <div className="mt-3 flex gap-2">
        <label htmlFor="alert-email" className="sr-only">Email</label>
        <input
          id="alert-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@production.com"
          className="input h-9! py-1.5!"
        />
        <button type="submit" disabled={pending} className="btn-primary h-9! shrink-0">
          {pending ? "Saving…" : "Notify me"}
        </button>
      </div>
      {state?.error && <p className="mt-2 text-xs text-red-700">{state.error}</p>}
      <p className="mt-2 text-xs text-neutral-500">One email, then the alert ends. You can cancel anytime.</p>
    </form>
  );
}
