import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getDropdownField } from "@/lib/fields";
import { getCategoryGroups, getStatusChoices } from "@/lib/listings";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/currentUser";
import ListingForm from "@/components/dashboard/ListingForm";

export default async function NewPropPage() {
  const token = (await cookies()).get("directus_token")?.value;
  if (!token) redirect("/login");

  if (!(await getCurrentUser())) redirect("/login");

  const [categories, conditionField, statusChoices] = await Promise.all([
    getCategoryGroups(),
    getDropdownField("props", "condition", token),
    getStatusChoices(token),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page max-w-3xl! py-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-neutral-500">
          <Link href="/dashboard" className="hover:text-neutral-900">
            Listings
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-neutral-900">New listing</span>
        </nav>

        <h1 className="text-2xl font-semibold tracking-tight">New listing</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Good photos and a clear description are what get items booked.
        </p>

        <ListingForm
          mode="create"
          categories={categories}
          conditionChoices={conditionField?.choices ?? []}
          statusChoices={statusChoices}
        />
      </main>
    </div>
  );
}
