"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createItem, deleteFiles, updateItem, uploadFiles, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { getOwnListing, getStatusChoices } from "@/lib/listings";
import { textToHtml } from "@/lib/listingText";
import { getActionToken } from "@/lib/actionSession";

export type ListingState = { error?: string } | null;

const MAX_PHOTOS = 12;

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);

function revalidateListing(id?: string | number) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/");
  revalidatePath("/vendors", "layout");
  if (id != null) revalidatePath(`/props/${id}`);
}

/* ---------- Form parsing ---------- */

type PhotoToken = { kind: "file"; id: string } | { kind: "new"; index: number };

function parseListingForm(formData: FormData) {
  const priceRaw = clean(formData.get("price"), 20);
  const description = clean(formData.get("description"), 5000);

  let order: PhotoToken[] = [];
  try {
    const raw = JSON.parse(String(formData.get("photo_order") ?? "[]"));
    if (Array.isArray(raw)) {
      order = raw
        .map(String)
        .map((t): PhotoToken | null =>
          t.startsWith("file:")
            ? { kind: "file", id: t.slice(5) }
            : t.startsWith("new:")
              ? { kind: "new", index: parseInt(t.slice(4)) }
              : null
        )
        .filter((t): t is PhotoToken => t !== null)
        .slice(0, MAX_PHOTOS);
    }
  } catch {
    // ignore malformed order
  }

  return {
    name: clean(formData.get("name"), 150),
    priceRaw,
    price: Number(priceRaw),
    quantity: parseInt(clean(formData.get("quantity_available"), 6)) || 0,
    category: clean(formData.get("category"), 50) || null,
    condition: clean(formData.get("condition"), 100) || null,
    dimensions: clean(formData.get("dimensions"), 200) || null,
    descriptionHtml: description ? textToHtml(description) : null,
    descriptionChanged: formData.get("description_changed") === "1",
    status: clean(formData.get("status"), 30),
    newFiles: formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0),
    order,
  };
}

function validate(f: ReturnType<typeof parseListingForm>, photoCount: number) {
  if (!f.name) return "Please give the item a name.";
  if (f.priceRaw === "" || !Number.isFinite(f.price) || f.price < 0) return "Please enter a daily rate (0 or more).";
  if (f.quantity < 1) return "Quantity must be at least 1.";
  if (f.status === "published" && photoCount === 0) {
    return "Add at least one photo to publish. You can save it as a draft without photos.";
  }
  return null;
}

async function uploadPhotos(token: string, files: File[], title: string) {
  const ids: string[] = [];
  try {
    for (const file of files) {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("file", file);
      const uploaded = await directus.request(withToken(token, uploadFiles(fd)));
      ids.push(uploaded.id);
    }
    return { ids };
  } catch (error) {
    console.error("Photo upload error:", error);
    await removeFiles(token, ids);
    return { ids: [], error: "A photo failed to upload. Please try again." };
  }
}

/** Best effort file cleanup (failed saves, removed photos). */
async function removeFiles(token: string, ids: string[]) {
  if (ids.length === 0) return;
  try {
    await directus.request(withToken(token, deleteFiles(ids)));
  } catch (error) {
    console.warn("Couldn't delete files:", ids, error);
  }
}

/** Resolve the submitted photo order into Directus file ids. */
function orderedFileIds(order: PhotoToken[], uploadedIds: string[], allowedExisting: Set<string>) {
  const ids: string[] = [];
  for (const t of order) {
    const id = t.kind === "file" ? (allowedExisting.has(t.id) ? t.id : null) : uploadedIds[t.index] ?? null;
    if (id && !ids.includes(id)) ids.push(id);
  }
  // Any uploaded file missing from the order goes at the end
  for (const id of uploadedIds) if (!ids.includes(id)) ids.push(id);
  return ids;
}

/* ---------- Create ---------- */

