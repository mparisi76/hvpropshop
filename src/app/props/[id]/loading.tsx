export default function Loading() {
  return (
    // min-h-screen is the magic fix here
    <div className="min-h-screen bg-white max-w-7xl mx-auto px-6 py-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Large Image Placeholder */}
        <div className="lg:col-span-7 aspect-4/3 bg-slate-100 rounded-2xl" />
        
        {/* Right Side: Text Placeholders */}
        <div className="lg:col-span-5 space-y-6">
          <div className="h-4 w-24 bg-slate-100 rounded-full" />
          <div className="h-12 w-3/4 bg-slate-100 rounded-xl" />
          <div className="h-8 w-1/4 bg-slate-100 rounded-lg" />
          <div className="h-40 w-full bg-slate-100 rounded-2xl" />
          <div className="h-16 w-full bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}