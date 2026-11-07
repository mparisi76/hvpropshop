/* eslint-disable @next/next/no-img-element */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import directus from "@/lib/directus";
import { readMe, readItems, withToken } from "@directus/sdk";
import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusSelect from "@/components/dashboard/StatusSelect";
import { getStatusChoices } from "@/lib/listings";
import { getActiveBlocks, type Block } from "@/lib/bookings";
import BlockDates, { blockLabel, type BlockSummary } from "@/components/dashboard/BlockDates";

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
          fields: ["first_name", "shop_name", "city", "id"],
        })
      )
    );

    // 3. Fetch Vendor's specific inventory
    // Change "props" to your actual collection name if different
    userProps = await directus.request(
      withToken(
        token,
        readItems("props", {
          fields: ["id", "name", "status", "price", "thumbnail", "quantity_available"],
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

  const publishedCount = userProps.filter((p) => p.status === "published").length;
  const statusChoices = await getStatusChoices(token);

  // Current/upcoming date blocks, grouped by listing
  const blocks: Block[] = await getActiveBlocks(userProps.map((p) => p.id)).catch((error) => {
    console.error("Load blocks error:", error);
    return [];
  });
  const blocksByProp = new Map<string, BlockSummary[]>();
  for (const b of blocks) {
    const key = String(b.prop_id);
    blocksByProp.set(key, [
      ...(blocksByProp.get(key) ?? []),
      { id: String(b.id), start_date: b.start_date, end_date: b.end_date, quantity: Number(b.quantity) || 1, note: b.note },
    ]);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page py-8">
        {(!user.shop_name || !user.city) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>
              Finish your profile so productions know who you are and where to pick up.
            </p>
            <Link href="/dashboard/profile" className="btn-secondary">
              Complete profile
            </Link>
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back{user.first_name ? `, ${user.first_name}` : ""}
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {userProps.length} {userProps.length === 1 ? "listing" : "listings"} ·{" "}
              {publishedCount} published
            </p>
          </div>
        </div>

        {userProps.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Item</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Rate</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {userProps.map((prop) => (
                  <tr key={prop.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/edit/${prop.id}`} className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                          {prop.thumbnail && (
                            <img
                              src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${prop.thumbnail}?width=96&height=96&fit=cover`}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <span className="min-w-0">
                          <span className="block font-medium text-neutral-900 hover:underline">
                            {prop.name}
                          </span>
                          {blocksByProp.get(String(prop.id))?.[0] && (
                            <span className="block text-xs text-amber-700">
                              {blockLabel(blocksByProp.get(String(prop.id))![0])}
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        id={String(prop.id)}
                        status={prop.status ?? "draft"}
                        choices={statusChoices}
                        label={prop.name}
                      />
                    </td>
                    <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                      ${prop.price}
                      <span className="text-neutral-500">/day</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <BlockDates
                          propId={String(prop.id)}
                          propName={prop.name}
                          totalUnits={Math.max(1, Number(prop.quantity_available) || 1)}
                          blocks={blocksByProp.get(String(prop.id)) ?? []}
                        />
                        {prop.status === "published" && (
                          <Link
                            href={`/props/${prop.id}`}
                            target="_blank"
                            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                            aria-label={`View ${prop.name} on the site`}
                            title="View on site"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/edit/${prop.id}`}
                          className="btn-ghost h-8! px-2.5!"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card px-6 py-16 text-center">
            <h2 className="text-base font-semibold">No listings yet</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Add your first item so productions can find it.
            </p>
            <Link href="/dashboard/new" className="btn-primary mt-6">
              <Plus className="h-4 w-4" /> New listing
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
