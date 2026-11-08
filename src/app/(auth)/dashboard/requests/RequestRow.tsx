/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Mail, Phone } from "lucide-react";
import { acceptRequest, cancelAsVendor, declineRequest } from "./actions";

export interface RequestRowData {
  id: string;
  status: string;
  itemName: string;
  thumbnail: string | null;
  customerName: string;
  production: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  declineReason: string | null;
  startLabel: string;
  endLabel: string;
  quantity: number;
  totalLabel: string;
  canCancel: boolean;
}

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Needs response", className: "bg-amber-50 text-amber-800" },
  accepted: { label: "Awaiting payment", className: "bg-blue-50 text-blue-800" },
  paid: { label: "Paid", className: "bg-accent-soft text-accent" },
  declined: { label: "Declined", className: "bg-neutral-100 text-neutral-600" },
  cancelled: { label: "Cancelled", className: "bg-neutral-100 text-neutral-600" },
};

export default function RequestRow({ r }: { r: RequestRowData }) {
  const [mode, setMode] = useState<"idle" | "declining" | "cancelling">("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"accept" | "decline" | "cancel" | null>(null);

  const run = (which: "accept" | "decline" | "cancel", fn: () => Promise<{ error?: string }>) => {
    setBusy(which);
    start(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
      else setMode("idle");
      setBusy(null);
    });
  };

  const status = STATUS[r.status] ?? { label: r.status, className: "bg-neutral-100 text-neutral-600" };
  const isPending = r.status === "pending";
  const isPaid = r.status === "paid";

  return (
    <>
      <tr className="align-top hover:bg-neutral-50">
        {/* Item */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
              {r.thumbnail && (
                <img
                  src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${r.thumbnail}?width=96&height=96&fit=cover&format=webp`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <Link href={`/dashboard/requests/${r.id}`} className="font-medium text-neutral-900 hover:underline">
                {r.itemName}
              </Link>
              {/* Dates under the name on small screens */}
              <p className="text-xs text-neutral-500 sm:hidden">
                {r.startLabel} – {r.endLabel} · {r.totalLabel}
              </p>
              {!isPending && (
                <span className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${status.className}`}>
                  {status.label}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Customer */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900">{r.customerName}</span>
            {r.email && (
              <a
                href={`mailto:${r.email}`}
                title={r.email}
                aria-label={`Email ${r.customerName}`}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <Mail className="h-3.5 w-3.5" />
              </a>
            )}
            {r.phone && (
              <a
                href={`tel:${r.phone}`}
                title={r.phone}
                aria-label={`Call ${r.customerName}`}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {r.production && <p className="text-xs text-neutral-500">{r.production}</p>}
          {r.message && (
            <p className="mt-1 line-clamp-2 max-w-xs text-xs text-neutral-600" title={r.message}>
              &ldquo;{r.message}&rdquo;
            </p>
          )}
          {r.status === "declined" && r.declineReason && (
            <p className="mt-1 text-xs text-neutral-500">Your note: {r.declineReason}</p>
          )}
        </td>

        {/* Dates */}
        <td className="hidden whitespace-nowrap px-4 py-3 text-neutral-700 sm:table-cell">
          {r.startLabel} – {r.endLabel}
          <span className="block text-xs text-neutral-400">
            {r.quantity} {r.quantity === 1 ? "unit" : "units"}
          </span>
        </td>

        {/* Total */}
        <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">{r.totalLabel}</td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-1.5">
            {isPending ? (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run("accept", () => acceptRequest(r.id))}
                  className="btn-accent h-8! px-3!"
                >
                  {busy === "accept" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Accept
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setMode(mode === "declining" ? "idle" : "declining")}
                  className="btn-secondary h-8! px-3!"
                >
                  Decline
                </button>
              </>
            ) : r.canCancel ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => setMode(mode === "cancelling" ? "idle" : "cancelling")}
                className="btn-ghost h-8! px-2.5! text-neutral-500"
              >
                Cancel
              </button>
            ) : null}
          </div>
          {error && mode === "idle" && <p className="mt-1 text-right text-xs text-red-700">{error}</p>}
        </td>
      </tr>

      {/* Inline confirmation for Decline / Cancel */}
      {mode !== "idle" && (
        <tr className="bg-neutral-50">
          <td colSpan={5} className="px-4 pb-4 pt-1">
            <div
              className={`space-y-2 rounded-md border p-3 ${
                mode === "cancelling" ? "border-red-200 bg-red-50/50" : "border-neutral-200 bg-white"
              }`}
            >
              {mode === "cancelling" && (
                <p className="text-sm text-neutral-800">
                  {isPaid
                    ? `The customer will be refunded ${r.totalLabel} in full and the dates freed up.`
                    : "The customer hasn't paid yet. Cancelling releases the hold."}
                </p>
              )}
              <label htmlFor={`reason-${r.id}`} className="label">
                {mode === "declining" ? "Reason for declining" : "Reason for cancelling"}{" "}
                <span className="font-normal text-neutral-500">(optional, sent to the customer)</span>
              </label>
              <textarea
                id={`reason-${r.id}`}
                rows={2}
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={mode === "declining" ? "e.g. Already out on another job those dates" : ""}
                className="input resize-none"
              />
              {error && <p className="text-sm text-red-700">{error}</p>}
              <div className="flex gap-2">
                {mode === "declining" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run("decline", () => declineRequest(r.id, reason))}
                    className="btn-primary h-9!"
                  >
                    {busy === "decline" && <Loader2 className="h-4 w-4 animate-spin" />} Decline request
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run("cancel", () => cancelAsVendor(r.id, reason))}
                    className="btn h-9! bg-red-600 text-white hover:bg-red-700"
                  >
                    {busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPaid ? "Cancel and refund" : "Cancel booking"}
                  </button>
                )}
                <button type="button" disabled={pending} onClick={() => setMode("idle")} className="btn-ghost h-9!">
                  {mode === "declining" ? "Never mind" : "Keep booking"}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
