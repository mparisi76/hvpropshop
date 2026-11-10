import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readMe, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { Vendor } from "@/types";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProfileForm from "./ProfileForm";
import { getInventoryTypeField } from "@/lib/vendors";
import PayoutsSection from "@/components/dashboard/PayoutsSection";
import { reportError } from "@/lib/alerts";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ payouts?: string; welcome?: string }>;
}) {
  const { payouts: payoutsNotice, welcome } = await searchParams;
  const token = (await cookies()).get("directus_token")?.value;
  if (!token) redirect("/login");

  const fields = ["id", "shop_name", "city", "state", "website", "inventory_type", "featured_vendor", "shop_logo"];

  let user: Vendor;
  try {
    user = (await directus.request(withToken(token, readMe({ fields })))) as unknown as Vendor;
  } catch (error) {
    await reportError("Shop page: couldn't load the vendor's profile", error, { fields: fields.join(", ") });
    redirect("/login");
  }

  // Directus leaves out fields this account isn't allowed to read (they come back
  // missing, not empty). Say so instead of silently showing blank fields.
  const unreadable = fields.filter((f) => !(f in (user as object)));
  if (unreadable.length) {
    await reportError("Shop page: vendor can't read their own profile fields", new Error(unreadable.join(", ")), {
      user: user.id,
      note: "Add these fields to Read on directus_users in the policy attached to this user's role.",
    });
  }

  const inventoryField = await getInventoryTypeField(token);

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page max-w-2xl! py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your payouts, and what productions see on your vendor page and on every item you list.
        </p>

        {unreadable.length > 0 && (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p className="font-medium">Some of your shop details couldn&apos;t be loaded.</p>
            <p className="mt-1">
              Your account isn&apos;t allowed to read: <span className="font-mono">{unreadable.join(", ")}</span>. HV
              Prop Shop has been notified.
            </p>
          </div>
        )}

        {welcome && (
          <div className="mt-6 rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm">
            <p className="font-medium">Welcome to HV Prop Shop!</p>
            <p className="mt-1 text-neutral-600">
              Three steps to get going: connect Stripe below so you can accept bookings, fill in your shop details,
              then add your first listing.
            </p>
          </div>
        )}

        {user.id && <PayoutsSection vendorId={String(user.id)} notice={payoutsNotice} />}

        <ProfileForm user={user} inventoryField={inventoryField} />
      </main>
    </div>
  );
}
