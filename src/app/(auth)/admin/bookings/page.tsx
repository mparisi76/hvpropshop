/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAllBookings } from "@/lib/admin";
import { BOOKING_STATUS, formatMoney, todayIso, type Booking } from "@/lib/bookings";
import { canCancel } from "@/lib/cancellations";
import AdminCancel from "./AdminCancel";

const TABS = [
  { key: "pending", label: "Needs response" },
  { key: "accepted", label: "Awaiting payment" },
  { key: "booked", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800",
  accepted: "bg-blue-50 text-blue-800",
  paid: "bg-accent-soft text-accent",
  declined: "bg-neutral-100 text-neutral-600",
  cancelled: "bg-neutral-100 text-neutral-600",
};

const short = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const bookings = await getAllBookings().catch(() => [] as Booking[]);
  const today = todayIso();

  const groups: Record<Tab, Booking[]> = { pending: [], accepted: [], booked: [], past: [], all: bookings };
  for (const b of bookings) {
    if (b.status === BOOKING_STATUS.pending) groups.pending.push(b);
    else if (b.status === BOOKING_STATUS.accepted && b.end_date >= today) groups.accepted.push(b);
    else if (b.status === BOOKING_STATUS.paid && b.end_date >= today) groups.booked.push(b);
    else groups.past.push(b);
  }
  groups.booked.sort((a, b) => a.start_date.localeCompare(b.start_date));

  const requested = (await searchParams).tab as Tab | undefined;
  const tab: Tab = requested && requested in groups ? requested : "pending";
  const rows = groups[tab];
  const base = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-neutral-200 no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/bookings?tab=${t.key}`}
            className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              t.key === tab ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.label}
            <span className="rounded-full bg-neutral-100 px-1.5 text-xs tabular-nums text-neutral-600">
              {groups[t.key].length}
            </span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">Nothing here.</p>
      ) : (
        <div className="card mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Item</th>
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Dates</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {rows.map((b) => (
                <tr key={b.id} className="align-top hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                        {b.prop_id?.thumbnail && (
                          <img
                            src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${b.prop_id.thumbnail}?width=80&height=80&fit=cover&format=webp`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium">{b.item_name ?? b.prop_id?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {b.prop_id?.user_created?.shop_name ?? b.prop_id?.user_created?.first_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.customer_name}</p>
                    <p className="text-xs text-neutral-500">{b.customer_email}</p>
                    {b.production && <p className="text-xs text-neutral-500">{b.production}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                    {short(b.start_date)} – {short(b.end_date)}
                    <span className="block text-xs text-neutral-400">× {b.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.total != null ? formatMoney(b.total) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[b.status] ?? "bg-neutral-100"}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start justify-end gap-1">
                      {b.payment_token && (
                        <a
                          href={`${base}/pay/${b.id}?t=${b.payment_token}`}
                          target="_blank"
                          title="Open the customer's booking page"
                          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {canCancel(b, "admin") && (
                        <AdminCancel
                          id={String(b.id)}
                          paid={b.status === BOOKING_STATUS.paid}
                          totalLabel={b.total != null ? formatMoney(b.total) : ""}
                        />
                      )}
                    </div>
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
