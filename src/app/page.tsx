import { readItems } from '@directus/sdk';
import directus from '@/lib/directus';
import CategorySidebar from '@/components/CategorySidebar';
import { Category, Prop } from '@/types';
import { getCategoryTree } from '@/lib/utils';
import MobileCategoryBar from '@/components/MobileCategoryBar';
import PropFeed from '@/components/PropFeed';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string, search?: string }> }): Promise<Metadata> {
  const { category, search } = await searchParams;
  
  let title = "HV Prop Shop | Premium Rentals";
  
  if (search) {
    title = `"${search}" Props | HV Prop Shop`;
  } else if (category) {
    // Clean up slug for title: replace dashes with spaces and capitalize
    const catName = category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    title = `${catName} Rentals | HV Prop Shop`;
  }

  return {
    title,
    description: "Browse our exclusive collection of high-end props for film and photography.",
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string, search?: string }> }) {
  const params = await searchParams;
  const selectedSlug = params.category;
  const searchQuery = params.search?.toLowerCase();

  const andConditions = [];

  if (selectedSlug) {
    andConditions.push({
      _or: [
        { category: { slug: { _eq: selectedSlug } } },
        { category: { parent: { slug: { _eq: selectedSlug } } } }
      ]
    });
  }

  if (searchQuery) {
    andConditions.push({
      _or: [
        { name: { _icontains: searchQuery } },
        { description: { _icontains: searchQuery } }
      ]
    });
  }

  const directusFilters = andConditions.length > 0 ? { _and: andConditions } : {};

  // 1. Initial Fetch (Items + Categories + Counts)
  const [initialItems, categories, allItemsForTree, totalCountResponse] = await Promise.all([
    directus.request<Prop[]>(readItems('props', {
      fields: [
        'id', 'name', 'price', 'thumbnail', 'description', 'status',
        { category: ['id', 'name', 'slug', { parent: ['id', 'name', 'slug'] }] }
      ],
      filter: {
        _and: [{ status: { _eq: 'published' } }, directusFilters]
      },
      limit: 12,
      offset: 0,
      sort: ['-date_created']
    })),
    directus.request<Category[]>(readItems('categories', {
      fields: ['id', 'name', 'slug', { parent: ['id', 'slug'] }],
      limit: -1
    })),
    directus.request<Prop[]>(readItems('props', {
      fields: ['id', { category: ['id', 'slug', { parent: ['id', 'slug'] }] }],
      filter: { status: { _eq: 'published' } },
      limit: -1
    })),
    directus.request(readItems('props', {
      filter: { _and: [{ status: { _eq: 'published' } }, directusFilters] },
      aggregate: { count: '*' }
    }))
  ]);

  const totalCount = parseInt(totalCountResponse[0].count as string);
  const categoryTree = getCategoryTree(categories, allItemsForTree);

  // Helper to get a clean category name for the UI
  const flatCategories = Object.values(categoryTree).flatMap(p => [p, ...Object.values(p.children)]);
  const currentCategory = flatCategories.find(c => c.slug === selectedSlug);
  const displayCategoryName = currentCategory?.name;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <CategorySidebar tree={categoryTree} selectedSlug={selectedSlug} />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <MobileCategoryBar tree={categoryTree} selectedSlug={selectedSlug} />

          {initialItems.length > 0 ? (
            <PropFeed 
              key={`${selectedSlug}-${searchQuery}`} 
              initialItems={initialItems}
              category={selectedSlug}
              search={searchQuery}
              totalCount={totalCount}
            />
          ) : (
            <div className="text-center py-24 bg-slate-50 rounded-4xl border-2 border-dashed border-slate-200 flex flex-col items-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              
              <h3 className="text-xl font-serif italic text-slate-800 mb-2">No props found</h3>
              
              <p className="text-slate-500 text-sm max-w-sm px-6">
                {searchQuery ? (
                  <>
                    We couldn&apos;t find anything matching <span className="font-bold text-slate-900">&ldquo;{searchQuery}&rdquo;</span>
                    {displayCategoryName && <> in <span className="font-bold text-slate-900">{displayCategoryName}</span></>}
                  </>
                ) : (
                  <>
                    There are currently no items available in the <span className="font-bold text-slate-900 uppercase tracking-tighter">{displayCategoryName || 'selected'}</span> category.
                  </>
                )}
              </p>
              
              <div className="flex flex-col gap-4 mt-8">
                {selectedSlug && searchQuery ? (
                  <Link 
                    href={`/?search=${searchQuery}`}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700"
                  >
                    Search entire database instead
                  </Link>
                ) : null}
                
                <Link 
                  href="/"
                  className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-8 py-3 rounded-full hover:bg-blue-600 transition-colors"
                >
                  Clear all filters
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}