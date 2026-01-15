"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "./actions";
// import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    loginAction,
    null
  );

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* LEFT SIDE: Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 p-16 flex-col relative overflow-hidden min-h-screen">
        {/* TOP: Logo */}
        <div className="relative z-10 flex-none">
          <Logo variant="light" />
        </div>

        {/* MIDDLE: Big Heading (using grow to push content down) */}
        <div className="relative z-10 grow flex flex-col justify-center py-20">
          <h2 className="text-6xl font-black text-white leading-[0.9] uppercase tracking-tighter mb-8 max-w-sm">
            The Industry <br />
            Standard for <br />
            Local Props.
          </h2>
          <div className="w-20 h-1.5 bg-blue-600 mb-8" />
          <p className="text-slate-400 max-w-sm text-lg font-medium leading-relaxed">
            Manage your inventory, track rentals, and connect with production
            designers across the Hudson Valley.
          </p>
        </div>

        {/* BOTTOM: Support / Info */}
        <div className="relative z-10 flex-none pt-8 border-t border-white/10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Official Vendor Portal &copy; 2026
          </p>
        </div>

        {/* Decorative background element */}
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      {/* RIGHT SIDE: The Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24">
        <div className="max-w-md w-full">
          <div className="mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Vendor Login
            </h1>
            <p className="text-slate-500 mt-2">
              Enter your credentials to access your shop.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">
                  {state.error}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="name@studio.com"
                autoComplete="username"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Password
                </label>
                <a
                  href="#"
                  className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                >
                  Forgot?
                </a>
              </div>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-slate-900 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-4 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-xl shadow-black/10"
            >
              {isPending ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          {/* <p className="mt-8 text-center text-sm text-slate-400">
            Interested in becoming a vendor?{" "}
            <Link href="/apply" className="font-bold text-slate-900 hover:underline">
              Apply Now
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
}
