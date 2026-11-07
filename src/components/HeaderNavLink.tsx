"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Text link for the header bar, underlined when it's the current section.
 * Active when the path equals `href`, or starts with any of `prefixes`.
 */
export default function HeaderNavLink({
  href,
  prefixes = [],
  className = "",
  children,
}: {
  href: string;
  prefixes?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || prefixes.some((p) => pathname.startsWith(p));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex h-16 items-center px-1 text-sm font-medium transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full ${
        active
          ? "text-neutral-900 after:bg-neutral-900"
          : "text-neutral-500 after:bg-transparent hover:text-neutral-900"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
