import { readField, withToken } from "@directus/sdk";
import directus from "@/lib/directus";

export type FieldChoice = { text: string; value: string };
export type DropdownField = { choices: FieldChoice[]; multiple: boolean };

/**
 * Directus's built-in fields (e.g. status) use translation keys like
 * "$t:published" as labels, which only the Directus admin app translates.
 * Turn those into readable text: "$t:fields.in_progress" → "In progress".
 */
function choiceLabel(text: string, value: string) {
  if (!text.startsWith("$t:")) return text || value;
  const key = text.slice(3).split(".").pop() || value;
  const words = key.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Reads a dropdown field's choices from Directus field config.
 * Returns null if the field metadata isn't readable with the given token
 * (or publicly, if no token). An empty `choices` array means the field
 * exists but isn't a dropdown with predefined choices.
 */
export async function getDropdownField(
  collection: string,
  fieldName: string,
  token?: string
): Promise<DropdownField | null> {
  const tag = `[${collection}.${fieldName}]`;
  try {
    const request = readField(collection, fieldName);
    const field = (await directus.request(
      token ? withToken(token, request) : request
    )) as unknown as {
      meta?: {
        interface?: string | null;
        options?: { choices?: { text: string; value: string | number }[] | null } | null;
      } | null;
    };
    const choices = (field.meta?.options?.choices ?? []).map((c) => ({
      text: choiceLabel(String(c.text), String(c.value)),
      value: String(c.value),
    }));
    if (choices.length === 0) {
      console.warn(`${tag} Field has no dropdown choices (interface: ${field.meta?.interface ?? "unknown"}).`);
    }
    return { choices, multiple: Boolean(field.meta?.interface?.includes("multiple")) };
  } catch (error) {
    console.warn(`${tag} Couldn't read field config ${token ? "with vendor token" : "publicly"}:`, error);
    return null;
  }
}

/** True if Directus refused a request because a specific field isn't readable. */
export function isFieldForbidden(error: unknown, field: string) {
  const first = (error as { errors?: { message?: string; extensions?: { code?: string } }[] })?.errors?.[0];
  return first?.extensions?.code === "FORBIDDEN" && Boolean(first.message?.includes(`"${field}"`));
}

/**
 * Run a request that includes an optional field; if Directus refuses because
 * that field isn't readable (e.g. missing Public permission), log it and retry
 * without the field instead of failing the whole page.
 */
export async function withOptionalField<T>(
  field: string,
  withField: () => Promise<T>,
  withoutField: () => Promise<T>
): Promise<T> {
  try {
    return await withField();
  } catch (error) {
    if (!isFieldForbidden(error, field)) throw error;
    console.warn(`[permissions] "${field}" isn't readable here — check the Directus policy. Continuing without it.`);
    return withoutField();
  }
}

/**
 * Like withOptionalField, for several optional fields: load with all `fields`;
 * each time Directus refuses one of `optional`, drop it and try again.
 */
export async function withOptionalFields<T>(
  fields: readonly string[],
  optional: readonly string[],
  load: (fields: string[]) => Promise<T>
): Promise<T> {
  let current = [...fields];
  for (;;) {
    try {
      return await load(current);
    } catch (error) {
      const blocked = optional.find((f) => current.includes(f) && isFieldForbidden(error, f));
      if (!blocked) throw error;
      console.warn(`[permissions] "${blocked}" isn't readable here — check the Directus policy. Continuing without it.`);
      current = current.filter((f) => f !== blocked);
    }
  }
}

/**
 * True if Directus refused an item outright rather than one field: it answers
 * "You don't have permission to access this" (FORBIDDEN) both for items that
 * don't exist and for items the caller can't see (e.g. unpublished). Treat as
 * "not found".
 */
export function isItemUnavailable(error: unknown) {
  const first = (error as { errors?: { message?: string; extensions?: { code?: string } }[] })?.errors?.[0];
  const code = first?.extensions?.code;
  if (code === "RECORD_NOT_FOUND" || code === "ROUTE_NOT_FOUND") return true;
  // A field-specific refusal names the field in quotes; an item-level one doesn't
  return code === "FORBIDDEN" && !/field\s+"/i.test(first?.message ?? "");
}
