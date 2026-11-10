"use client";

import { useActionState, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Prop } from "@/types";
import Select from "@/components/ui/Select";
import TrackEvent from "@/components/TrackEvent";
import { requestBooking, type BookingRequestState } from "@/app/actions/requestBooking";
import { businessToday } from "@/lib/site";
import { CANCELLATION_POLICY } from "@/lib/policy";

interface InquiryFormProps {
  item: Prop;
  onClose: () => void;
}

/** Days between two YYYY-MM-DD dates, counting both ends. */
function rentalDays(start: string, end: string) {
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export default function InquiryForm({ item, onClose }: InquiryFormProps) {
  const today = businessToday();
  const [state, formAction, isPending] = useActionState<BookingRequestState, FormData>(requestBooking, null);

  const v = state?.values ?? {};
  const [dates, setDates] = useState({ start: v.start ?? "", end: v.end ?? "" });
  const [quantity, setQuantity] = useState(Number(v.quantity) || 1);

  const dailyPrice = Number(item.price) || 0;
  const maxUnits = Math.max(1, Number(item.quantity_available) || 1);
  const vendor = item.user_created?.shop_name || item.user_created?.first_name || "the vendor";

  const estimate = useMemo(() => {
    if (!dates.start || !dates.end || dates.end < dates.start) return null;
    const days = rentalDays(dates.start, dates.end);
    return { days, total: days * dailyPrice * quantity };
  }, [dates, quantity, dailyPrice]);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <TrackEvent name="Booking request sent" props={{ item: String(item.id) }} />
        <Check className="h-8 w-8 text-accent" aria-hidden />
        <h2 className="text-xl font-semibold tracking-tight">Request sent</h2>
        <p className="text-sm text-neutral-600">
          {vendor} will confirm availability, usually within a day. We&apos;ll email{" "}
          <span className="font-medium text-neutral-900">{state.email}</span> a link to pay once
          they do. You won&apos;t be charged until then.
        </p>
        <button onClick={onClose} className="btn-secondary">
          Done
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="prop_id" value={String(item.id)} />
      <input
        type="text"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="rounded-md border border-neutral-200 p-3">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-neutral-500">
          {vendor}
          {dailyPrice > 0 && <> · ${dailyPrice.toLocaleString()}/day</>}
        </p>
      </div>

      <p className="text-sm text-neutral-600">
        Send a request and {vendor} will confirm it&apos;s available. You only pay once
        they accept.
      </p>

      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="inq-start" className="label">Pickup</label>
          <input
            id="inq-start"
            name="start"
            required
            type="date"
            min={today}
            value={dates.start}
            onClick={(e) => e.currentTarget.showPicker?.()}
            onChange={(e) => setDates({ ...dates, start: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="inq-end" className="label">Return</label>
          <input
            id="inq-end"
            name="end"
            required
            type="date"
            min={dates.start || today}
            value={dates.end}
            onClick={(e) => e.currentTarget.showPicker?.()}
            onChange={(e) => setDates({ ...dates, end: e.target.value })}
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="inq-qty" className="label">Quantity</label>
        <Select
          id="inq-qty"
          name="quantity"
          value={String(quantity)}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        >
          {Array.from({ length: maxUnits }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </Select>
      </div>

      {estimate && dailyPrice > 0 && (
        <dl className="space-y-1.5 rounded-md bg-neutral-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">
              ${dailyPrice.toLocaleString()} × {estimate.days} {estimate.days === 1 ? "day" : "days"}
              {quantity > 1 && <> × {quantity}</>}
            </dt>
            <dd className="tabular-nums">${estimate.total.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1.5 font-semibold">
            <dt>Estimated total</dt>
            <dd className="tabular-nums">${estimate.total.toLocaleString()}</dd>
          </div>
        </dl>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-name" className="label">Name</label>
          <input id="inq-name" name="name" required autoComplete="name" defaultValue={v.name} className="input" />
        </div>
        <div>
          <label htmlFor="inq-phone" className="label">
            Phone <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input id="inq-phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="inq-email" className="label">Email</label>
        <input id="inq-email" name="email" required type="email" autoComplete="email" defaultValue={v.email} className="input" />
      </div>

      <div>
        <label htmlFor="inq-production" className="label">
          Production or company <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input id="inq-production" name="production" defaultValue={v.production} className="input" />
      </div>

      <div>
        <label htmlFor="inq-notes" className="label">
          Notes <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <textarea
          id="inq-notes"
          name="message"
          rows={3}
          defaultValue={v.message}
          className="input resize-none"
          placeholder="Pickup or delivery needs, questions for the vendor…"
        />
      </div>

      <div className="space-y-2">
        <button disabled={isPending} className="btn-accent h-11! w-full">
          {isPending ? "Sending…" : "Send request"}
        </button>
        <p className="text-xs text-neutral-500">
          <span className="font-medium text-neutral-700">Cancellation policy:</span> {CANCELLATION_POLICY}{" "}
          By sending a request you agree to our{" "}
          <a href="/policies" target="_blank" className="underline underline-offset-2 hover:text-neutral-900">
            rental policies
          </a>{" "}
          and{" "}
          <a href="/terms" target="_blank" className="underline underline-offset-2 hover:text-neutral-900">
            terms
          </a>
          .
        </p>
      </div>
    </form>
  );
}
