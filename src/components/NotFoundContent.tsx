import Link from "next/link";
import { Suspense } from "react";
import SearchInput from "@/components/SearchInput";

/** Body of every "not found" page. */
export default function NotFoundContent({
  title = "We couldn't find that page",
  message = "It may have moved, or the item may no longer be listed.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="container-page max-w-xl! py-16 text-center">
      <p className="text-sm font-semibold text-neutral-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-2 text-neutral-600">{message}</p>

      <div className="mx-auto mt-8 max-w-md text-left">
        <Suspense fallback={<div className="h-10 rounded-md bg-neutral-100" />}>
          <SearchInput />
        </Suspense>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-primary">Browse inventory</Link>
        <Link href="/vendors" className="btn-secondary">Vendors</Link>
        <Link href="/contact" className="btn-ghost">Contact us</Link>
      </div>
    </div>
  );
}
