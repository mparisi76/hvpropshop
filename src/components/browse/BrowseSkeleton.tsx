/**
 * Placeholder for the results column while a browse page loads. The sidebar
 * stays on screen (it's in the layout), so only this part is replaced.
 */
export default function BrowseSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-6 border-b border-neutral-200 pb-5">
        <div className="h-4 w-32 rounded bg-neutral-100" />
        <div className="mt-2 h-8 w-72 max-w-full rounded bg-neutral-200" />
        <div className="mt-3 h-4 w-[28rem] max-w-full rounded bg-neutral-100" />
        <div className="mt-5 flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-neutral-100" />
          <div className="h-9 w-48 rounded-md bg-neutral-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-4/3 rounded-md bg-neutral-100" />
            <div className="mt-2.5 h-4 w-3/4 rounded bg-neutral-100" />
            <div className="mt-1.5 h-3 w-1/2 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
