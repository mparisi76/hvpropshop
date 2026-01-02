import { formatCategory } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image'; // Import this

interface Prop {
  id: string | number;
  status?: string;
  title?: string;
  name?: string;
  thumbnail?: string;
  category: string;
  price: string | number;
}

export default function PropCard({ item }: { item: Prop }) {
  const isRented = item.status === 'rented';
  const displayTitle = item.title || item.name || 'Untitled Prop';

  return (
    <Link href={`/props/${item.id}`} className="group relative block overflow-hidden rounded-2xl bg-slate-200 aspect-square antialiased">
      {/* 1. Optimized Next.js Image */}
      {item.thumbnail ? (
        <Image 
          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${item.thumbnail}?width=600&height=600&fit=cover`} 
          alt={displayTitle}
          fill // This tells it to fill the 'aspect-square' container
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover group-hover:scale-110 transition duration-700 ease-in-out"
        />
      ) : (
        <div className="absolute inset-0 bg-slate-300 flex items-center justify-center text-slate-500 text-xs">No Image</div>
      )}
      
      {/* 2. The Scrim (Overlay) */}
      {/* Note: Added z-index classes to ensure text stays on top of the 'fill' image */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity z-10" />
      
      {/* 3. CATEGORY PILL */}
      <div className="absolute top-3 right-3 z-20">
        <span className="inline-block px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-gray-100 border border-white/10 shadow-lg">
          {formatCategory(item.category)}
        </span>
      </div>

      {/* 4. TITLE & PRICE */}
      <div className="absolute bottom-0 left-0 p-4 w-full translate-y-1 group-hover:translate-y-0 transition-transform duration-300 z-20">
        <h3 className="text-white font-bold text-sm leading-tight drop-shadow-md truncate mb-0.5">
          {displayTitle}
        </h3>
        <p className="text-white/80 text-[10px] font-bold tracking-tight">
          ${item.price}<span className="text-white/70 font-normal"> / day</span>
        </p>
      </div>

      {/* 5. Status Overlay */}
      {isRented && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-30">
          <span className="bg-white text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-2xl">
            On Set
          </span>
        </div>
      )}
    </Link>
  );
}