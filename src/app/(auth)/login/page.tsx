"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type ActionState } from "./action";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/ui/PasswordInput";

/** Carries ?next= (where to go after login) into the form. */
function NextField() {
  const next = useSearchParams().get("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    loginAction,
    null
  );

  return (
    <AuthCard
      title="Vendor login"
      description="Manage your listings and rentals."
      footer={
        <>
          Want to list your inventory?{" "}
          <Link href="/sell" className="link">
            Apply to list
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <Suspense fallback={null}>
          <NextField />
        </Suspense>
        {state?.error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="input"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="label mb-0!">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-neutral-600 hover:text-neutral-900">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-neutral-600 hover:text-neutral-900">
          ← Back to inventory
        </Link>
      </p>
    </AuthCard>
  );
}
