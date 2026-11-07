import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readMe, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { ACCESS_COOKIE } from "@/lib/session";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AccountForms, { type AccountUser } from "./AccountForms";
import { getCurrentUser, toMenuUser } from "@/lib/currentUser";

export default async function AccountPage() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect("/login");

  let user: AccountUser;
  try {
    user = (await directus.request(
      withToken(
        token,
        readMe({ fields: ["email", "first_name", "last_name", "phone", "shop_name"] })
      )
    )) as unknown as AccountUser;
  } catch (error) {
    console.error("Account load error:", error);
    redirect("/login");
  }

  const current = await getCurrentUser();
  if (!current) redirect("/login");

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page max-w-2xl! py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Your personal details and login. None of this is shown publicly.
        </p>

        <AccountForms user={user} avatar={toMenuUser(current)} />
      </main>
    </div>
  );
}
