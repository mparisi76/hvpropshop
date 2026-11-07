"use client";

import { Bookmark } from "lucide-react";
import { pullList, usePullList } from "@/lib/pullList";

export default function PullListButton({
  id,
  variant = "full",
}: {
  id: string | number;
  /** full: labeled button · icon: overlay on a card photo · square: icon-only bordered button */
  variant?: "full" | "icon" | "square";
}) {
  const { ids } = usePullList();
  const key = String(id);
  const saved = ids.includes(key);
  const label = saved ? "Remove from pull list" : "Add to pull list";

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pullList.toggle(key);
  };

  const icon = (
    <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} aria-hidden />
  );

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={saved}
        title={label}
        className={`grid h-8 w-8 place-items-center rounded-md border shadow-sm transition-colors ${
          saved
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-200 bg-white/95 text-neutral-700 hover:text-neutral-900"
        }`}
      >
        {icon}
      </button>
    );
  }

  if (variant === "square") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={saved}
        title={label}
        className={`btn-secondary w-10! px-0! ${saved ? "text-neutral-900" : "text-neutral-600"}`}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className="btn-secondary w-full"
    >
      {icon}
      {saved ? "On your pull list" : "Add to pull list"}
    </button>
  );
}
