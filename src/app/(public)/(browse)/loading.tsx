/** Shown instantly while a browse page (home, category, town) loads. */
export default function BrowseLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="container-page animate-pulse py-8 md:py-10">
          <div className="h-8 w-72 max-w-full rounded bg-neutral-200" />
          <div className="mt-3 h-4 w-[28rem] max-w-full rounded bg-neutral-200" />
        </div>
      </section>

      <div className="container-page">
        <div className="flex flex-col lg:flex-row lg:gap-10">
          <aside className="hidden w-56 shrink-0 py-8 lg:block">
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="h-7 rounded bg-neutral-100" />
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1 py-6 lg:py-8">
            <div className="mb-6 flex animate-pulse items-end justify-between border-b border-neutral-200 pb-4">
              <div className="h-6 w-40 rounded bg-neutral-100" />
              <div className="h-9 w-48 rounded-md bg-neutral-100" />
            </div>
            <div className="grid animate-pulse grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i}>
                  <div className="aspect-4/3 rounded-md bg-neutral-100" />
                  <div className="mt-2.5 h-4 w-3/4 rounded bg-neutral-100" />
                  <div className="mt-1.5 h-3 w-1/2 rounded bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
