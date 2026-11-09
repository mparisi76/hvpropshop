import {
  deleteFiles,
  deleteItems,
  deleteUser,
  readFiles,
  readItems,
  readUser,
  updateItems,
} from "@directus/sdk";
import { asAdmin, VENDOR_ROLE_NAME } from "@/lib/admin";
import { BOOKING_STATUS, todayIso } from "@/lib/bookings";
import { stripe } from "@/lib/payments";

/** Everything stored for one vendor, plus anything that must be resolved before deleting. */
export interface VendorFootprint {
  user: {
    id: string;
    email: string | null;
    name: string;
    role: string | null;
    stripe_account_id: string | null;
  };
  propIds: string[];
  fileIds: string[];
  inquiryIds: (string | number)[];
  rentalIds: (string | number)[];
  applicationIds: (string | number)[];
  counts: { listings: number; photos: number; bookings: number; blocks: number; applications: number };
  /** Reasons deletion is blocked (open requests, upcoming bookings, money owed) */
  blockers: string[];
}

type RawUser = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  shop_name: string | null;
  avatar: string | null;
  shop_logo: string | null;
  stripe_account_id: string | null;
  role: { name: string | null } | null;
};

export async function getVendorFootprint(vendorId: string, token?: string): Promise<VendorFootprint> {
  const user = await asAdmin<RawUser>(
    readUser(vendorId, {
      fields: ["id", "email", "first_name", "last_name", "shop_name", "avatar", "shop_logo", "stripe_account_id", { role: ["name"] }],
    }),
    token
  );

  const props = await asAdmin<{ id: string | number; thumbnail: string | null; photo_gallery: { directus_files_id: string | null }[] | null }[]>(
    readItems("props", {
      fields: ["id", "thumbnail", { photo_gallery: ["directus_files_id"] }],
      filter: { user_created: { _eq: vendorId } },
      limit: -1,
    }),
    token
  );
  const propIds = props.map((p) => String(p.id));

  type InquiryRow = { id: string | number; status: string; end_date: string };
  type RentalRow = { id: string | number; kind: string | null; payout_status: string | null; end_date: string | null };
  type ApplicationRow = { id: string | number; email: string };

  const [inquiries, rentals, uploads, applications] = await Promise.all([
    propIds.length
      ? asAdmin<InquiryRow[]>(
          readItems("inquiries", { fields: ["id", "status", "end_date"], filter: { prop_id: { _in: propIds } }, limit: -1 }),
          token
        )
      : Promise.resolve([] as InquiryRow[]),
    propIds.length
      ? asAdmin<RentalRow[]>(
          readItems("rentals", {
            fields: ["id", "kind", "payout_status", "end_date"],
            filter: { prop_id: { _in: propIds } },
            limit: -1,
          }),
          token
        )
      : Promise.resolve([] as RentalRow[]),
    // Files they uploaded that aren't attached to anything (e.g. abandoned uploads)
    asAdmin<{ id: string }[]>(readFiles({ fields: ["id"], filter: { uploaded_by: { _eq: vendorId } }, limit: -1 }), token).catch(
      () => [] as { id: string }[]
    ),
    user.email
      ? asAdmin<ApplicationRow[]>(
          readItems("vendor_applications", {
            fields: ["id", "email"],
            filter: { email: { _icontains: user.email } },
            limit: 50,
          }),
          token
        )
          .then((rows) => rows.filter((r) => r.email?.toLowerCase() === user.email!.toLowerCase()))
          .catch(() => [] as ApplicationRow[])
      : Promise.resolve([] as ApplicationRow[]),
  ]);

  const fileIds = [
    ...new Set(
      [
        user.avatar,
        user.shop_logo,
        ...props.map((p) => p.thumbnail),
        ...props.flatMap((p) => (p.photo_gallery ?? []).map((g) => g.directus_files_id)),
        ...uploads.map((f) => f.id),
      ].filter((x): x is string => Boolean(x))
    ),
  ];

  // What must be resolved first
  const today = todayIso();
  const open = inquiries.filter(
    (i) =>
      i.status === BOOKING_STATUS.pending ||
      i.status === BOOKING_STATUS.accepted ||
      (i.status === BOOKING_STATUS.paid && i.end_date >= today)
  );
  const owed = rentals.filter((r) => r.payout_status === "pending");
  const blockers: string[] = [];
  if (open.length) {
    blockers.push(
      `${open.length} open ${open.length === 1 ? "request or booking" : "requests or bookings"}. Cancel ${
        open.length === 1 ? "it" : "them"
      } from Admin → Bookings first, so customers are refunded and told.`
    );
  }
  if (owed.length) {
    blockers.push(
      `${owed.length} ${owed.length === 1 ? "payout is" : "payouts are"} still owed to this vendor. Let ${
        owed.length === 1 ? "it" : "them"
      } go out, or set payout_status to "none" in Directus if you've settled another way.`
    );
  }

  const name =
    user.shop_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "This vendor";

  return {
    user: { id: user.id, email: user.email, name, role: user.role?.name ?? null, stripe_account_id: user.stripe_account_id },
    propIds,
    fileIds,
    inquiryIds: inquiries.map((i) => i.id),
    rentalIds: rentals.map((r) => r.id),
    applicationIds: applications.map((a) => a.id),
    counts: {
      listings: props.length,
      photos: fileIds.length,
      bookings: inquiries.length,
      blocks: rentals.filter((r) => r.kind === "block").length,
      applications: applications.length,
    },
    blockers,
  };
}

