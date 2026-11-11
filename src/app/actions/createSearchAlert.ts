"use server";

import { readItems } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { createItemAlert, createSearchAlert } from "@/lib/searchAlerts";
import { reportError } from "@/lib/alerts";

export type SearchAlertState = { success?: boolean; error?: string; email?: string } | null;

export async function createSearchAlertAction(_prev: SearchAlertState, formData: FormData): Promise<SearchAlertState> {
  const email = String(formData.get("email") ?? "").trim();
  const query = String(formData.get("query") ?? "").trim();
  if (String(formData.get("website_url") ?? "")) return { success: true, email }; // honeypot

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (!query) return { error: "There's nothing to save for this search." };

  try {
    await createSearchAlert({
      email,
      query,
      category: String(formData.get("category") ?? "") || null,
      near: String(formData.get("near") ?? "") || null,
      radius: Number(formData.get("radius")) || null,
    });
  } catch (error) {
    await reportError("Couldn't save a search alert", error, {
      query,
      note: 'Does the "search_alerts" collection exist, with Create/Read/Update for the Site server policy?',
    });
    return { error: "Sorry, we couldn't save your alert. Please try again." };
  }
  return { success: true, email };
}

/** "Notify me when it's available" on an unavailable item. */
export async function createItemAlertAction(_prev: SearchAlertState, formData: FormData): Promise<SearchAlertState> {
  const email = String(formData.get("email") ?? "").trim();
  const propId = String(formData.get("prop_id") ?? "").trim();
  if (String(formData.get("website_url") ?? "")) return { success: true, email }; // honeypot
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (!propId) return { error: "Something went wrong. Please refresh and try again." };

  try {
    // Look the item up server-side for its name (don't trust the browser)
    const [prop] = (await asServer(
      readItems("props", {
        fields: ["id", "name"],
        filter: { _and: [{ id: { _eq: propId } }, { status: { _eq: "published" } }] },
        limit: 1,
      })
    )) as unknown as { id: string | number; name: string }[];
    if (!prop) return { error: "This item is no longer listed." };
    await createItemAlert({ email, propId: String(prop.id), itemName: prop.name });
  } catch (error) {
    await reportError("Couldn't save an item alert", error, {
      item: propId,
      note: 'Does search_alerts have a "prop_id" field, with Create/Read/Update for the Site server policy?',
    });
    return { error: "Sorry, we couldn't save your alert. Please try again." };
  }
  return { success: true, email };
}
