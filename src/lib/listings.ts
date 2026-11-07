import { readItems, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { getDropdownField, type FieldChoice } from "@/lib/fields";

/* ---------- Status ---------- */

/** Used when the props.status choices can't be read from Directus. */
export const FALLBACK_STATUS_CHOICES: FieldChoice[] = [
  { value: "published", text: "Published" },
  { value: "draft", text: "Draft" },
  { value: "archived", text: "Archived" },
];

export async function getStatusChoices(token: string) {
  const field = await getDropdownField("props", "status", token);
  return field?.choices.length ? field.choices : FALLBACK_STATUS_CHOICES;
}

/* ---------- Categories ---------- */

export interface CategoryGroup {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

interface CategoryRow {
  id: string | number;
  name: string;
  parent: { id: string | number } | string | number | null;
}

/** Categories as parent → children groups, A–Z. */
export async function getCategoryGroups(): Promise<CategoryGroup[]> {
  let rows: CategoryRow[] = [];
  try {
    rows = await directus.request<CategoryRow[]>(
      readItems("categories", { fields: ["id", "name", { parent: ["id"] }], limit: -1 })
    );
  } catch (error) {
    console.error("Category load error:", error);
  }

  const parentId = (c: CategoryRow) =>
    c.parent == null ? null : typeof c.parent === "object" ? String(c.parent.id) : String(c.parent);

  return rows
    .filter((c) => !parentId(c))
    .map((p) => ({
      id: String(p.id),
      name: p.name,
      children: rows
        .filter((c) => parentId(c) === String(p.id))
        .map((c) => ({ id: String(c.id), name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------- Ownership ---------- */

export interface OwnListing {
  id: string | number;
  name: string;
  price: number | null;
  quantity_available: number | null;
  category: { id: string | number } | string | number | null;
  condition: string | null;
  dimensions: string | null;
  description: string | null;
  status: string | null;
  thumbnail: string | null;
  photo_gallery: { id: string | number; directus_files_id: string | null }[] | null;
}

/** The listing, only if it belongs to the logged-in vendor. */
export async function getOwnListing(token: string, id: string): Promise<OwnListing | null> {
  try {
    const [item] = await directus.request<OwnListing[]>(
      withToken(
        token,
        readItems("props", {
          fields: [
            "id",
            "name",
            "price",
            "quantity_available",
            { category: ["id"] },
            "condition",
            "dimensions",
            "description",
            "status",
            "thumbnail",
            { photo_gallery: ["id", "directus_files_id"] },
          ],
          filter: { _and: [{ id: { _eq: id } }, { user_created: { _eq: "$CURRENT_USER" } }] },
          limit: 1,
        })
      )
    );
    return item ?? null;
  } catch (error) {
    console.error("Load listing error:", error);
    return null;
  }
}
