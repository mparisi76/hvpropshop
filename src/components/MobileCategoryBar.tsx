"use client";

import Link from "next/link";
import { CategoryTree } from "@/types";
import { categoryHref } from "@/lib/browse";
import { usePendingCategory } from "@/components/browse/usePendingCategory";

interface MobileCategoryBarProps {
  tree: CategoryTree;
  selectedSlug?: string;
  /** Query params (e.g. loc, sort) to carry over when switching category */
  keepQuery?: string;
}

const chip = (active: boolean) =>
  `whitespace-nowrap rounded-md border px-3 py-1.5 text-sm transition-colors ${
    active
      ? "border-neutral-900 bg-neutral-900 text-white"
      : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
  }`;

export default function MobileCategoryBar({
  tree,
  selectedSlug,
  keepQuery = "",
}: MobileCategoryBarProps) {
  const sortedParents = Object.values(tree).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const { activeSlug, select } = usePendingCategory(selectedSlug);

  return (
    <div className="-mx-4 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
      <div className="flex items-center gap-2">
        <Link
          href="/vendors"
          className="whitespace-nowrap rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:border-neutral-400"
        >
          Vendors
        </Link>
        <span className="mx-1 h-5 w-px shrink-0 bg-neutral-200" aria-hidden />
        <Link href={categoryHref(keepQuery)} onClick={() => select(undefined)} className={chip(!activeSlug)}>
          All
        </Link>
        {sortedParents.map((parent) => {
          const isActive =
            activeSlug === parent.slug ||
            Object.values(parent.children).some((c) => c.slug === activeSlug);
          return (
            <Link
              key={parent.slug}
              href={categoryHref(keepQuery, parent.slug)}
              onClick={() => select(parent.slug)}
              className={chip(isActive)}
            >
              {parent.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
