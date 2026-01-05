import { readItems } from '@directus/sdk';
import directus from '@/lib/directus';
import CategorySidebar from '@/components/CategorySidebar';
import PropCard from '@/components/PropCard';
import { Category, Prop } from '@/types';
import { getCategoryTree } from '@/lib/utils';
import MobileFilters from '@/components/MobileFilters';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string, search?: string }> }) {
  const params = await searchParams;
  const selectedSlug = params.category;
  const searchQuery = params.search?.toLowerCase(); // Get the search term from the URL

  const allItems = await directus.request<Prop[]>(readItems('props', {
    fields: [
      'id', 
      'name', 
      'price', 
      'thumbnail',
      { category: ['id', 'name', 'slug', { parent: ['id', 'name', 'slug'] }] }
    ],
    limit: -1
  }));

  const categories = await directus.request(readItems('categories', {
    fields: ['id', 'name', 'slug', { parent: ['id', 'slug'] }],
    limit: -1
  })) as Category[];

  const filteredItems = allItems.filter(item => {
    // Category Logic
    const matchesCategory = !selectedSlug || 
      item.category?.slug === selectedSlug || 
      item.category?.parent?.slug === selectedSlug;

    // Search Logic
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery) || 
      item.description?.toLowerCase().includes(searchQuery);

    return matchesCategory && matchesSearch;
  });
  // const filteredItems = allItems.filter(item => {
  //   if (!selectedSlug) return true;

  //   const itemCatSlug = item.category?.slug;
  //   const parentCatSlug = item.category?.parent?.slug;

  //   // Match if user clicked the child (e.g. 'kitchen') 
  //   // OR if user clicked the parent (e.g. 'appliances')
  //   return itemCatSlug === selectedSlug || parentCatSlug === selectedSlug;
  // });

  const categoryTree = getCategoryTree(categories, allItems);

 // Inside src/app/page.tsx

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* 1. Desktop Sidebar (Hidden on mobile) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <CategorySidebar tree={categoryTree} selectedSlug={selectedSlug} />
          </div>
        </aside>

        <main className="flex-1">
          {/* 2. Mobile Filter Button (Hidden on desktop) */}
          <MobileFilters tree={categoryTree} selectedSlug={selectedSlug} />

          {/* 3. The Grid (Responsive Columns) */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 md:gap-8">
            {filteredItems.map(item => (
              <PropCard key={item.id} item={item} />
            ))}
          </div>
          
          {/* ... empty states ... */}
        </main>
      </div>
    </div>
  );
}

// 7. Typed FeaturedCard with Next.js Image
// function FeaturedCard({ item }: { item: Prop }) {
//   const displayTitle = item.title || item.name;
  
//   return (
//     <Link href={`/props/${item.id}`} className="group relative block overflow-hidden rounded-3xl bg-slate-200 aspect-16/10">
//       {item.thumbnail && (
//         <Image 
//           src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${item.thumbnail}?width=800&height=500&fit=cover`} 
//           alt={displayTitle || 'Featured Prop'}
//           fill
//           sizes="(max-width: 768px) 100vw, 33vw"
//           className="object-cover group-hover:scale-105 transition duration-700"
//         />
//       )}
      
//       <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-70 z-10" />
      
//       <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
//         <div>
//           <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.15em] bg-black/40 backdrop-blur-md border border-white/20 text-gray-200 shadow-lg">
//             {formatCategory(item.category) || 'Prop'}
//           </span>
          
//           <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-md">
//             {displayTitle}
//           </h3>
          
//           <p className="text-white/70 text-sm mt-1 font-medium italic">
//             Starting at ${item.price}/day
//           </p>
//         </div>
//       </div>
//     </Link>
//   );
// }