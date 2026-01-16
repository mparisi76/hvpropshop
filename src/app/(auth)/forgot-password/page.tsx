"use client"; // Add this at the top

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { handleForgotPassword } from "./action"; // Import the action

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);

  async function clientAction(formData: FormData) {
    await handleForgotPassword(formData);
    setIsSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="dark" />
        </div>

        <div className="bg-white py-10 px-8 shadow-xl shadow-black/5 rounded-[2.5rem] border border-slate-100">
          {!isSent ? (
            <>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                Reset Password
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Enter your email and we&apos;ll send you a secure link.
              </p>

              {/* ADD THE ACTION HERE */}
              <form action={clientAction} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-4">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="studio@example.com"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-900 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-black/10"
                >
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📩</div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                Check your email
              </h2>
              <p className="text-slate-500 text-sm font-medium mb-8">
                If an account exists for that email, we&apos;ve sent reset
                instructions.
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
