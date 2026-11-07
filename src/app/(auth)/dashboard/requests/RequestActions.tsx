"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { acceptRequest, declineRequest } from "./actions";

export default function RequestActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
    });

  if (declining) {
    return (
      <div className="space-y-2">
        <label htmlFor={`reason-${id}`} className="label">
          Reason <span className="font-normal text-neutral-500">(optional, sent to the customer)</span>
        </label>
        <textarea
          id={`reason-${id}`}
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Already out on another job those dates"
          className="input resize-none"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => declineRequest(id, reason))}
            className="btn-primary"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} Decline request
          </button>
          <button type="button" disabled={pending} onClick={() => setDeclining(false)} className="btn-ghost">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => acceptRequest(id))} className="btn-accent">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Accept
        </button>
        <button type="button" disabled={pending} onClick={() => setDeclining(true)} className="btn-secondary">
          Decline
        </button>
      </div>
    </div>
  );
}
