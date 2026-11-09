"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { approveApplication, declineApplication } from "../actions";

export default function ApplicationActions({ id, name }: { id: string; name: string }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<{ error?: string; message?: string } | null>(null);
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [pending, start] = useTransition();

  const run = (which: "approve" | "decline", fn: () => Promise<{ error?: string; message?: string }>) => {
    setBusy(which);
    start(async () => {
      setResult(await fn());
      setBusy(null);
    });
  };

  if (result?.message) {
    return (
      <p className="flex items-center gap-1 text-sm text-accent">
        <Check className="h-4 w-4" /> {result.message}
      </p>
    );
  }

  if (declining) {
    return (
      <div className="space-y-2">
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={`Optional note to ${name.split(" ")[0]}`}
          className="input resize-none"
        />
        {result?.error && <p className="text-sm text-red-700">{result.error}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={pending} onClick={() => run("decline", () => declineApplication(id, reason))} className="btn-primary h-9!">
            {busy === "decline" && <Loader2 className="h-4 w-4 animate-spin" />} Decline and email
          </button>
          <button type="button" onClick={() => setDeclining(false)} className="btn-ghost h-9!">Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => run("approve", () => approveApplication(id))} className="btn-accent h-9!">
          {busy === "approve" && <Loader2 className="h-4 w-4 animate-spin" />} Approve and invite
        </button>
        <button type="button" disabled={pending} onClick={() => setDeclining(true)} className="btn-secondary h-9!">
          Decline
        </button>
      </div>
      {result?.error && <p className="text-sm text-red-700">{result.error}</p>}
    </div>
  );
}
