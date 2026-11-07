import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { getDropdownField } from "@/lib/fields";
import { getCategoryGroups, getOwnListing, getStatusChoices } from "@/lib/listings";
import { htmlToText } from "@/lib/listingText";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/currentUser";
import ListingForm from "@/components/dashboard/ListingForm";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get("directus_token")?.value;
  if (!token) redirect("/login");

  if (!(await getCurrentUser())) redirect("/login");

  const [listing, categories, conditionField, statusChoices] = await Promise.all([
    getOwnListing(token, id),
    getCategoryGroups(),
    getDropdownField("props", "condition", token),
    getStatusChoices(token),
  ]);
  if (!listing) notFound();

  const categoryId =
    listing.category == null
      ? ""
      : typeof listing.category === "object"
        ? String(listing.category.id)
        : String(listing.category);

  // Main photo first, then gallery (skipping duplicates)
  const photoIds = [
    ...new Set(
      [listing.thumbnail, ...(listing.photo_gallery ?? []).map((g) => g.directus_files_id)].filter(
        (x): x is string => Boolean(x)
      )
    ),
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page max-w-3xl! py-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-neutral-500">
          <Link href="/dashboard" className="hover:text-neutral-900">
            Listings
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="truncate text-neutral-900">{listing.name}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
          {listing.status === "published" && (
            <Link
              href={`/props/${listing.id}`}
              target="_blank"
              className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
            >
              View live listing <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
        </div>

        <ListingForm
          mode="edit"
          listingId={String(listing.id)}
          initial={{
            name: listing.name ?? "",
            price: listing.price,
            quantity_available: listing.quantity_available,
            category: categoryId,
            condition: listing.condition ?? "",
            dimensions: listing.dimensions ?? "",
            description: listing.description ? htmlToText(listing.description) : "",
            status: listing.status ?? "draft",
            photoIds,
          }}
          categories={categories}
          conditionChoices={conditionField?.choices ?? []}
          statusChoices={statusChoices}
        />
      </main>
    </div>
  );
}
