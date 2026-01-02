'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatCategory } from '@/lib/utils'; // Import it here instead

interface CategoryBarProps {
  categories: string[];
}

export default function CategoryBar({ categories }: CategoryBarProps) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  return (
    <nav className="sticky top-16 z-40 w-full border-b border-slate-50 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-6 overflow-x-auto no-scrollbar">
        <Link 
          href="/"
          className={`text-[12px] font-black uppercase tracking-[0.15em] whitespace-nowrap pb-1 border-b-2 transition-all duration-200 ${
            !activeCategory ? 'border-blue-600 text-black' : 'border-transparent text-gray-400 hover:text-slate-600'
          }`}
        >
          All Props
        </Link>

				{categories.map((cat) => (
					<Link 
						key={cat}
						// encodeURIComponent turns & into %26 so the URL doesn't break
						href={`/?category=${encodeURIComponent(cat)}`}
						className={`text-[12px] font-black uppercase tracking-[0.15em] whitespace-nowrap pb-1 border-b-2 transition-all duration-200 ${
							activeCategory === cat ? 'border-blue-600 text-black' : 'border-transparent text-slate-400 hover:text-slate-600'
						}`}
					>
						{formatCategory(cat)}
					</Link>
				))}
      </div>
    </nav>
  );
}