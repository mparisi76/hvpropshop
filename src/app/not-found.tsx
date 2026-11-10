import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata: Metadata = { title: "Page not found | HV Prop Shop", robots: { index: false } };

// URLs that don't match any page
export default function NotFound() {
  return (
    <>
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo variant="dark" />
          <Link href="/" className="btn-ghost">Browse inventory</Link>
        </div>
      </header>
      <main className="grow">
        <NotFoundContent />
      </main>
    </>
  );
}
