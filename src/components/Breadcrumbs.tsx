import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { categoryPath } from "@/lib/browse";

interface BreadcrumbProps {
  parent?: { name: string; slug: string };
  current?: { name: string; slug: string };
  /** Accepted for API compatibility; search is shown in the page heading. */
  search?: string;
  /** Render the current category as a link (e.g. on a prop detail page). */
  linkCurrent?: boolean;
}

const Sep = () => (
  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
);

export default function Breadcrumbs({ parent, current, linkCurrent }: BreadcrumbProps) {
  if (!current) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-neutral-500">
      <Link href="/" className="hover:text-neutral-900">
        All inventory
      </Link>
      {parent && (
        <>
          <Sep />
          <Link href={categoryPath(parent.slug)} className="hover:text-neutral-900">
            {parent.name}
          </Link>
        </>
      )}
      <Sep />
      {linkCurrent ? (
        <Link href={categoryPath(current.slug)} className="hover:text-neutral-900">
          {current.name}
        </Link>
      ) : (
        <span className="text-neutral-900" aria-current="page">
          {current.name}
        </span>
      )}
    </nav>
  );
}
