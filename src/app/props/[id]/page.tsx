import { readItem, readItems } from '@directus/sdk';
import directus from '@/lib/directus';
import Gallery from '@/components/Gallery';
import Link from 'next/link';
import PropCard from '@/components/PropCard';
import { formatCategory } from '@/lib/utils';
import { GalleryItem, Prop } from '@/types';
import { notFound } from 'next/navigation';
import ShareButton from '@/components/ShareButton';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await directus.request(readItem('props', id, { fields: ['name', 'description', 'thumbnail'] }));

  return {
    title: `${item.name} | The Prop Vault`,
    description: item.description?.replace(/<[^>]*>?/gm, '').slice(0, 160), // Strip HTML for meta tag
    openGraph: {
      images: [`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${item.thumbnail}?width=1200&height=630&fit=cover`],
    },
  };
}

export default async function PropDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch the main item
  const item = await directus.request<Prop>(
    readItem('props', id, {
      fields: [
        '*',
        'thumbnail',
        // Added 'id' here so we can use it for the relatedItems filter
        { category: ['id', 'name', 'slug', { parent: ['name', 'slug'] }] },
        { photo_gallery: ['directus_files_id'] }
      ]
    })
  );

  if (!item) return notFound();

  // 2. Fetch related items from the same category
  const relatedItems = await directus.request<Prop[]>(
    readItems('props', {
      fields: ['id', 'name', 'price', 'thumbnail'],
      filter: {
        _and: [
          { category: { id: { _eq: item.category?.id } } },
          { id: { _neq: item.id } }
        ]
      },
      limit: 4 
    })
  );

  // Extract gallery IDs safely
  const imageIds = item.photo_gallery?.map((g: GalleryItem) => g.directus_files_id) || [];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-6 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          <div className="lg:col-span-7">
            {/* If no gallery images, fall back to the thumbnail */}
            <Gallery images={imageIds.length > 0 ? imageIds : [item.thumbnail]} />
          </div>

          <div className="lg:col-span-5 flex flex-col justify-start pt-2">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase mb-4">
                {item.category?.name ? formatCategory(item.category.name) : 'Specialty Prop'}
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-snug">
                {item.name}
              </h1>
              <p className="text-2xl lg:text-3xl text-slate-500 mt-4 font-light">
                ${item.price?.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ day</span>
              </p>
            </div>

            <div className="space-y-6 text-slate-600">
              <div className="border-t border-b py-8 border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Product Description</h3>
                <div 
                  className="prose prose-slate max-w-none text-lg leading-relaxed italic text-slate-600"
                  dangerouslySetInnerHTML={{ __html: item.description || 'No description available for this item.' }} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Availability</p>
                  <p className="font-bold text-slate-900 text-sm">Ready to Ship</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Condition</p>
                  <p className="font-bold text-slate-900 text-sm">Production Ready</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="mt-10 space-y-3">
              <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200 cursor-pointer">
                Check Availability
              </button>
              
              <ShareButton />
            </div>
          </div>

          {/* Related Items Section */}
          {relatedItems.length > 0 && (
            <section className="col-span-full mt-24 border-t border-slate-100 pt-16">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900">You might also need...</h2>
                  <p className="text-slate-400 text-sm font-medium">Other items from the {item.category?.name} collection</p>
                </div>
                <Link 
                  href={`/?category=${item.category?.slug}`} 
                  className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-slate-900 transition-colors"
                >
                  View all
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
                {relatedItems.map((related) => (
                  <PropCard key={related.id} item={related} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}