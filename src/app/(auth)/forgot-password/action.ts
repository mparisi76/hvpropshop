"use server";

import directus from "@/lib/directus";
import { passwordRequest } from "@directus/sdk";
import { getSiteUrl } from "@/lib/baseUrl";
import { reportError } from "@/lib/alerts";

/**
 * Ask Directus to email a password reset link. Directus sends the email itself
 * (using its EMAIL_* settings). It deliberately does nothing for unknown
 * addresses, and the page always shows the same message, so it never reveals
 * whether an account exists. Real failures are alerted instead.
 */
export async function handleForgotPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const resetUrl = `${await getSiteUrl()}/reset-password`;

  try {
    await directus.request(passwordRequest(email, resetUrl));
    return { success: true };
  } catch (error) {
    await reportError("Password reset request failed", error, {
      resetUrl,
      note: `If the message mentions the URL, add ${resetUrl} to PASSWORD_RESET_URL_ALLOW_LIST in Directus and restart it.`,
    });
    return { error: "Something went wrong." };
  }
}
