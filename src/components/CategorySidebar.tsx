'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CategoryTree } from '@/types';

export default function CategorySidebar({ tree, selectedSlug }: { tree: CategoryTree, selectedSlug?: string }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialOpen: Record<string, boolean> = {};
    if (selectedSlug) {
      const parent = Object.values(tree).find(p =>
        p.slug === selectedSlug ||
        Object.values(p.children).some(c => c.slug === selectedSlug)
      );
      if (parent) initialOpen[parent.slug] = true;
    }
    return initialOpen;
  });

  const toggleSection = (slug: string) => {
    setOpenSections(prev => ({ ...prev, [slug]: !prev[slug] }));
  };

  const sortedParents = Object.values(tree).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <aside className="w-64 flex flex-col gap-4 select-none animate-in fade-in duration-500">
      {/* "All Props" Section */}
      <div className="group">
        <Link
          href="/"
          className={`flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
            !selectedSlug ? 'text-blue-600' : 'text-slate-600 hover:text-black'
          }`}
        >
          <span>All Inventory</span>
          {!selectedSlug && <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
        </Link>
        <div className={`mt-1.5 h-px w-full ${!selectedSlug ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-slate-400 transition-colors'}`} />
      </div>

      <nav className="flex flex-col gap-1">
        {sortedParents.map((parent) => {
          const isOpen = openSections[parent.slug];
          const isActive = selectedSlug === parent.slug;
          const hasChildren = Object.keys(parent.children).length > 0;
          const isParentOfActiveChild = Object.values(parent.children).some(c => c.slug === selectedSlug);
          
          const sortedChildren = Object.values(parent.children).sort((a, b) => a.name.localeCompare(b.name));

          return (
            <div key={parent.slug} className="flex flex-col">
              {/* Parent Entry */}
              <div className="flex items-center justify-between py-1 group/item">
                <Link
                  onClick={() => setOpenSections(prev => ({ ...prev, [parent.slug]: true }))}
                  href={`/?category=${parent.slug}`}
                  className={`flex items-center gap-2 font-bold uppercase text-[11px] tracking-wider transition-all ${
                    isActive || isParentOfActiveChild ? 'text-blue-600' : 'text-slate-700 hover:text-black'
                  }`}
                >
                  {parent.name}
                  <span className={`text-[9px] font-bold ${isActive || isParentOfActiveChild ? 'text-blue-400' : 'text-slate-400'}`}>
                    {parent.totalCount}
                  </span>
                </Link>

                {hasChildren && (
                  <button 
                    onClick={() => toggleSection(parent.slug)} 
                    className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-400 hover:text-slate-900"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Sub-categories - Darker & Clearer */}
              {hasChildren && (
                <div className={`grid transition-all duration-200 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="flex flex-col pl-3 mb-1 border-l-2 border-slate-100 ml-1">
                      {sortedChildren.map((child) => (
                        <Link
                          key={child.slug}
                          href={`/?category=${child.slug}`}
                          className={`text-[12px] py-1.5 transition-all ${
                            selectedSlug === child.slug
                              ? 'text-blue-600 font-extrabold'
                              : 'text-slate-600 hover:text-blue-600'
                          }`}
                        >
                          <span className="flex items-center justify-between pr-2">
                            {child.name}
                            <span className="text-[10px] font-medium opacity-60">
                              {child.count}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}