export async function createListing(_prev: ListingState, formData: FormData): Promise<ListingState> {
  const token = await getActionToken();
  const f = parseListingForm(formData);
  const statuses = await getStatusChoices(token);
  if (!statuses.some((s) => s.value === f.status)) f.status = "draft";

  const newFiles = f.newFiles.slice(0, MAX_PHOTOS);
  const error = validate(f, newFiles.length);
  if (error) return { error };

  const upload = await uploadPhotos(token, newFiles, f.name);
  if (upload.error) return { error: upload.error };
  const fileIds = orderedFileIds(f.order, upload.ids, new Set());

  try {
    await directus.request(
      withToken(
        token,
        createItem("props", {
          name: f.name,
          price: f.price,
          quantity_available: f.quantity,
          category: f.category,
          condition: f.condition,
          dimensions: f.dimensions,
          description: f.descriptionHtml,
          thumbnail: fileIds[0] ?? null,
          photo_gallery: fileIds.slice(1).map((id) => ({ directus_files_id: id })),
          status: f.status,
        })
      )
    );
  } catch (err) {
    console.error("Create listing error:", err);
    await removeFiles(token, upload.ids);
    return { error: "Couldn't save the listing. Please try again." };
  }

  revalidateListing();
  redirect("/dashboard");
}

/* ---------- Update ---------- */

export async function updateListing(_prev: ListingState, formData: FormData): Promise<ListingState> {
  const token = await getActionToken();
  const id = clean(formData.get("id"), 50);
  const existing = id ? await getOwnListing(token, id) : null;
  if (!existing) return { error: "This listing doesn't exist or isn't yours." };

  const f = parseListingForm(formData);
  const statuses = await getStatusChoices(token);
  if (!statuses.some((s) => s.value === f.status)) f.status = existing.status ?? "draft";

  // Files currently attached to this listing
  const gallery = existing.photo_gallery ?? [];
  const currentFileIds = new Set(
    [existing.thumbnail, ...gallery.map((g) => g.directus_files_id)].filter((x): x is string => Boolean(x))
  );

  const keptCount = f.order.filter((t) => t.kind === "file" && currentFileIds.has(t.id)).length;
  const room = Math.max(0, MAX_PHOTOS - keptCount);
  const newFiles = f.newFiles.slice(0, room);
  const error = validate(f, keptCount + newFiles.length);
  if (error) return { error };

  const upload = await uploadPhotos(token, newFiles, f.name);
  if (upload.error) return { error: upload.error };
  const fileIds = orderedFileIds(f.order, upload.ids, currentFileIds);

  // Gallery = every photo except the main one. Keep existing junction rows where
  // possible; rows left out of the array are removed by Directus.
  const galleryRows = fileIds.slice(1).map((fileId) => {
    const row = gallery.find((g) => g.directus_files_id === fileId);
    return row ? { id: row.id } : { directus_files_id: fileId };
  });

  try {
    await directus.request(
      withToken(
        token,
        updateItem("props", existing.id, {
          name: f.name,
          price: f.price,
          quantity_available: f.quantity,
          category: f.category,
          condition: f.condition,
          dimensions: f.dimensions,
          ...(f.descriptionChanged ? { description: f.descriptionHtml } : {}),
          thumbnail: fileIds[0] ?? null,
          photo_gallery: galleryRows,
          status: f.status,
        })
      )
    );
  } catch (err) {
    console.error("Update listing error:", err);
    await removeFiles(token, upload.ids);
    return { error: "Couldn't save your changes. Please try again." };
  }

  // Delete photos that were removed from the listing
  await removeFiles(token, [...currentFileIds].filter((fid) => !fileIds.includes(fid)));

  revalidateListing(existing.id);
  redirect("/dashboard");
}

/* ---------- Status (from the listings table) ---------- */

export async function setListingStatus(id: string, status: string): Promise<{ error?: string }> {
  const token = await getActionToken();
  const existing = await getOwnListing(token, id);
  if (!existing) return { error: "Listing not found." };

  const statuses = await getStatusChoices(token);
  if (!statuses.some((s) => s.value === status)) return { error: "Invalid status." };
  if (status === "published" && !existing.thumbnail) {
    return { error: "Add a photo before publishing." };
  }

  try {
    await directus.request(withToken(token, updateItem("props", existing.id, { status })));
  } catch (err) {
    console.error("Status update error:", err);
    return { error: "Couldn't update status." };
  }

  revalidateListing(existing.id);
  return {};
}
