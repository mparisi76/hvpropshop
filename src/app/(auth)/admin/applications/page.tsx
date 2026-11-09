import Link from "next/link";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { getApplications } from "@/lib/admin";
import { formatDate } from "@/lib/bookings";
import { vendorWebsite } from "@/lib/vendors";
import ApplicationActions from "./ApplicationActions";

const TABS = [
  { key: "new", label: "New" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Declined" },
] as const;

export default async function AdminApplications({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const applications = await getApplications();
  const requested = (await searchParams).tab;
  const tab = TABS.some((t) => t.key === requested) ? requested! : "new";

  if (applications === null) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The <code>vendor_applications</code> collection doesn&apos;t exist yet (or your account can&apos;t read it).
          Applications are still emailed to you in the meantime.
        </p>
      </div>
    );
  }

  const rows = applications.filter((a) => (a.status || "new") === tab);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>

      <nav className="mt-6 flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/applications?tab=${t.key}`}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium ${
              t.key === tab ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {t.label}
            <span className="rounded-full bg-neutral-100 px-1.5 text-xs tabular-nums text-neutral-600">
              {applications.filter((a) => (a.status || "new") === t.key).length}
            </span>
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">Nothing here.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((a) => {
            const site = vendorWebsite(a.website);
            return (
              <li key={a.id} className="card space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.shop_name}</p>
                    <p className="text-sm text-neutral-600">
                      {a.name}
                      {(a.city || a.state) && <> · {[a.city, a.state].filter(Boolean).join(", ")}</>}
                      {a.item_count && <> · {a.item_count} items</>}
                    </p>
                  </div>
                  {a.date_created && <p className="text-xs text-neutral-500">Applied {formatDate(a.date_created)}</p>}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                  <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-neutral-900">
                    <Mail className="h-3.5 w-3.5" aria-hidden /> {a.email}
                  </a>
                  {a.phone && (
                    <a href={`tel:${a.phone}`} className="flex items-center gap-1 hover:text-neutral-900">
                      <Phone className="h-3.5 w-3.5" aria-hidden /> {a.phone}
                    </a>
                  )}
                  {site && (
                    <a href={site.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-neutral-900">
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden /> {site.label}
                    </a>
                  )}
                </div>

                {a.inventory && (
                  <p className="whitespace-pre-wrap text-sm text-neutral-800">
                    <span className="font-medium">Rents: </span>
                    {a.inventory}
                  </p>
                )}
                {a.message && <p className="whitespace-pre-wrap text-sm text-neutral-600">{a.message}</p>}

                {tab === "new" && <ApplicationActions id={String(a.id)} name={a.name} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
