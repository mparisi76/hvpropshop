'use client';
import Link from 'next/link';

interface BreadcrumbProps {
  parent?: { name: string; slug: string };
  current?: { name: string; slug: string };
  search?: string;
}

const Separator = () => (
  <svg className="text-slate-300 mx-1 shrink-0" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m9 18 6-6-6-6"/></svg>
);

export default function Breadcrumbs({ parent, current, search }: BreadcrumbProps) {
  // If no data, return null so ZERO space is taken
  if (!current && !search) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-[10px] uppercase tracking-[0.2em] font-bold">
      <Link href="/" className="text-slate-400 hover:text-blue-600 transition-colors">Vault</Link>
      
      {parent && (
        <>
          <Separator />
          <Link href={`/?category=${parent.slug}`} className="text-slate-400 hover:text-blue-600 transition-colors">{parent.name}</Link>
        </>
      )}

      {current && (
        <>
          <Separator />
          <span className="text-slate-900">{current.name}</span>
        </>
      )}
    </nav>
  );
}