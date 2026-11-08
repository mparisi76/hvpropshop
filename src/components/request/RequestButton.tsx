"use client";

import { useActionState, useCallback, useState } from "react";
import { Check } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { sendRequest, type RequestState, type RequestType } from "@/app/actions/sendRequest";
import { businessToday } from "@/lib/site";

export interface RequestButtonProps {
  type: RequestType;
  itemIds: string[];
  /** Short description of what's being requested, shown at the top of the form */
  summary: React.ReactNode;
  label: React.ReactNode;
  className?: string;
  defaults?: { production?: string; start_date?: string; end_date?: string };
  /** For quotes: the most units that can be requested */
  maxQuantity?: number;
}

export default function RequestButton(props: RequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const close = useCallback(() => {
    setOpen(false);
    setFormKey((k) => k + 1); // fresh form next time
  }, []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={props.className}>
        {props.label}
      </button>
      {open && (
        <Drawer
          title={props.type === "quote" ? "Request a quote" : "Request availability"}
          onClose={close}
        >
          {(animatedClose) => (
            <RequestForm key={formKey} {...props} onDone={animatedClose} />
          )}
        </Drawer>
      )}
    </>
  );
}

function RequestForm({
  type,
  itemIds,
  summary,
  defaults,
  maxQuantity,
  onDone,
}: RequestButtonProps & { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState<RequestState, FormData>(sendRequest, null);
  const today = businessToday();
  const v = { ...defaults, ...state?.values } as Record<string, string | undefined>;

  if (state?.success) {
    return (
      <div className="space-y-4">
        <Check className="h-8 w-8 text-accent" aria-hidden />
        <h2 className="text-xl font-semibold tracking-tight">Request sent</h2>
        <p className="text-sm text-neutral-600">
          Thanks. HV Prop Shop will follow up at{" "}
          <span className="font-medium text-neutral-900">{state.email}</span>.
        </p>
        <button onClick={onDone} className="btn-secondary">
          Done
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="item_ids" value={itemIds.join(",")} />
      {/* Honeypot — hidden from people, tempting to bots */}
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="rounded-md border border-neutral-200 p-3 text-sm">{summary}</div>

      <p className="text-sm text-neutral-600">
        {type === "quote"
          ? "Paying by PO or need to send a COI? Tell us what you need and we'll put together a quote."
          : "We'll check availability with each vendor and get back to you."}
      </p>

      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rq-name" className="label">Name</label>
          <input id="rq-name" name="name" required autoComplete="name" defaultValue={v.name} className="input" />
        </div>
        <div>
          <label htmlFor="rq-phone" className="label">
            Phone <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input id="rq-phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="rq-email" className="label">Email</label>
        <input id="rq-email" name="email" type="email" required autoComplete="email" defaultValue={v.email} className="input" />
      </div>

      <div>
        <label htmlFor="rq-production" className="label">
          Production or company <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input id="rq-production" name="production" defaultValue={v.production} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="rq-start" className="label">Pickup</label>
          <input id="rq-start" name="start_date" type="date" min={today} defaultValue={v.start_date} className="input" />
        </div>
        <div>
          <label htmlFor="rq-end" className="label">Return</label>
          <input id="rq-end" name="end_date" type="date" min={today} defaultValue={v.end_date} className="input" />
        </div>
      </div>

      {type === "quote" && (
        <div>
          <label htmlFor="rq-qty" className="label">Quantity</label>
          <input
            id="rq-qty"
            name="quantity"
            type="number"
            min={1}
            max={maxQuantity && maxQuantity > 0 ? maxQuantity : undefined}
            defaultValue={v.quantity || "1"}
            className="input w-28!"
          />
        </div>
      )}

      <div>
        <label htmlFor="rq-message" className="label">
          Notes <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="rq-message"
          name="message"
          rows={4}
          defaultValue={v.message}
          placeholder={
            type === "quote"
              ? "Billing details, insurance requirements, delivery needs…"
              : "Delivery or pickup needs, substitutions you'd accept…"
          }
          className="input resize-none"
        />
      </div>

      <button type="submit" disabled={isPending} className="btn-accent h-11! w-full">
        {isPending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
