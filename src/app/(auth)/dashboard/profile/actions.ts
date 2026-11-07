"use server";

import { revalidatePath } from "next/cache";
import { deleteFile, readMe, uploadFiles, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { updateMeFields } from "@/lib/directusUser";
import { getActionToken } from "@/lib/actionSession";
import { vendorWebsite } from "@/lib/vendors";
import { Vendor } from "@/types";

/**
 * `values` echoes back what was submitted: React resets uncontrolled form
 * fields after an action, so the form uses these as its new defaults.
 */
export type ProfileState = {
  success?: boolean;
  error?: string;
  values?: Partial<Vendor>;
} | null;

const clean = (v: FormDataEntryValue | null, max = 200) =>
  String(v ?? "").trim().slice(0, max);

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const token = await getActionToken();

  const shopName = clean(formData.get("shop_name"), 120);
  const websiteInput = clean(formData.get("website"), 300);
  const website = websiteInput ? vendorWebsite(websiteInput) : null;

  // inventory_type is a Directus dropdown: a single value, or a list if the
  // field uses a multi-select interface (the form tells us which).
  const inventoryValues = formData
    .getAll("inventory_type")
    .flatMap((v) => String(v).split(","))
    .map((s) => s.trim().slice(0, 100))
    .filter(Boolean);
  const inventoryType =
    formData.get("inventory_type_format") === "array"
      ? inventoryValues
      : inventoryValues[0] ?? null;

  // Only these fields can be changed from here (featured_vendor is admin-only).
  const update: Partial<Vendor> = {
    shop_name: shopName,
    city: clean(formData.get("city"), 80) || null,
    state: clean(formData.get("state"), 2).toUpperCase() || null,
    website: website?.href ?? null,
    inventory_type: inventoryType,
  };

  const submitted = { ...update, website: websiteInput || null };

  if (!shopName) return { error: "Shop name is required.", values: submitted };
  if (websiteInput && !website) {
    return { error: "That website address doesn't look right.", values: submitted };
  }

  try {
    const me = await directus.request(withToken(token, readMe({ fields: ["id"] })));
    await directus.request(withToken(token, updateMeFields(update)));

    revalidatePath("/dashboard", "layout");
    revalidatePath("/vendors");
    if (me?.id) revalidatePath(`/vendors/${me.id}`);
  } catch (error) {
    console.error("Profile update error:", error);
    return { error: "Couldn't save your profile. Please try again.", values: submitted };
  }

  return { success: true, values: update };
}

/* ---------- Shop logo ---------- */

/** `logo` is the new file id (or null after removal) so the UI can update immediately. */
export type LogoState = { success?: string; error?: string; logo?: string | null } | null;

function revalidateShop(id?: string | null) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/vendors", "layout");
  revalidatePath("/props", "layout");
  if (id) revalidatePath(`/vendors/${id}`);
}

async function currentLogo(token: string) {
  const me = await directus.request(withToken(token, readMe({ fields: ["id", "shop_logo"] })));
  return { id: (me?.id as string) ?? null, logo: (me?.shop_logo as string | null) ?? null };
}

async function deleteFileQuietly(token: string, id: string | null) {
  if (!id) return;
  try {
    await directus.request(withToken(token, deleteFile(id)));
  } catch (error) {
    console.warn("Couldn't delete old shop logo:", id, error);
  }
}

export async function updateShopLogo(formData: FormData): Promise<LogoState> {
  const token = await getActionToken();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (!file.type.startsWith("image/")) return { error: "That file isn't an image." };

  try {
    const { id, logo: previous } = await currentLogo(token);
    const fd = new FormData();
    fd.append("title", "Shop logo");
    fd.append("file", file);
    const uploaded = await directus.request(withToken(token, uploadFiles(fd)));
    await directus.request(withToken(token, updateMeFields({ shop_logo: uploaded.id })));
    await deleteFileQuietly(token, previous);
    revalidateShop(id);
    return { success: "Logo updated.", logo: uploaded.id };
  } catch (error) {
    console.error("Shop logo upload error:", error);
    return { error: "Couldn't update your logo. Please try again." };
  }
}

export async function removeShopLogo(): Promise<LogoState> {
  const token = await getActionToken();
  try {
    const { id, logo: previous } = await currentLogo(token);
    await directus.request(withToken(token, updateMeFields({ shop_logo: null })));
    await deleteFileQuietly(token, previous);
    revalidateShop(id);
  } catch (error) {
    console.error("Shop logo remove error:", error);
    return { error: "Couldn't remove your logo." };
  }
  return { success: "Logo removed.", logo: null };
}
