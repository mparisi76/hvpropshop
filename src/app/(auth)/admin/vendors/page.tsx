import Link from "next/link";
import { getAdminVendors, getPendingPayouts, VENDOR_ROLE_NAME } from "@/lib/admin";
import { formatDate, formatMoney } from "@/lib/bookings";
import { stripe } from "@/lib/payments";
import FeaturedToggle from "./FeaturedToggle";

async function stripeState(accountId: string | null) {
  if (!accountId) return { label: "Not connected", tone: "bg-neutral-100 text-neutral-600" };
  try {
    const a = await stripe.accounts.retrieve(accountId);
    if (a.capabilities?.transfers === "active") {
      return (a.requirements?.currently_due?.length ?? 0) > 0
        ? { label: "Ready · info due", tone: "bg-amber-50 text-amber-800" }
        : { label: "Ready", tone: "bg-accent-soft text-accent" };
    }
    return { label: "Setup unfinished", tone: "bg-amber-50 text-amber-800" };
  } catch {
    return { label: "Unknown", tone: "bg-red-50 text-red-700" };
  }
}

export default async function AdminVendors({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; warnings?: string }>;
}) {
  const { deleted, warnings } = await searchParams;
  let vendors: Awaited<ReturnType<typeof getAdminVendors>> = [];
  let error = false;
  try {
    vendors = await getAdminVendors();
  } catch (e) {
    console.error("[admin] Couldn't load vendors:", e);
    error = true;
  }

  const [states, payouts] = await Promise.all([
    Promise.all(vendors.map((v) => stripeState(v.stripe_account_id))),
    getPendingPayouts(),
  ]);
  const owed = new Map<string, number>();
  for (const p of payouts) {
    const id = p.prop_id?.user_created?.id;
    if (id) owed.set(id, (owed.get(id) ?? 0) + (Number(p.payout_amount) || 0));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Users with the &ldquo;{VENDOR_ROLE_NAME}&rdquo; role. Featured vendors are listed first in the directory.
          </p>
        </div>
        <Link href="/admin/applications" className="btn-secondary">Applications</Link>
      </div>

      {deleted && (
        <div className="mt-6 rounded-md border border-green-200 bg-accent-soft px-4 py-3 text-sm text-accent">
          <p className="font-medium">{deleted} was deleted.</p>
          {warnings?.split("\n").map((w) => (
            <p key={w} className="mt-1 text-amber-800">{w}</p>
          ))}
        </div>
      )}

      {error ? (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Couldn&apos;t load vendors. Check that your admin account can read users.
        </p>
      ) : vendors.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">No vendors yet.</p>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
                <th className="px-4 py-2.5 text-right font-medium">Listings</th>
                <th className="px-4 py-2.5 font-medium">Payouts</th>
                <th className="px-4 py-2.5 text-right font-medium">Owed</th>
                <th className="px-4 py-2.5 font-medium">Last active</th>
                <th className="px-4 py-2.5 font-medium">Featured</th>
                <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {vendors.map((v, i) => (
                <tr key={v.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {v.shop_name || [v.first_name, v.last_name].filter(Boolean).join(" ") || v.email}
                      {v.status !== "active" && (
                        <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-normal capitalize text-neutral-600">
                          {v.status}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500">{v.email}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{[v.city, v.state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {v.itemCount > 0 ? (
                      <Link href={`/vendors/${v.id}`} target="_blank" className="hover:underline">{v.itemCount}</Link>
                    ) : (
                      0
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${states[i].tone}`}>{states[i].label}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{owed.get(v.id) ? formatMoney(owed.get(v.id)) : "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{v.last_access ? formatDate(v.last_access) : "Never"}</td>
                  <td className="px-4 py-3">
                    <FeaturedToggle userId={v.id} featured={Boolean(v.featured_vendor)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/vendors/${v.id}/delete`} className="text-sm text-neutral-400 hover:text-red-700">
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
