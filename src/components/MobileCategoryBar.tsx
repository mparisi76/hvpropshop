'use client';

import Link from 'next/link';
import { CategoryTree } from '@/types';

interface MobileCategoryBarProps {
  tree: CategoryTree;
  selectedSlug?: string;
}

export default function MobileCategoryBar({ tree, selectedSlug }: MobileCategoryBarProps) {
  const sortedParents = Object.values(tree).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="lg:hidden sticky top-16 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 -mx-4 px-4">
      <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
        {/* "All" Pill */}
        <Link
          href="/"
          className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-200 ${
            !selectedSlug 
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
          }`}
        >
          All
        </Link>

        {/* Parent Pills */}
        {sortedParents.map((parent) => {
          const isActive = selectedSlug === parent.slug || 
                           Object.values(parent.children).some(c => c.slug === selectedSlug);

          return (
            <Link
              key={parent.slug}
              href={`/?category=${parent.slug}`}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {parent.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}