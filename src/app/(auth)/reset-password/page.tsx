"use client";

import { Suspense, useState } from "react"; // 1. Import Suspense
import { useSearchParams } from "next/navigation";
import { handleResetPassword } from "./action";
import Logo from "@/components/Logo";

// 2. Move the form logic into a separate component
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
      <p className="text-center text-red-500 font-bold">
        Invalid or missing token.
      </p>
    );
  }

  return (
    <form action={clientAction} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
          {error}
        </div>
      )}
      <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-4">
          New Password
        </label>
        <input
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium text-slate-900"
        />
      </div>
      <button className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all shadow-lg active:scale-95">
        Update Password
      </button>
    </form>
  );
}

// 3. The main page component provides the Suspense boundary
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="dark" />
        </div>

        <div className="bg-white py-10 px-8 shadow-xl rounded-[2.5rem] border border-slate-100">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-2">
            New Password
          </h2>
          <p className="text-slate-500 text-sm font-medium mb-8">
            Please enter your new secure password below.
          </p>

          <Suspense
            fallback={<p className="text-center text-slate-400">Loading...</p>}
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
