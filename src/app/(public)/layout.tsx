import Link from "next/link";
import { Suspense } from "react";
import SearchInput from "@/components/SearchInput";
import Logo from "@/components/Logo";
import PullListNavLink from "@/components/PullListNavLink";
import { CONTACT_EMAIL } from "@/lib/site";
import AccountMenu from "@/components/AccountMenu";
import NewListingButton from "@/components/NewListingButton";
import { getCurrentUser, toMenuUser } from "@/lib/currentUser";

const searchFallback = (
  <div className="h-10 w-full rounded-md bg-neutral-100" />
);

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white print:hidden">
        <div className="container-page flex h-16 items-center gap-4 md:gap-6">
          <Logo variant="dark" />

          <div className="hidden flex-1 md:block md:max-w-xl">
            <Suspense fallback={searchFallback}>
              <SearchInput />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <PullListNavLink />
            {user && <NewListingButton />}
            {user ? (
              <AccountMenu user={toMenuUser(user)} />
            ) : (
              <Link
                href="/login"
                className="px-1 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
              >
                Vendor login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search row */}
        <div className="container-page pb-3 md:hidden">
          <Suspense fallback={searchFallback}>
            <SearchInput />
          </Suspense>
        </div>
      </header>

      <main className="grow">{children}</main>

      <footer className="mt-16 border-t border-neutral-200 bg-neutral-50 print:hidden">
        <div className="container-page grid gap-8 py-10 text-sm sm:grid-cols-3">
          <div className="space-y-2">
            <Logo variant="dark" />
            <p className="max-w-xs text-neutral-600">
              Props and set dressing from independent vendors, Hudson Valley to
              New York City.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-neutral-900">For productions</p>
            <ul className="space-y-1.5 text-neutral-600">
              <li>
                <Link href="/" className="hover:text-neutral-900">
                  Browse inventory
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="hover:text-neutral-900">
                  Vendor directory
                </Link>
              </li>
              <li>
                <Link href="/list" className="hover:text-neutral-900">
                  Your pull list
                </Link>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-neutral-900">
                  Contact us
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-neutral-900">For vendors</p>
            <ul className="space-y-1.5 text-neutral-600">
              <li>
                <Link href="/login" className="hover:text-neutral-900">
                  Vendor login
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=List%20my%20inventory`}
                  className="hover:text-neutral-900"
                >
                  List your inventory
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200">
          <div className="container-page flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 text-xs text-neutral-500">
            <p>© {new Date().getFullYear()} HV Prop Shop</p>
            <nav aria-label="Policies" className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/policies" className="hover:text-neutral-900">Rental policies</Link>
              <Link href="/terms" className="hover:text-neutral-900">Terms</Link>
              <Link href="/privacy" className="hover:text-neutral-900">Privacy</Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
