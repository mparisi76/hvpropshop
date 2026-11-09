"use client";

import { useState, useTransition } from "react";
import { setFeatured } from "../actions";

export default function FeaturedToggle({ userId, featured }: { userId: string; featured: boolean }) {
  const [on, setOn] = useState(featured);
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Featured vendor"
      disabled={pending}
      onClick={() => {
        const next = !on;
        setOn(next);
        start(async () => {
          const result = await setFeatured(userId, next);
          if (result.error) setOn(!next);
        });
      }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-accent" : "bg-neutral-300"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}
