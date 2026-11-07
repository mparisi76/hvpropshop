"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { handleResetPassword } from "./action";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/ui/PasswordInput";

function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  async function clientAction(formData: FormData) {
    setError(null);
    const result = await handleResetPassword(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          This reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="btn-secondary w-full">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={clientAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="password" className="label">
          New password
        </label>
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="new-password"
        />
      </div>
      <button className="btn-primary w-full">Update password</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <Link href="/login" className="link">
          Back to login
        </Link>
      }
    >
      <Suspense fallback={<div className="h-28 animate-pulse rounded-md bg-neutral-100" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
