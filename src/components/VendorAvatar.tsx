/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

/** Shop logo, or the shop's initials if there's no logo (or it fails to load). */
export default function VendorAvatar({
  name,
  logo,
  size = "md",
}: {
  name: string;
  /** Directus file id of the shop logo */
  logo?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dims = size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-10 w-10 text-sm";
  const px = size === "lg" ? 128 : size === "sm" ? 56 : 80;

  if (logo && !failed) {
    return (
      <div className={`${dims} shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white`}>
        <img
          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${logo}?width=${px}&height=${px}&fit=inside&format=webp`}
          alt=""
          onError={(e) => {
            console.warn(
              `[VendorAvatar] Couldn't load shop logo — check that Directus files are publicly readable: ${e.currentTarget.src}`
            );
            setFailed(true);
          }}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div
      className={`${dims} grid shrink-0 place-items-center rounded-md bg-neutral-900 font-semibold text-white`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
