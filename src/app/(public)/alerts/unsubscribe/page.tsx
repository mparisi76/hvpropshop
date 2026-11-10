import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribeSearchAlert } from "@/lib/searchAlerts";

export const metadata: Metadata = { title: "Alert cancelled | HV Prop Shop", robots: { index: false } };

export default async function UnsubscribeAlert({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams;
  const ok = await unsubscribeSearchAlert(t).catch(() => false);

  return (
    <div className="container-page max-w-md! py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{ok ? "Alert cancelled" : "Link not valid"}</h1>
      <p className="mt-2 text-neutral-600">
        {ok
          ? "You won't get any more emails for this search."
          : "This alert may already be cancelled or finished. You won't get emails for it."}
      </p>
      <Link href="/" className="btn-primary mt-6">Browse inventory</Link>
    </div>
  );
}
