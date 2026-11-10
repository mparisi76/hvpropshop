"use client";

import { Suspense, startTransition, useActionState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/ui/PasswordInput";
import { acceptInvite, type AcceptState } from "./action";

function AcceptForm() {
  const token = useSearchParams().get("token") ?? "";
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptInvite, null);

  // Full page load into the dashboard, so it's rendered fresh as the new account
  useEffect(() => {
    if (state?.redirectTo) window.location.assign(state.redirectTo);
  }, [state?.redirectTo]);

  if (!token) {
    return (
      <p className="text-sm text-neutral-600">
        This link is missing its code. Open the link from your invite email, or{" "}
        <Link href="/contact" className="link">contact us</Link> for a new one.
      </p>
    );
  }

  return (
    <form
      // Submit manually so a mistake (e.g. passwords don't match) doesn't clear what was typed
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
      className="space-y-4"
    >
      <input type="hidden" name="token" value={token} />
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="password" className="label">Choose a password</label>
        <PasswordInput id="password" name="password" required minLength={8} autoComplete="new-password" />
        <p className="mt-1.5 text-xs text-neutral-500">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm password</label>
        <PasswordInput id="confirm" name="confirm" required minLength={8} autoComplete="new-password" />
      </div>
      <button type="submit" disabled={pending || Boolean(state?.redirectTo)} className="btn-primary w-full">
        {pending || state?.redirectTo ? "Setting up…" : "Create my account"}
      </button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <AuthCard
      title="Welcome to HV Prop Shop"
      description="You've been approved as a vendor. Choose a password to finish setting up your account."
    >
      <Suspense fallback={<div className="h-40 animate-pulse rounded-md bg-neutral-100" />}>
        <AcceptForm />
      </Suspense>
    </AuthCard>
  );
}