/** Is this a vendor account (not an admin or another role)? */
export function isVendorAccount(f: VendorFootprint) {
  return (f.user.role ?? "").toLowerCase() === VENDOR_ROLE_NAME.toLowerCase();
}

/**
 * Permanently delete a vendor and everything attached to them. Order matters:
 * records that point at listings go first, then listings, then the account,
 * then the files (once nothing references them), then their Stripe account.
 */
export async function deleteVendorEverything(f: VendorFootprint, token: string) {
  const warnings: string[] = [];
  const step = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (error) {
      console.error(`[delete-vendor] ${label} failed:`, error);
      throw new Error(`Stopped while deleting ${label}. Some data may already be removed; try again to finish.`);
    }
  };

  if (f.inquiryIds.length) await step("booking requests", () => asAdmin(deleteItems("inquiries", f.inquiryIds.map(String)), token));
  if (f.rentalIds.length) await step("bookings and blocks", () => asAdmin(deleteItems("rentals", f.rentalIds.map(String)), token));
  if (f.propIds.length) {
    // Detach gallery photos first so junction rows can't block deleting the listings
    await asAdmin(updateItems("props", f.propIds, { photo_gallery: [] }), token).catch((error) =>
      console.warn("[delete-vendor] Couldn't detach galleries (continuing):", error)
    );
    await step("listings", () => asAdmin(deleteItems("props", f.propIds), token));
  }
  if (f.applicationIds.length) {
    await asAdmin(deleteItems("vendor_applications", f.applicationIds.map(String)), token).catch((error) => {
      console.warn("[delete-vendor] Couldn't delete applications:", error);
      warnings.push("Their application couldn't be deleted; remove it in Directus.");
    });
  }
  await step("the account", () => asAdmin(deleteUser(f.user.id), token));

  if (f.fileIds.length) {
    await asAdmin(deleteFiles(f.fileIds), token).catch((error) => {
      console.warn("[delete-vendor] Couldn't delete some files:", error);
      warnings.push("Some photos couldn't be deleted; you can remove them in Directus → File Library.");
    });
  }

  if (f.user.stripe_account_id) {
    await stripe.accounts.del(f.user.stripe_account_id).catch((error) => {
      console.warn("[delete-vendor] Couldn't delete Stripe account:", error);
      warnings.push(
        "Their Stripe account couldn't be removed (Stripe only allows it once the balance is zero). You can reject it in Stripe → Connect."
      );
    });
  }

  return { warnings };
}
