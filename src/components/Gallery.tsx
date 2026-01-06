'use client';
import Image from 'next/image';
import { useState } from 'react';

export default function Gallery({ images }: { images: string[] }) {
  // Initialize with the first image
  const [active, setActive] = useState(images[0]);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!images || images.length === 0) return null;

  const handleThumbnailClick = (id: string) => {
    if (active !== id) {
      setIsLoaded(false); // Reset the loading state for the NEW image
      setActive(id);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Feature Stage */}
      <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-[#f8f9fa] border border-slate-200 flex items-center justify-center">
        
        {/* Loading Spinner */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </div>
        )}

        <Image 
          key={active} // This key is crucial: it forces the image to "unmount" and "remount"
          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${active}?quality=80`} 
          alt='Prop Gallery Image'
          fill
          priority
          onLoad={() => setIsLoaded(true)}
          className={`
            w-full h-full object-contain p-8 transition-all duration-700 ease-out
            ${isLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
          `}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar">
          {images.map((id) => (
            <button 
              key={id}
              onClick={() => handleThumbnailClick(id)}
              className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                active === id 
                  ? 'ring-2 ring-blue-600 ring-offset-2 scale-90' 
                  : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0 border border-slate-200'
              }`}
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${id}?width=160&height=160&fit=cover`}
                className="object-cover"
                fill
                alt="Thumbnail"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}