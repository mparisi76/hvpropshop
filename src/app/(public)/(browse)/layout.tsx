import { Suspense } from "react";
import CategorySidebar from "@/components/CategorySidebar";
import MobileCategoryBar from "@/components/MobileCategoryBar";
import { getCatalog } from "@/lib/catalog";

/**
 * Shared frame for browse pages (home, categories, towns). The sidebar and
 * mobile category bar live here so they stay on screen while you move between
 * categories; only the results column on the right changes (and shows a
 * placeholder while loading).
 */
export default async function BrowseLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();

  return (
    <div className="container-page">
      <div className="flex flex-col lg:flex-row lg:gap-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-8">
            <Suspense fallback={null}>
              <CategorySidebar tree={catalog.tree} vendorCount={catalog.vendorCount} />
            </Suspense>
          </div>
        </aside>

        <div className="min-w-0 flex-1 py-6 lg:py-8">
          <div className="mb-5 lg:hidden">
            <Suspense fallback={null}>
              <MobileCategoryBar tree={catalog.tree} />
            </Suspense>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
