import Link from "next/link";
import { Plus } from "lucide-react";

/** Header shortcut to create a listing (shown to logged-in vendors). */
export default function NewListingButton() {
  return (
    <Link
      href="/dashboard/new"
      aria-label="New listing"
      className="btn-primary h-9! gap-1.5! px-2.5! sm:px-3!"
    >
      <Plus className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">New listing</span>
    </Link>
  );
}
