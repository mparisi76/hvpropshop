"use client";

import { useActionState } from "react";
import { BellRing, Check } from "lucide-react";
import TrackEvent from "@/components/TrackEvent";
import { createItemAlertAction, type SearchAlertState } from "@/app/actions/createSearchAlert";

/** "Notify me when it's available", shown on items that are currently out. */
export default function ItemAlertForm({ propId }: { propId: string }) {
  const [state, action, pending] = useActionState<SearchAlertState, FormData>(createItemAlertAction, null);

  if (state?.success) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-green-200 bg-accent-soft px-4 py-3 text-sm text-accent">
        <TrackEvent name="Item alert created" props={{ item: propId }} />
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          We&apos;ll email <span className="font-medium">{state.email}</span> as soon as it&apos;s available.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <BellRing className="h-4 w-4 text-neutral-500" aria-hidden /> Not available right now
      </p>
      <p className="mt-1 text-sm text-neutral-600">Get an email when it&apos;s available again.</p>
      <input type="hidden" name="prop_id" value={propId} />
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <div className="mt-3 flex gap-2">
        <label htmlFor="item-alert-email" className="sr-only">Email</label>
        <input
          id="item-alert-email"
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
    </form>
  );
}
