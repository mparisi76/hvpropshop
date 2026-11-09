import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readMe, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { Vendor } from "@/types";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProfileForm from "./ProfileForm";
import { getInventoryTypeField } from "@/lib/vendors";
import PayoutsSection from "@/components/dashboard/PayoutsSection";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ payouts?: string; welcome?: string }>;
}) {
  const { payouts: payoutsNotice, welcome } = await searchParams;
  const token = (await cookies()).get("directus_token")?.value;
  if (!token) redirect("/login");

  let user: Vendor;
  try {
    user = (await directus.request(
      withToken(
        token,
        readMe({
          fields: [
            "id",
            "shop_name",
            "city",
            "state",
            "website",
            "inventory_type",
            "featured_vendor",
            "shop_logo",
          ],
        })
      )
    )) as unknown as Vendor;
  } catch (error) {
    console.error("Profile load error:", error);
    redirect("/login");
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
