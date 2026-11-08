import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/currentUser";
import {
  BOOKING_STATUS,
  formatMoney,
  getVendorBookings,
  todayIso,
  type Booking,
} from "@/lib/bookings";
import { canCancel } from "@/lib/cancellations";
import RequestRow, { type RequestRowData } from "./RequestRow";

const TABS = [
  { key: "pending", label: "Needs response" },
  { key: "accepted", label: "Awaiting payment" },
  { key: "booked", label: "Booked" },
  { key: "past", label: "Past" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const EMPTY: Record<TabKey, string> = {
  pending: "You're all caught up.",
  accepted: "No accepted requests waiting on payment.",
  booked: "No upcoming bookings.",
  past: "Nothing here yet.",
};


const shortDate = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let bookings: Booking[] = [];
  let loadError = false;
  try {
    bookings = await getVendorBookings(user.id);
  } catch (error) {
    console.error("Load bookings error:", error);
    loadError = true;
  }

  const today = todayIso();
  const groups: Record<TabKey, Booking[]> = { pending: [], accepted: [], booked: [], past: [] };
  for (const b of bookings) {
    if (b.status === BOOKING_STATUS.pending) groups.pending.push(b);
    else if (b.status === BOOKING_STATUS.accepted && b.end_date >= today) groups.accepted.push(b);
    else if (b.status === BOOKING_STATUS.paid && b.end_date >= today) groups.booked.push(b);
    else groups.past.push(b);
  }
  groups.booked.sort((a, b) => a.start_date.localeCompare(b.start_date));

  const requested = (await searchParams).tab as TabKey | undefined;
  const tab: TabKey =
    requested && requested in groups ? requested : groups.pending.length ? "pending" : "booked";
  const rows = groups[tab];

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Customers only pay after you accept, so check availability before accepting.
        </p>

        <nav aria-label="Request status" className="mt-6 flex gap-1 overflow-x-auto border-b border-neutral-200 no-scrollbar">
          {TABS.map((t) => {
            const active = t.key === tab;
            const count = groups[t.key].length;
            return (
              <Link
                key={t.key}
                href={`/dashboard/requests?tab=${t.key}`}
                aria-current={active ? "page" : undefined}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${
                    t.key === "pending" && count > 0 ? "bg-accent text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </nav>

        {loadError ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load requests. If this keeps happening, contact HV Prop Shop.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">{EMPTY[tab]}</p>
        ) : (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Item</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Dates</th>
                  <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell">Total</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {rows.map((b) => (
                  <RequestRow key={b.id} r={toRow(b)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

/** Plain data for the client row component. */
function toRow(b: Booking): RequestRowData {
  return {
    id: String(b.id),
    status: b.status,
    itemName: b.item_name ?? b.prop_id?.name ?? "Item",
    thumbnail: b.prop_id?.thumbnail ?? null,
    customerName: b.customer_name ?? "Customer",
    production: b.production,
    email: b.customer_email,
    phone: b.phone,
    message: b.message,
    declineReason: b.decline_reason,
    startLabel: shortDate(b.start_date),
    endLabel: shortDate(b.end_date),
    quantity: b.quantity,
    totalLabel: b.total != null ? formatMoney(b.total) : "—",
    canCancel: canCancel(b, "vendor"),
  };
}
