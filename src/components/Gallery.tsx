/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';

const PLACEHOLDER_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHBhdGggZD0iTTQwMCAyODB2NDBtLTIwLTIwaDQwIiBzdHJva2U9IiNlMmU4ZjAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+";

export default function Gallery({ images }: { images: string[] }) {
  const validImages = (images || []).filter(Boolean);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mainHasError, setMainHasError] = useState(false);

  const active = selectedId || validImages[0];

  if (validImages.length === 0) return null;

  // We pre-construct the URL to keep the JSX clean
  const mainImageUrl = mainHasError 
    ? PLACEHOLDER_IMAGE 
    : `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${active}?quality=80&format=webp`;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Feature Stage */}
      <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-[#f8f9fa] border border-slate-200 flex items-center justify-center">
        
        {/* Spinner logic stays the same */}
        {!isLoaded && !mainHasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Using a native <img> here. 
          This prevents Next.js from generating a srcset that causes double-fetching.
        */}
        <img 
          src={mainImageUrl} 
          alt='Prop Gallery'
          onLoad={() => setIsLoaded(true)}
          onError={() => setMainHasError(true)}
          className={`
            w-full h-full object-contain p-8 transition-all duration-500 ease-out
            ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
        />
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
          {validImages.map((id) => (
            <button 
              key={id}
              onClick={() => {
                if (active !== id) {
                  setIsLoaded(false); 
                  setMainHasError(false);
                  setSelectedId(id);
                }
              }}
              className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                active === id 
                  ? 'ring-2 ring-blue-600 ring-offset-2 scale-90' 
                  : 'opacity-50 hover:opacity-100 border border-slate-200'
              }`}
            >
              <img
                src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${id}?width=160&height=160&fit=cover&format=webp`}
                className="w-full h-full object-cover"
                alt="Thumbnail"
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