import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readMe, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { Vendor } from "@/types";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProfileForm from "./ProfileForm";
import { getInventoryTypeField } from "@/lib/vendors";

export default async function ProfilePage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Shop profile</h1>
        <p className="mt-1 text-sm text-neutral-600">
          This is what productions see on your public vendor page and on every item you list.
        </p>

        <ProfileForm user={user} inventoryField={inventoryField} />
      </main>
    </div>
  );
}
