import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { getAllBookings, getApplications, getPendingPayouts } from "@/lib/admin";
import { BOOKING_STATUS, formatDate, formatMoney, todayIso } from "@/lib/bookings";
import { addDays, businessDate } from "@/lib/site";

export default async function AdminOverview() {
  const [bookings, payouts, applications] = await Promise.all([
    getAllBookings().catch(() => []),
    getPendingPayouts(),
    getApplications(),
  ]);

  const today = todayIso();
  const yesterday = addDays(today, -1);
  const pending = bookings.filter((b) => b.status === BOOKING_STATUS.pending);
  const slow = pending.filter((b) => businessDate(b.date_created ?? new Date()) <= yesterday);
  const awaitingPayment = bookings.filter((b) => b.status === BOOKING_STATUS.accepted);
  const upcoming = bookings.filter((b) => b.status === BOOKING_STATUS.paid && b.end_date >= today);
  const paidThisMonth = bookings.filter(
    (b) => b.status === BOOKING_STATUS.paid && (b.date_created ?? "").slice(0, 7) === today.slice(0, 7)
  );
  const revenueThisMonth = paidThisMonth.reduce((n, b) => n + (Number(b.total) || 0), 0);
  const duePayouts = payouts.filter((p) => p.end_date < today);
  const newApplications = applications?.filter((a) => a.status === "new") ?? [];

  const stats = [
    { label: "Need vendor response", value: pending.length, href: "/admin/bookings?tab=pending" },
    { label: "Awaiting payment", value: awaitingPayment.length, href: "/admin/bookings?tab=accepted" },
    { label: "Upcoming bookings", value: upcoming.length, href: "/admin/bookings?tab=booked" },
    { label: "Booked this month", value: formatMoney(revenueThisMonth), href: "/admin/bookings?tab=booked" },
    { label: "Payouts scheduled", value: formatMoney(payouts.reduce((n, p) => n + (Number(p.payout_amount) || 0), 0)) },
    { label: "New applications", value: applications ? newApplications.length : "—", href: "/admin/applications" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-xs text-neutral-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-4 transition-colors hover:border-neutral-400">{body}</Link>
          ) : (
            <div key={s.label} className="card p-4">{body}</div>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">Needs attention</h2>
        {slow.length === 0 && duePayouts.length === 0 && newApplications.length === 0 ? (
          <p className="card px-4 py-6 text-sm text-neutral-500">Nothing right now.</p>
        ) : (
          <ul className="card divide-y divide-neutral-200">
            {slow.map((b) => (
              <Attention
                key={`slow-${b.id}`}
                href={`/admin/bookings?tab=pending`}
                text={`${b.prop_id?.user_created?.shop_name ?? "A vendor"} hasn't answered ${b.customer_name}'s request for ${b.item_name}`}
                meta={`Requested ${formatDate(businessDate(b.date_created ?? new Date()))} · pickup ${formatDate(b.start_date)}`}
              />
            ))}
            {duePayouts.map((p) => (
              <Attention
                key={`payout-${p.id}`}
                href="/admin/vendors"
                text={`Payout of ${formatMoney(p.payout_amount)} to ${p.prop_id?.user_created?.shop_name ?? "a vendor"} is waiting`}
                meta={`${p.prop_id?.name ?? "Rental"} returned ${formatDate(p.end_date)}. Usually means their Stripe account isn't ready.`}
              />
            ))}
            {newApplications.map((a) => (
              <Attention
                key={`app-${a.id}`}
                href="/admin/applications"
                text={`New vendor application: ${a.shop_name}`}
                meta={[a.city, a.state].filter(Boolean).join(", ")}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Attention({ href, text, meta }: { href: string; text: string; meta?: string }) {
  return (
    <li>
      <Link href={href} className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{text}</span>
          {meta && <span className="block text-xs text-neutral-500">{meta}</span>}
        </span>
      </Link>
    </li>
  );
}
