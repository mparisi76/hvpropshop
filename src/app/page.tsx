import { readItems } from '@directus/sdk';
import directus from '@/lib/directus';
import CategorySidebar from '@/components/CategorySidebar';
import { Category, Prop } from '@/types';
import { getCategoryTree } from '@/lib/utils';
import MobileCategoryBar from '@/components/MobileCategoryBar';
import PropFeed from '@/components/PropFeed';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string, search?: string }> }) {
  const params = await searchParams;
  const selectedSlug = params.category;
  const searchQuery = params.search?.toLowerCase();

  // Build the conditions array first to maintain clean types
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

  // Combine into the final filter object
  const directusFilters = andConditions.length > 0 ? { _and: andConditions } : {};

  // 2. Initial Fetch
  const initialItems = await directus.request<Prop[]>(readItems('props', {
    fields: [
      'id', 'name', 'price', 'thumbnail', 'description',
      { category: ['id', 'name', 'slug', { parent: ['id', 'name', 'slug'] }] }
    ],
    filter: directusFilters,
    limit: 12,
    offset: 0,
    sort: ['-date_created']
  }));

  // 3. Fetch for Sidebar (Tree Counts)
  const [categories, allItemsForTree] = await Promise.all([
    directus.request<Category[]>(readItems('categories', {
      fields: ['id', 'name', 'slug', { parent: ['id', 'slug'] }],
      limit: -1
    })),
    directus.request<Prop[]>(readItems('props', {
      fields: ['id', { category: ['id', 'slug', { parent: ['id', 'slug'] }] }],
      limit: -1
    }))
  ]);

  const categoryTree = getCategoryTree(categories, allItemsForTree);

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

          <PropFeed 
            key={`${selectedSlug}-${searchQuery}`} 
            initialItems={initialItems}
            category={selectedSlug}
            search={searchQuery}
          />

          {initialItems.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-medium italic">No props found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}