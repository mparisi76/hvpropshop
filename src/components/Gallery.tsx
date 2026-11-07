/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHBhdGggZD0iTTQwMCAyODB2NDBtLTIwLTIwaDQwIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

const assetUrl = (id: string, query: string) =>
  `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${id}?${query}`;

export default function Gallery({
  images,
  alt = "Prop photo",
}: {
  images: string[];
  alt?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mainHasError, setMainHasError] = useState(false);
  const mainImageRef = useRef<HTMLImageElement>(null);

  const validImages = (images || []).filter(Boolean);
  const active = selectedId || validImages[0];

  // If the image is already cached, onLoad may not fire — mark it loaded.
  useEffect(() => {
    if (mainImageRef.current?.complete) {
      requestAnimationFrame(() => setIsLoaded(true));
    }
  }, [active]);

  if (validImages.length === 0) return null;

  const mainImageUrl = mainHasError
    ? PLACEHOLDER_IMAGE
    : assetUrl(active, "quality=80&format=webp");

  return (
    <div className="space-y-3">
      <div className="relative aspect-4/3 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
        {!isLoaded && !mainHasError && (
          <div className="absolute inset-0 animate-pulse bg-neutral-100" />
        )}
        <img
          ref={mainImageRef}
          src={mainImageUrl}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setMainHasError(true)}
          className={`h-full w-full object-contain transition-opacity duration-200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {validImages.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-0.5 text-xs tabular-nums text-neutral-700">
            {validImages.indexOf(active) + 1} / {validImages.length}
          </span>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {validImages.map((id, i) => (
            <button
              key={id}
              onClick={() => {
                if (active !== id) {
                  setIsLoaded(false);
                  setMainHasError(false);
                  setSelectedId(id);
                }
              }}
              aria-label={`Show photo ${i + 1}`}
              aria-current={active === id}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                active === id
                  ? "border-neutral-900"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={assetUrl(id, "width=160&height=160&fit=cover&format=webp")}
                className="h-full w-full object-cover"
                alt=""
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                  e.currentTarget.onerror = null;
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
