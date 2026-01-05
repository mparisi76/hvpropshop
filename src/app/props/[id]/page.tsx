import { readItem, readItems } from '@directus/sdk';
import directus from '@/lib/directus';
import Gallery from '@/components/Gallery';
import Link from 'next/link';
import PropCard from '@/components/PropCard';
import { formatCategory } from '@/lib/utils';
import { Prop } from '@/types';

export default async function PropDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const item = await directus.request<Prop>(
    readItem('props', id, {
      fields: [
        '*',
        'thumbnail',
        { category: ['name', 'slug', { parent: ['name', 'slug'] }] },
        { photo_gallery: ['directus_files_id'] }
      ]
    })
  );

  const relatedItems = await directus.request<Prop[]>(
    readItems('props', {
      fields: ['id', 'name', 'price', 'thumbnail'],
      filter: {
        category: { 
          id: { 
            _eq: item.category?.id
          }
        },
        id: { _neq: item.id }
      },
      limit: 4 
    })
  );

  const imageIds = item.photo_gallery?.map((g) => g.directus_files_id) || [];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-6 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          <div className="lg:col-span-7">
            <Gallery images={imageIds} />
          </div>

          <div className="lg:col-span-5 flex flex-col justify-start pt-2">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-widest uppercase mb-4">
                {formatCategory(item.category?.name || "") || 'Specialty Prop'}
              </span>
              <h1 className="text-4xl lg:text-2xl font-extrabold tracking-tight leading-tight">
                {item.name}
              </h1>
              <p className="text-2xl lg:text-3xl text-slate-500 mt-4 font-light">
                ${item.price?.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ day</span>
              </p>
            </div>

            <div className="space-y-6 text-slate-600">
              <div className="border-t border-b py-6 border-slate-300">
                <h3 className="text-sm font-bold text-slate-600 uppercase mb-2">Description</h3>
                <div 
                  className="prose prose-slate max-w-none text-lg leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.description || '' }} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-bold">Availability</p>
                  <p className="font-semibold">Ready to Ship</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-bold">Condition</p>
                  <p className="font-semibold">Production Ready</p>
                </div>
              </div>
            </div>

            <button className="mt-10 w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200">
              Check Availability
            </button>
          </div>

          {/* Related Items Section */}
          <section className="col-span-full mt-24 border-t border-slate-100 pt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-900">You might also need...</h2>
              <Link href={`/?category=${item.category}`} className="text-sm font-bold text-blue-600 hover:underline">
                View all {formatCategory(item.category?.name || "")}
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {relatedItems.map((related) => (
                <PropCard key={related.id} item={related} />
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}