'use client';
import Image from 'next/image';
import { useState } from 'react';

export default function Gallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(images[0]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Feature Image */}
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-gray-100 border border-gray-300">
        <Image 
          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${active}`} 
          className="w-full h-full object-contain transition-all duration-300"
					alt=''
					fill
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((id) => (
          <button 
            key={id}
            onClick={() => setActive(id)}
            className={`relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition ${
              active === id ? 'border-blue-600 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image
							src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${id}?width=200`}
							className="object-cover w-full h-full"
							fill
							alt=""
						/>
          </button>
        ))}
      </div>
    </div>
  );
}