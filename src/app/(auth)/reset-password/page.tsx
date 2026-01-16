"use client";

import { useState } from "react"; // Add this
import { useSearchParams } from "next/navigation";
import { handleResetPassword } from "./action";
import Logo from "@/components/Logo";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null); // State for the error
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // This wrapper satisfies the TypeScript requirement
  async function clientAction(formData: FormData) {
    setError(null); // Clear previous errors
    const result = await handleResetPassword(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    // ... inside your component
    <form action={clientAction} className="space-y-6">
      <input type="hidden" name="token" value={token || ""} />

      {/* Show the error message if it exists */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100">
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
          autoComplete="new-password"
          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
        />
      </div>

      <button className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all shadow-lg active:scale-95">
        Reset Password
      </button>
    </form>
  );
}
