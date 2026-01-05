'use client';

import { useRouter } from 'next/navigation';
import { CategoryTree } from '@/types';

interface MobileFiltersProps {
  tree: CategoryTree;
  selectedSlug?: string;
}

export default function MobileFilters({ tree, selectedSlug }: MobileFiltersProps) {
  const router = useRouter();

  // Find the active name to show on the button
  // const activeCategory = Object.values(tree).flatMap(p => [p, ...Object.values(p.children)])
  //   .find(c => c.slug === selectedSlug);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (slug === 'all') {
      router.push('/');
    } else {
      router.push(`/?category=${slug}`);
    }
  };

  return (
    <div className="lg:hidden mb-6 px-4">
      <div className="relative">
        <label htmlFor="category-select" className="sr-only">Select Category</label>
        <select
          id="category-select"
          value={selectedSlug || 'all'}
          onChange={handleChange}
          className="w-full bg-slate-100 border-none rounded-xl px-5 py-4 text-sm font-bold uppercase tracking-widest appearance-none focus:ring-2 focus:ring-blue-600 outline-none"
        >
          <option value="all">All Inventory</option>
          {Object.values(tree).sort((a, b) => a.name.localeCompare(b.name)).map((parent) => (
            <optgroup key={parent.slug} label={parent.name.toUpperCase()}>
              <option value={parent.slug}>{parent.name} (All)</option>
              {Object.values(parent.children).sort((a, b) => a.name.localeCompare(b.name)).map((child) => (
                <option key={child.slug} value={child.slug}>
                  — {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        
        {/* Custom Chevron Icon */}
        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}