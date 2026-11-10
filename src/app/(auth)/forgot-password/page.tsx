"use client";

import { useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import { handleForgotPassword } from "./action";

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function clientAction(formData: FormData) {
    setIsPending(true);
    try {
      await handleForgotPassword(formData);
      setIsSent(true);
    } finally {
      setIsPending(false);
    }
  }

  const backLink = (
    <Link href="/login" className="link">
      Back to login
    </Link>
  );

  if (isSent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account exists for that address, we've sent a link to reset your password."
      >
        <Link href="/login" className="btn-secondary w-full">
          Return to login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={backLink}
    >
      <form action={clientAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
          />
        </div>
        <button type="submit" disabled={isPending} className="btn-primary w-full">
          {isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
