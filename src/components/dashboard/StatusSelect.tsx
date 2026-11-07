"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import Select from "@/components/ui/Select";
import type { FieldChoice } from "@/lib/fields";
import { setListingStatus } from "@/app/(auth)/dashboard/listingActions";

const dotColor = (status: string) =>
  status === "published" ? "bg-accent" : status === "draft" ? "bg-amber-500" : "bg-neutral-400";

export default function StatusSelect({
  id,
  status,
  choices,
  label,
}: {
  id: string;
  status: string;
  choices: FieldChoice[];
  /** Accessible label, e.g. the listing name */
  label: string;
}) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keep an unknown current value selectable
  const options = choices.some((c) => c.value === value)
    ? choices
    : [{ value, text: value }, ...choices];

  const onChange = (next: string) => {
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await setListingStatus(id, next);
      if (result.error) {
        setValue(previous);
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-w-36">
      <div className="flex items-center gap-2">
        {isPending ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-neutral-400" aria-hidden />
        ) : (
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor(value)}`} aria-hidden />
        )}
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isPending}
          aria-label={`Status for ${label}`}
          className="h-8! py-1! text-xs!"
        >
          {options.map((c) => (
            <option key={c.value} value={c.value}>
              {c.text}
            </option>
          ))}
        </Select>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
