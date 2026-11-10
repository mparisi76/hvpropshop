"use server";

import { createSearchAlert } from "@/lib/searchAlerts";
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
