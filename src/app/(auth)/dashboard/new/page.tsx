// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
import Link from "next/link";
import { uploadProp } from "./actions"; // We will create this next

export default async function NewPropPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8 lg:p-24">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="mb-12 flex gap-4 items-center text-[10px] font-bold uppercase tracking-[0.2em]">
          <Link href="/dashboard" className="text-slate-400 hover:text-black">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-black">New Prop</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
            List a New Prop
          </h1>
          <p className="text-slate-500 mt-2">
            Fill in the details to add this item to your studio collection.
          </p>
        </header>

        <form
          action={uploadProp}
          className="space-y-8 bg-white p-10 rounded-4xl shadow-sm border border-slate-100"
        >
          {/* Name Field */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              Prop Name
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Vintage Italian Lounge Chair"
              className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Price Field */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Price (Per Day)
              </label>
              <input
                name="price"
                type="number"
                required
                placeholder="0.00"
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Thumbnail Image
              </label>
              <input
                name="thumbnail"
                type="file"
                accept="image/*"
                required
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          <hr className="border-slate-50" />

          <div className="flex items-center justify-end gap-6">
            <Link
              href="/dashboard"
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-black text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-black/5 active:scale-95"
            >
              Create Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
