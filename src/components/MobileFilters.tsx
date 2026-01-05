'use client';

import { useState } from 'react';
import CategorySidebar from './CategorySidebar';
import { CategoryTree } from '@/types'; // Import your actual type

interface MobileFiltersProps {
  tree: CategoryTree;
  selectedSlug?: string;
}

export default function MobileFilters({ tree, selectedSlug }: MobileFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-6 px-4">
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        Browse Categories {selectedSlug && `(1)`}
      </button>

      {/* Full Screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-100 bg-white flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <span className="font-black uppercase tracking-tighter text-xl">
              HV<span className="text-blue-600">PROPSHOP</span>
            </span>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-xs font-bold uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full"
            >
              Close
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 pb-32">
            <CategorySidebar tree={tree} selectedSlug={selectedSlug} />
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0,0.05)]">
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest"
            >
              Show Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}