import Link from "next/link";

export const LEGAL_PAGES = [
  { href: "/policies", label: "Rental policies" },
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
];

/** Shared layout for policy/legal pages: title, last-updated date, sections, cross-links. */
export default function LegalPage({
  title,
  intro,
  updated,
  current,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  updated: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl! py-10">
      <nav aria-label="Policies" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {LEGAL_PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            aria-current={p.href === current ? "page" : undefined}
            className={p.href === current ? "font-medium text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated {updated}</p>
      {intro && <div className="mt-4 text-neutral-700">{intro}</div>}

      <div className="mt-8 space-y-10 text-[15px] leading-relaxed text-neutral-700 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-neutral-900 [&_li]:mt-1 [&_p+p]:mt-3 [&_strong]:text-neutral-900 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
