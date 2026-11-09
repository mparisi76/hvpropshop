import Logo from "@/components/Logo";
import AccountMenu from "@/components/AccountMenu";
import HeaderNavLink from "@/components/HeaderNavLink";
import { toMenuUser } from "@/lib/currentUser";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Admin | HV Prop Shop", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white">
        <div className="container-page flex h-16 items-center gap-4 sm:gap-6">
          <Logo variant="dark" compact />
          <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            Admin
          </span>
          <nav aria-label="Admin" className="flex items-center gap-4 overflow-x-auto no-scrollbar sm:gap-5">
            <HeaderNavLink href="/admin">Overview</HeaderNavLink>
            <HeaderNavLink href="/admin/bookings">Bookings</HeaderNavLink>
            <HeaderNavLink href="/admin/vendors">Vendors</HeaderNavLink>
            <HeaderNavLink href="/admin/applications">Applications</HeaderNavLink>
          </nav>
          <div className="ml-auto">
            <AccountMenu user={toMenuUser(user)} />
          </div>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
