export default function Loading() {
  return (
    <div className="container-page min-h-screen animate-pulse pt-6">
      <div className="mb-6 h-4 w-48 rounded bg-neutral-100" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="aspect-4/3 rounded-md bg-neutral-100 lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5">
          <div className="h-8 w-3/4 rounded bg-neutral-100" />
          <div className="h-6 w-1/4 rounded bg-neutral-100" />
          <div className="h-10 w-full rounded-md bg-neutral-100" />
          <div className="h-40 w-full rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
