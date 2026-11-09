"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Store } from "lucide-react";
import { CategoryTree } from "@/types";
import { categoryHref } from "@/lib/browse";
import { usePendingCategory } from "@/components/browse/usePendingCategory";

export default function CategorySidebar({
  tree,
  selectedSlug,
  keepQuery = "",
  vendorCount,
}: {
  tree: CategoryTree;
  selectedSlug?: string;
  /** Query params (e.g. loc, sort) to carry over when switching category */
  keepQuery?: string;
  vendorCount?: number;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const initialOpen: Record<string, boolean> = {};
      if (selectedSlug) {
        const parent = Object.values(tree).find(
          (p) =>
            p.slug === selectedSlug ||
            Object.values(p.children).some((c) => c.slug === selectedSlug)
        );
        if (parent) initialOpen[parent.slug] = true;
      }
      return initialOpen;
    }
  );

  const { activeSlug, isPending, select } = usePendingCategory(selectedSlug);

  const toggleSection = (slug: string) => {
    setOpenSections((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const sortedParents = Object.values(tree).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const totalAll = sortedParents.reduce((n, p) => n + p.totalCount, 0);

  const rowClass = (active: boolean) =>
    `flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
      active
        ? "bg-neutral-100 font-medium text-neutral-900"
        : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
    }`;

  return (
    <nav aria-label="Categories" aria-busy={isPending} className={`select-none transition-opacity ${isPending ? "opacity-70" : ""}`}>
      <div className="mb-6 border-b border-neutral-200 pb-4">
        <p className="eyebrow mb-2 px-2">Vendors</p>
        <Link
          href="/vendors"
          className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
        >
          <span className="flex items-center gap-2">
            <Store className="h-4 w-4 text-neutral-400" aria-hidden />
            Browse vendors
          </span>
          {vendorCount != null && (
            <span className="text-xs tabular-nums text-neutral-400">{vendorCount}</span>
          )}
        </Link>
      </div>

      <p className="eyebrow mb-2 px-2">Categories</p>

      <Link href={categoryHref(keepQuery)} onClick={() => select(undefined)} className={rowClass(!activeSlug)}>
        <span>All inventory</span>
        <span className="text-xs tabular-nums text-neutral-400">{totalAll}</span>
      </Link>

      <ul className="mt-1 space-y-0.5">
        {sortedParents.map((parent) => {
          const isOpen = openSections[parent.slug];
          const isActive = activeSlug === parent.slug;
          const hasChildren = Object.keys(parent.children).length > 0;
          const sortedChildren = Object.values(parent.children).sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          return (
            <li key={parent.slug}>
              <div className="flex items-center gap-0.5">
                <Link
                  href={categoryHref(keepQuery, parent.slug)}
                  onClick={() => {
                    select(parent.slug);
                    setOpenSections((prev) => ({ ...prev, [parent.slug]: true }));
                  }}
                  className={rowClass(isActive)}
                >
                  <span className="truncate">{parent.name}</span>
                  <span className="text-xs tabular-nums text-neutral-400">
                    {parent.totalCount}
                  </span>
                </Link>
                {hasChildren && (
                  <button
                    onClick={() => toggleSection(parent.slug)}
                    className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                    aria-label={`${isOpen ? "Collapse" : "Expand"} ${parent.name}`}
                    aria-expanded={!!isOpen}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <ul className="my-0.5 ml-3 space-y-0.5 border-l border-neutral-200 pl-2">
                  {sortedChildren.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={categoryHref(keepQuery, child.slug)}
                        onClick={() => select(child.slug)}
                        className={rowClass(activeSlug === child.slug)}
                      >
                        <span className="truncate">{child.name}</span>
                        <span className="text-xs tabular-nums text-neutral-400">
                          {child.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
