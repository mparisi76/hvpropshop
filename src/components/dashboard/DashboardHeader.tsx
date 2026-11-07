import Logo from "@/components/Logo";
import AccountMenu from "@/components/AccountMenu";
import HeaderNavLink from "@/components/HeaderNavLink";
import NewListingButton from "@/components/NewListingButton";
import { getCurrentUser, toMenuUser } from "@/lib/currentUser";
import { getPendingCount } from "@/lib/bookings";

/**
 * Dashboard header: logo (back to the public site), section tabs, account menu.
 * Account settings live in the account menu ("Settings").
 */
export default async function DashboardHeader() {
  const user = await getCurrentUser();
  const pendingRequests = user ? await getPendingCount(user.id) : 0;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
      <div className="container-page flex h-16 items-center gap-4 sm:gap-6">
        <Logo variant="dark" compact />

        <nav aria-label="Dashboard" className="flex items-center gap-4 sm:gap-5">
          <HeaderNavLink href="/dashboard" prefixes={["/dashboard/new", "/dashboard/edit/"]}>
            Listings
          </HeaderNavLink>
          <HeaderNavLink href="/dashboard/requests">
            Requests
            {pendingRequests > 0 && (
              <span
                className="ml-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold tabular-nums text-white"
                aria-label={`${pendingRequests} waiting`}
              >
                {pendingRequests}
              </span>
            )}
          </HeaderNavLink>
          <HeaderNavLink href="/dashboard/profile">Shop</HeaderNavLink>
        </nav>

        {user && (
          <div className="ml-auto flex items-center gap-2">
            <NewListingButton />
            <AccountMenu user={toMenuUser(user)} />
          </div>
        )}
      </div>
    </header>
  );
}
