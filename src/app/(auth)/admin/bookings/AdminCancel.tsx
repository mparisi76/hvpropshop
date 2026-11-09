"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { adminCancelBooking } from "../actions";

export default function AdminCancel({ id, paid, totalLabel }: { id: string; paid: boolean; totalLabel: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ error?: string; message?: string } | null>(null);
  const [pending, start] = useTransition();

  if (msg?.message) return <p className="text-xs text-accent">{msg.message}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-ghost h-8! px-2.5! text-neutral-500">
        Cancel
      </button>
    );
  }
  return (
    <div className="w-64 space-y-2 text-left">
      <p className="text-xs text-neutral-700">
        {paid ? `Full refund of ${totalLabel}. Both sides are emailed.` : "Releases the request. Both sides are emailed."}
      </p>
      <textarea
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (sent to both)"
        className="input resize-none text-xs!"
      />
      {msg?.error && <p className="text-xs text-red-700">{msg.error}</p>}
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setMsg(await adminCancelBooking(id, reason)))}
          className="btn h-8! bg-red-600 px-2.5! text-xs! text-white hover:bg-red-700"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {paid ? "Cancel & refund" : "Cancel"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost h-8! px-2.5! text-xs!">
          Keep
        </button>
      </div>
    </div>
  );
}
