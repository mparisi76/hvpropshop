"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import Select from "@/components/ui/Select";
import TrackEvent from "@/components/TrackEvent";
import { sendContact, type ContactState } from "@/app/actions/sendContact";

export default function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, null);
  const v = state?.values ?? {};

  if (state?.success) {
    return (
      <div className="card space-y-2 p-6">
        <TrackEvent name="Contact message sent" />
        <Check className="h-7 w-7 text-accent" aria-hidden />
        <h2 className="text-lg font-semibold">Message sent</h2>
        <p className="text-sm text-neutral-600">Thanks for getting in touch. We&apos;ll reply by email, usually within a day.</p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-5 p-6">
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">Name</label>
          <input id="c-name" name="name" required autoComplete="name" defaultValue={v.name} className="input" />
        </div>
        <div>
          <label htmlFor="c-email" className="label">Email</label>
          <input id="c-email" name="email" type="email" required autoComplete="email" defaultValue={v.email} className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="c-topic" className="label">What&apos;s it about?</label>
        <Select id="c-topic" name="topic" defaultValue={v.topic ?? defaultTopic ?? "Booking question"}>
          <option>Booking question</option>
          <option>Listing my inventory</option>
          <option>Partnerships or press</option>
          <option>Something else</option>
        </Select>
      </div>
      <div>
        <label htmlFor="c-message" className="label">Message</label>
        <textarea id="c-message" name="message" required rows={6} defaultValue={v.message} className="input resize-y" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
