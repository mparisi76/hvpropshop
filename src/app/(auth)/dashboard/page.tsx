/* eslint-disable @next/next/no-img-element */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import directus from "@/lib/directus";
import { readMe, readItems, withToken } from "@directus/sdk";
import { logout } from "../logout-action";
import Link from "next/link";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("directus_token")?.value;

  // 1. Redirect if not logged in
  if (!token) {
    redirect("/login");
  }

  let user;
  let userProps = [];

  try {
    // 2. Fetch User Profile
    user = await directus.request(
      withToken(
        token,
        readMe({
          fields: ["first_name", "shop_name", "id"],
        })
      )
    );

    // 3. Fetch Vendor's specific inventory
    // Change "props" to your actual collection name if different
    userProps = await directus.request(
      withToken(
        token,
        readItems("props", {
          fields: ["id", "name", "status", "price", "thumbnail"],
          filter: {
            user_created: { _eq: "$CURRENT_USER" },
          },
          sort: ["-date_created"],
        })
      )
    );
  } catch (error) {
    console.error("Dashboard Auth Error:", error);
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* SIDEBAR/NAV SECTION */}
      <nav className="border-b border-slate-100 px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        
        {/* LEFT: Consistent Brand Logo */}
        <div className="flex items-center">
          {/* Using the Logo component we discussed to keep the colors standard */}
          <Link href="/" className="text-xl font-black tracking-tighter hover:text-blue-600 transition flex items-center">
            <span className="text-slate-900">HV</span>
            <span className="text-blue-600">PROPSHOP</span>
          </Link>
        </div>

        {/* RIGHT: Vendor Info & Sign Out */}
        {/* RIGHT: Vendor Info & Sign Out */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 border-r border-slate-100 pr-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg">
              Vendor Portal
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              /
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 whitespace-nowrap">
              {user.shop_name || "My Studio"}
            </span>
          </div>

          {/* Added 'flex items-center' to the form to force alignment */}
          <form action={logout} className="flex items-center">
            <button type="submit" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-600 transition-all active:scale-95 leading-none">
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 lg:p-12">
        {/* HEADER SECTION */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
              Welcome back, {user.first_name || "Vendor"}
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              You currently have {userProps.length} props listed in the
              marketplace.
            </p>
          </div>

          <Link
            href="/dashboard/new" 
            className="bg-black text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-black/5 active:scale-95 inline-block text-center"
          >
            + List New Prop
          </Link>
        </header>

        {/* INVENTORY GRID */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px bg-slate-100 grow" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 whitespace-nowrap">
              Live Inventory
            </h3>
            <div className="h-px bg-slate-100 grow" />
          </div>

          {userProps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {userProps.map((prop) => (
                <div key={prop.id} className="group cursor-pointer">
                  <div className="aspect-4/5 bg-slate-50 rounded-3xl mb-4 overflow-hidden relative border border-slate-100 group-hover:border-blue-500 transition-all shadow-sm">
                    {prop.thumbnail ? (
                      <img
                        src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${prop.thumbnail}?width=400&height=500&fit=cover`}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
                        No Image
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                          prop.status === "published"
                            ? "bg-green-500 text-white"
                            : "bg-amber-400 text-white"
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">
                    {prop.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold mt-1 tracking-widest">
                    ${prop.price} / DAY
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-100 rounded-[3rem] p-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📦</span>
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
                Your studio is empty
              </p>
              <p className="text-slate-300 text-[10px] mt-2 max-w-50 mx-auto uppercase font-bold tracking-widest">
                Start by adding your first production prop
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
