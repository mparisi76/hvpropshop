import { readItem, readItems } from '@directus/sdk';
import directus from '@/lib/directus';
import Gallery from '@/components/Gallery';
import Link from 'next/link';
import PropCard from '@/components/PropCard';
import { formatCategory } from '@/lib/utils';
import { GalleryItem, Prop } from '@/types';
import { notFound } from 'next/navigation';
import InquirySection from '@/components/InquirySection';
import Breadcrumbs from '@/components/Breadcrumbs';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await directus.request(readItem('props', id, { fields: ['name', 'description', 'thumbnail'] }));
  const plainDescription = item.description
    ? item.description.replace(/<[^>]*>?/gm, '').slice(0, 150)
    : `Rent our ${item.name}. High-quality specialty props available for film, television, and event production.`;

  return {
    title: `${item.name} | HV Prop Shop`,
    description: plainDescription,
  };
}

export default async function PropDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await directus.request<Prop>(
    readItem('props', id, {
      fields: [
        '*',
        'thumbnail',
        {
          category: [
            'id',
            'name',
            'slug',{
              parent: [
                'name',
                'slug'
              ] 
            }
          ] 
        }, {
          photo_gallery: [
            'directus_files_id'
          ]
        }, {
          user_created: [
            'first_name',
            'shop_name',
            'city',
            'state',
            'phone',
            'email'
          ]
        },
        'dimensions',
        'quantity_available',
        'condition'
      ]
    })
  );

  if (!item) return notFound();

  const relatedItems = await directus.request<Prop[]>(
    readItems('props', {
      fields: ['id', 'name', 'price', 'thumbnail'],
      filter: { _and: [{ category: { id: { _eq: item.category?.id } } }, { id: { _neq: item.id } }] },
      limit: 4
    })
  );

  const imageIds = item.photo_gallery?.map((g: GalleryItem) => g.directus_files_id) || [];

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* 1. BREADCRUMBS: Only visible on desktop, zero height on mobile */}
      {item.category && (
        <header className="hidden lg:block sticky top-16 z-30 bg-white border-b border-slate-50 h-12">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center">
            <Breadcrumbs
              parent={item.category.parent ? { name: item.category.parent.name, slug: item.category.parent.slug } : undefined}
              current={{ name: item.category.name, slug: item.category.slug }}
            />
          </div>
        </header>
      )}

      {/* 2. MAIN CONTENT */}
      <main className="grow max-w-7xl mx-auto px-6 pt-4 lg:pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-16 items-start">

          {/* LEFT: Gallery */}
          <div className="lg:col-span-7">
            <Gallery images={imageIds.length > 0 ? imageIds : [item.thumbnail]} />
          </div>

          {/* RIGHT: Info Sidebar */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32 h-fit space-y-8">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold tracking-widest uppercase mb-4">
                  {item.category?.name ? formatCategory(item.category.name) : 'Specialty Prop'}
                </span>
                <h1 className="text-3xl lg:text-1xl font-bold tracking-tight text-slate-900 leading-tight">
                  {item.name}
                </h1>
                <p className="text-2xl text-slate-500 mt-4 font-light">
                  ${item.price?.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ day</span>
                </p>
              </div>

              {/* DETAILS SECTION */}
              <div className="border-t pt-8 border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Details</h3>
                <div
                  className="prose prose-slate max-w-none text-lg leading-relaxed italic text-slate-600"
                  dangerouslySetInnerHTML={{ __html: item.description || 'No description available.' }}
                />
              </div>

              {/* CONDITION/SPECS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 text-center lg:text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Availability</p>
                  <p className="font-bold text-slate-900 text-sm">Ready to Ship</p>
                </div>
                <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 text-center lg:text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Condition</p>
                  <p className="font-bold text-slate-900 text-sm">Production Ready</p>
                </div>
              </div>
              {/* ACTION BUTTONS: Hidden on mobile because they are in the bottom bar */}
              <div className="hidden lg:block">
                <InquirySection item={item} />
              </div>
            </div>
          </div>
        </div>

        {/* RELATED ITEMS */}
        {relatedItems.length > 0 && (
          <section className="mt-24 border-t border-slate-100 pt-8">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-3xl font-black tracking-tighter">You might also need...</h2>
              <Link href={`/?category=${item.category?.slug}`} className="text-xs font-black uppercase tracking-widest text-blue-600">View all</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10">
              {relatedItems.map((related) => <PropCard key={related.id} item={related} />)}
            </div>
          </section>
        )}
        <div className="h-28 lg:hidden" aria-hidden="true" />
      </main>

      {/* 3. MOBILE ACTION BAR: Only visible on mobile screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-100 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
          <p className="font-bold text-xl text-slate-900 leading-none">
            ${item.price?.toLocaleString()}
          </p>
        </div>
        <div className="flex-1 max-w-50">
          <InquirySection item={item} />
        </div>
      </div>
    </div>
  );
}