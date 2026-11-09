"use server";

import { revalidatePath } from "next/cache";
import { inviteUser, readItem, readUsers, updateItem, updateUser } from "@directus/sdk";
import { Resend } from "resend";
import { getActionToken } from "@/lib/actionSession";
import { getCurrentUser, isAdmin } from "@/lib/currentUser";
import { asAdmin, getVendorRoleId, type VendorApplication } from "@/lib/admin";
import { getBooking } from "@/lib/bookings";
import { cancelBooking } from "@/lib/cancellations";
import { getSiteUrl } from "@/lib/baseUrl";
import { vendorWebsite } from "@/lib/vendors";
import { CONTACT_EMAIL } from "@/lib/site";
import { deleteVendorEverything, getVendorFootprint, isVendorAccount } from "@/lib/vendorDeletion";

type Result = { error?: string; message?: string };

const resend = new Resend(process.env.RESEND_API_KEY);

async function requireAdminToken() {
  const token = await getActionToken();
  if (!isAdmin(await getCurrentUser())) throw new Error("Not an admin");
  return token;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function directusError(error: unknown) {
  const first = (error as { errors?: { message?: string; extensions?: { code?: string } }[] })?.errors?.[0];
  return first?.message ?? (error as Error)?.message ?? "Unknown error";
}

/* ---------- Bookings ---------- */

export async function adminCancelBooking(id: string, reason: string): Promise<Result> {
  try {
    await requireAdminToken();
    const booking = await getBooking(id);
    if (!booking) return { error: "Booking not found." };
    const result = await cancelBooking(booking, "admin", reason);
    if (result.error) return { error: result.error };
    revalidatePath("/admin", "layout");
    return { message: result.refunded ? `Cancelled and refunded $${result.refunded}.` : "Cancelled." };
  } catch (error) {
    console.error("[admin] Cancel failed:", error);
    return { error: "Couldn't cancel the booking." };
  }
}

/* ---------- Vendors ---------- */

export async function setFeatured(userId: string, featured: boolean): Promise<Result> {
  try {
    const token = await requireAdminToken();
    await asAdmin(
      updateUser(userId, { featured_vendor: featured } as unknown as Parameters<typeof updateUser>[1]),
      token
    );
    revalidatePath("/admin/vendors");
    revalidatePath("/vendors", "layout");
    return {};
  } catch (error) {
    console.error("[admin] Feature toggle failed:", error);
    return { error: "Couldn't update the vendor." };
  }
}

/* ---------- Applications ---------- */

export async function approveApplication(id: string): Promise<Result> {
  let token: string;
  try {
    token = await requireAdminToken();
  } catch {
    return { error: "Not allowed." };
  }

  let app: VendorApplication;
  try {
    app = await asAdmin<VendorApplication>(readItem("vendor_applications", id), token);
  } catch {
    return { error: "Application not found." };
  }
  if (app.status === "approved") return { error: "Already approved." };

  const email = app.email.trim().toLowerCase();

  // 1. Never touch an existing account. Directus silently skips invites to
  //    active users, so check first and stop with a clear message.
  type ExistingUser = { id: string; email: string; status: string; shop_name: string | null; first_name: string | null };
  let existing: ExistingUser | undefined;
  try {
    // Case-insensitive match (older accounts may have capitals in their email)
    const candidates = await asAdmin<ExistingUser[]>(
      readUsers({
        fields: ["id", "email", "status", "shop_name", "first_name"],
        filter: { email: { _icontains: email } },
        limit: 20,
      }),
      token
    );
    existing = candidates.find((u) => u.email?.toLowerCase() === email);
  } catch (error) {
    console.error("[admin] Couldn't check for an existing user:", error);
    return { error: "Couldn't check whether this email already has an account. Nothing was changed." };
  }
  if (existing && existing.status !== "invited") {
    const who = existing.shop_name || existing.first_name || "an existing user";
    return {
      error: `${app.email} already belongs to ${who}. No invite was sent and nothing was changed. If they're the same person, they can log in with their existing account.`,
    };
  }

  // 2. Invite: Directus emails them a link to /accept-invite to choose a password.
  //    (For someone already invited but not yet signed up, this re-sends the invite.)
  try {
    const roleId = await getVendorRoleId(token);
    await asAdmin(inviteUser(email, roleId, `${await getSiteUrl()}/accept-invite`), token);
  } catch (error) {
    console.error("[admin] Invite failed:", error);
    const msg = directusError(error);
    return {
      error: /allow ?list|invite url/i.test(msg)
        ? "Directus rejected the invite link. Add https://hvpropshop.com/accept-invite to USER_INVITE_URL_ALLOW_LIST."
        : `Invite failed: ${msg}`,
    };
  }

  // 3. Pre-fill the profile, only on the invited (not yet signed up) account
  try {
    const invitedCandidates = await asAdmin<{ id: string; email: string }[]>(
      readUsers({
        fields: ["id", "email"],
        filter: { _and: [{ email: { _icontains: email } }, { status: { _eq: "invited" } }] },
        limit: 20,
      }),
      token
    );
    const invited = invitedCandidates.find((u) => u.email?.toLowerCase() === email);
    if (invited) {
      const [first, ...rest] = app.name.trim().split(/\s+/);
      await asAdmin(
        updateUser(invited.id, {
          first_name: first || null,
          last_name: rest.join(" ") || null,
          shop_name: app.shop_name,
          city: app.city,
          state: app.state,
          phone: app.phone,
          website: vendorWebsite(app.website)?.href ?? null,
        } as unknown as Parameters<typeof updateUser>[1]),
        token
      );
    } else {
      console.warn(`[admin] Invited ${email} but couldn't find the invited account to pre-fill`);
    }
  } catch (error) {
    console.warn("[admin] Couldn't pre-fill the new vendor's profile:", error);
  }

  await asAdmin(updateItem("vendor_applications", id, { status: "approved" }), token).catch(() => {});
  revalidatePath("/admin", "layout");
  return { message: existing ? `Invite re-sent to ${email}.` : `Invite sent to ${email}.` };
}

export async function declineApplication(id: string, reason: string): Promise<Result> {
  try {
    const token = await requireAdminToken();
    const app = await asAdmin<VendorApplication>(readItem("vendor_applications", id), token);
    await asAdmin(updateItem("vendor_applications", id, { status: "declined" }), token);

    const note = reason.trim().slice(0, 1000);
    const { error } = await resend.emails.send({
      from: "HV Prop Shop <onboarding@hvpropshop.com>",
      to: app.email,
      replyTo: CONTACT_EMAIL,
      subject: "Your HV Prop Shop application",
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.5;color:#171717;max-width:560px">
        <p>Hi ${esc(app.name.split(" ")[0])},</p>
        <p>Thanks for applying to list ${esc(app.shop_name)} on HV Prop Shop. We're not able to add you right now.</p>
        ${note ? `<p>${esc(note).replace(/\n/g, "<br>")}</p>` : ""}
        <p>You're welcome to reply with any questions.</p>
      </div>`,
    });
    if (error) console.error("[admin] Decline email failed:", error);

    revalidatePath("/admin", "layout");
    return {};
  } catch (error) {
    console.error("[admin] Decline failed:", error);
    return { error: "Couldn't decline the application." };
  }
}

/* ---------- Delete a vendor ---------- */

export async function deleteVendor(vendorId: string, confirmName: string): Promise<Result & { warnings?: string[] }> {
  let token: string;
  try {
    token = await requireAdminToken();
  } catch {
    return { error: "Not allowed." };
  }
  const me = await getCurrentUser();
  if (me?.id === vendorId) return { error: "You can't delete your own account here." };

  let footprint;
  try {
    footprint = await getVendorFootprint(vendorId, token);
  } catch (error) {
    console.error("[admin] Couldn't load vendor for deletion:", error);
    return { error: "Couldn't load this vendor." };
  }

  if (!isVendorAccount(footprint)) return { error: "Only vendor accounts can be deleted here." };
  if (footprint.blockers.length) return { error: "Resolve the items listed above before deleting." };
  if (confirmName.trim().toLowerCase() !== footprint.user.name.trim().toLowerCase()) {
    return { error: `Type "${footprint.user.name}" exactly to confirm.` };
  }

  try {
    const { warnings } = await deleteVendorEverything(footprint, token);
    console.info(`[admin] Deleted vendor ${vendorId} (${footprint.user.name}) by ${me?.email}`);
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { message: `${footprint.user.name} was deleted.`, warnings };
  } catch (error) {
    return { error: (error as Error).message || "Deletion failed." };
  }
}
