"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteVendor } from "../../../actions";

export default function DeleteVendorForm({ vendorId, name }: { vendorId: string; name: string }) {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const matches = typed.trim().toLowerCase() === name.trim().toLowerCase();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const result = await deleteVendor(vendorId, typed);
          if (result.error) {
            setError(result.error);
            return;
          }
          const q = new URLSearchParams({ deleted: name });
          if (result.warnings?.length) q.set("warnings", result.warnings.join("\n"));
          router.push(`/admin/vendors?${q.toString()}`);
        });
      }}
      className="space-y-3 rounded-md border border-red-200 bg-red-50/50 p-4"
    >
      <label htmlFor="confirm-name" className="label">
        Type <span className="font-semibold">{name}</span> to confirm
      </label>
      <input
        id="confirm-name"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        className="input"
      />
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={!matches || pending}
        className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {pending ? "Deleting…" : "Delete permanently"}
      </button>
    </form>
  );
}
