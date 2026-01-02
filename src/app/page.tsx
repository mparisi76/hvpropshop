import Link from 'next/link';
import Image from 'next/image';
import directus from '@/lib/directus';
import { readItems } from '@directus/sdk';
import PropCard from '@/components/PropCard';
import { formatCategory } from '@/lib/utils';

// 1. Define the shared interface
interface Prop {
  id: string | number;
  status?: string;
  title?: string;
  name?: string;
  thumbnail?: string;
  category: string;
  price: number | string;
  featured?: boolean;
}

// 1. Update the SearchParams type
export default async function HomePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ category?: string; search?: string }> // Added search here
}) {
  const params = await searchParams;
  const selectedCategory = params.category;
  const searchQuery = params.search?.toLowerCase(); // Get the search query

  const items = await directus.request<Prop[]>(readItems('props'));

  // 2. Updated Filtering Logic
  const filteredItems = items.filter(i => {
    // Check Category
    const matchesCategory = selectedCategory ? i.category === selectedCategory : true;
    
    // Check Search (Checks title, name, and category)
    const searchString = `${i.title} ${i.name} ${i.category}`.toLowerCase();
    const matchesSearch = searchQuery ? searchString.includes(searchQuery) : true;

    return matchesCategory && matchesSearch;
  });

  const featuredItems = items.filter(i => i.featured === true);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Only show Search Results Header if searching */}
        {searchQuery && (
          <div className="mb-10">
            <h1 className="text-2xl font-black tracking-tight">
              Search results for &quot;{params.search}&quot;
            </h1>
            <Link href="/" className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-2 block">
              Clear Search
            </Link>
          </div>
        )}

        {/* Hide Featured Section if filtering by category OR searching */}
        {(!selectedCategory && !searchQuery) && featuredItems.length > 0 && (
          <section className="mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Featured Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredItems.map((item) => (
                <FeaturedCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* 6. GRID */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {filteredItems.map((item) => (
              <PropCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-medium">No props found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// 7. Typed FeaturedCard with Next.js Image
function FeaturedCard({ item }: { item: Prop }) {
  const displayTitle = item.title || item.name;
  
  return (
    <Link href={`/props/${item.id}`} className="group relative block overflow-hidden rounded-3xl bg-slate-200 aspect-16/10">
      {item.thumbnail && (
        <Image 
          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${item.thumbnail}?width=800&height=500&fit=cover`} 
          alt={displayTitle || 'Featured Prop'}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover group-hover:scale-105 transition duration-700"
        />
      )}
      
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-70 z-10" />
      
      <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.15em] bg-black/40 backdrop-blur-md border border-white/20 text-gray-200 shadow-lg">
            {formatCategory(item.category) || 'Prop'}
          </span>
          
          <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-md">
            {displayTitle}
          </h3>
          
          <p className="text-white/70 text-sm mt-1 font-medium italic">
            Starting at ${item.price}/day
          </p>
        </div>
      </div>
    </Link>
  );
}