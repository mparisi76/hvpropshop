/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Link2, Mail, MapPin, Printer, Trash2, X } from "lucide-react";
import { Prop } from "@/types";
import { pullList, usePullList } from "@/lib/pullList";
import RequestButton from "@/components/request/RequestButton";

const noopSubscribe = () => () => {};

interface VendorGroup {
  key: string;
  vendorId?: string;
  vendor: string;
  location: string;
  items: Prop[];
}

function groupByVendor(items: Prop[]): VendorGroup[] {
  const groups = new Map<string, VendorGroup>();
  for (const item of items) {
    const vendor =
      item.user_created?.shop_name || item.user_created?.first_name || "Independent vendor";
    const location = [item.user_created?.city, item.user_created?.state]
      .filter(Boolean)
      .join(", ");
    const key = `${vendor}|${location}`;
    if (!groups.has(key))
      groups.set(key, { key, vendorId: item.user_created?.id, vendor, location, items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()].sort((a, b) => a.vendor.localeCompare(b.vendor));
}

const formatDate = (d: string) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";

export default function PullListView() {
  const router = useRouter();
  const params = useSearchParams();
  const mine = usePullList();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // A list is "shared" when it arrives via ?ids= in the URL
  const sharedParam = params.get("ids");
  const isShared = sharedParam !== null;
  const list = sharedParam !== null
    ? {
        name: params.get("name") ?? "",
        prepDate: params.get("prep") ?? "",
        wrapDate: params.get("wrap") ?? "",
        ids: sharedParam.split(",").filter(Boolean),
      }
    : mine;

  const key = list.ids.join(",");
  const [result, setResult] = useState<{ key: string; items: Prop[]; failed?: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!hydrated || !key) return;
    let cancelled = false;
    fetch(`/api/props/by-ids?ids=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setResult({ key, items: Array.isArray(data) ? data : [], failed: !Array.isArray(data) });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, items: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, key]);

  const loading = !hydrated || (key !== "" && result?.key !== key);

  // Keep the user's ordering; drop anything no longer published
  const byId = new Map((result && result.key === key ? result.items : []).map((i) => [String(i.id), i]));
  const items = list.ids.map((id) => byId.get(id)).filter((i): i is Prop => Boolean(i));
  const missingIds = loading || result?.failed ? [] : list.ids.filter((id) => !byId.has(id));
  const groups = groupByVendor(items);
  const dayRate = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

  const shareUrl = () => {
    const q = new URLSearchParams({ ids: list.ids.join(",") });
    if (list.name) q.set("name", list.name);
    if (list.prepDate) q.set("prep", list.prepDate);
    if (list.wrapDate) q.set("wrap", list.wrapDate);
    return `${window.location.origin}/list?${q.toString()}`;
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const saveShared = () => {
    pullList.add(list.ids);
    if (!mine.name && !mine.ids.length) {
      pullList.update({ name: list.name, prepDate: list.prepDate, wrapDate: list.wrapDate });
    }
    router.push("/list");
  };

  const clearAll = () => {
    if (window.confirm("Remove all items from your pull list?")) pullList.clear();
  };

  /* ---------- Render ---------- */

  return (
    <div className="container-page py-8">
      {isShared && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm print:hidden">
          <p className="text-neutral-700">You&apos;re viewing a pull list someone shared with you.</p>
          <div className="flex gap-2">
            <Link href="/list" className="btn-ghost">
              View my list
            </Link>
            <button onClick={saveShared} className="btn-primary" disabled={!list.ids.length}>
              Save to my list
            </button>
          </div>
        </div>
      )}

      {/* Title + details */}
      <div className="flex flex-col gap-6 border-b border-neutral-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Pull list</p>
          {isShared ? (
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {list.name || "Untitled pull list"}
            </h1>
          ) : (
            <>
              <label htmlFor="list-name" className="sr-only">List name</label>
              <input
                id="list-name"
                value={mine.name}
                onChange={(e) => pullList.update({ name: e.target.value })}
                placeholder="Name this list (production, set, episode…)"
                className="mt-1 w-full max-w-xl rounded-md border border-transparent bg-transparent px-0 text-2xl font-semibold tracking-tight placeholder:text-neutral-300 hover:border-neutral-200 hover:px-2 focus:border-neutral-900 focus:px-2 focus:outline-none print:hidden"
              />
              <h1 className="mt-1 hidden text-2xl font-semibold tracking-tight print:block">
                {mine.name || "Untitled pull list"}
              </h1>
            </>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            {isShared ? (
              (list.prepDate || list.wrapDate) && (
                <p className="text-neutral-600">
                  {formatDate(list.prepDate) || "—"} → {formatDate(list.wrapDate) || "—"}
                </p>
              )
            ) : (
              <>
                <label className="flex items-center gap-2 print:hidden">
                  <span className="text-neutral-500">Prep</span>
                  <input
                    type="date"
                    value={mine.prepDate}
                    onChange={(e) => pullList.update({ prepDate: e.target.value })}
                    className="input w-auto! py-1!"
                  />
                </label>
                <label className="flex items-center gap-2 print:hidden">
                  <span className="text-neutral-500">Wrap</span>
                  <input
                    type="date"
                    value={mine.wrapDate}
                    min={mine.prepDate || undefined}
                    onChange={(e) => pullList.update({ wrapDate: e.target.value })}
                    className="input w-auto! py-1!"
                  />
                </label>
                {(mine.prepDate || mine.wrapDate) && (
                  <p className="hidden text-neutral-600 print:block">
                    {formatDate(mine.prepDate) || "—"} → {formatDate(mine.wrapDate) || "—"}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 print:hidden">
            <button onClick={copyShareLink} className="btn-secondary">
              {copied ? <Check className="h-4 w-4 text-accent" /> : <Link2 className="h-4 w-4" />}
              {copied ? "Link copied" : "Share link"}
            </button>
            <button onClick={() => window.print()} className="btn-secondary">
              <Printer className="h-4 w-4" /> Print / PDF
            </button>
            <RequestButton
              type="pull_list"
              itemIds={items.map((i) => String(i.id))}
              className="btn-accent"
              label={
                <>
                  <Mail className="h-4 w-4" /> Request availability
                </>
              }
              summary={
                <>
                  <p className="font-medium">{list.name || "Untitled pull list"}</p>
                  <p className="text-xs text-neutral-500">
                    {items.length} {items.length === 1 ? "item" : "items"} from {groups.length}{" "}
                    {groups.length === 1 ? "vendor" : "vendors"} · ${dayRate.toLocaleString()}/day combined
                  </p>
                </>
              }
              defaults={{
                production: list.name,
                start_date: list.prepDate,
                end_date: list.wrapDate,
              }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-neutral-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center px-6 py-16 text-center">
          <h2 className="text-base font-semibold">
            {result?.failed ? "Couldn't load this list" : "Your pull list is empty"}
          </h2>
          <p className="mt-1 max-w-sm text-sm text-neutral-600">
            {result?.failed
              ? "Something went wrong loading these items. Try refreshing the page."
              : "Tap the bookmark on any item to add it here. Then share the list with your team or send it to request availability."}
          </p>
          <Link href="/" className="btn-primary mt-6">
            Browse inventory
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600">
            <p>
              {items.length} {items.length === 1 ? "item" : "items"} · {groups.length}{" "}
              {groups.length === 1 ? "vendor" : "vendors"} ·{" "}
              <span className="tabular-nums text-neutral-900">${dayRate.toLocaleString()}</span>/day combined
            </p>
            {!isShared && (
              <button onClick={clearAll} className="btn-ghost text-neutral-500 print:hidden">
                <Trash2 className="h-4 w-4" /> Clear list
              </button>
            )}
          </div>

          {missingIds.length > 0 && !isShared && (
            <p className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 print:hidden">
              {missingIds.length} saved {missingIds.length === 1 ? "item is" : "items are"} no longer listed.
              <button onClick={() => pullList.remove(missingIds)} className="font-medium underline underline-offset-2">
                Remove
              </button>
            </p>
          )}

          <div className="mt-4 space-y-6">
            {groups.map((g) => (
              <section key={g.key} className="card overflow-hidden break-inside-avoid">
                <header className="flex items-center justify-between gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5">
                  {g.vendorId ? (
                    <Link href={`/vendors/${g.vendorId}`} className="text-sm font-medium hover:underline">
                      {g.vendor}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium">{g.vendor}</p>
                  )}
                  {g.location && (
                    <p className="flex items-center gap-1 text-xs text-neutral-500">
                      <MapPin className="h-3 w-3" aria-hidden /> {g.location}
                    </p>
                  )}
                </header>
                <ul className="divide-y divide-neutral-200">
                  {g.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 px-4 py-3">
                      <Link
                        href={`/props/${item.id}`}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100"
                      >
                        {item.thumbnail && (
                          <img
                            src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${item.thumbnail}?width=128&height=128&fit=cover&format=webp`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/props/${item.id}`} className="block truncate text-sm font-medium hover:underline">
                          {item.name}
                        </Link>
                        <p className="truncate text-xs text-neutral-500">
                          {item.category?.name}
                          {item.availability === "rented" && <> · On a job</>}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm tabular-nums">
                        ${Number(item.price || 0).toLocaleString()}
                        <span className="text-neutral-500">/day</span>
                      </p>
                      {!isShared && (
                        <button
                          onClick={() => pullList.remove([String(item.id)])}
                          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 print:hidden"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {!isShared && (
            <p className="mt-6 text-xs text-neutral-500 print:hidden">
              Your pull list is saved in this browser. Use <span className="font-medium">Share link</span> to
              open it on another device or send it to your team.
            </p>
          )}
        </>
      )}
    </div>
  );
}
