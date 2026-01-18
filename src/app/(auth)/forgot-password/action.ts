"use server";

import directus from "@/lib/directus";
import { passwordRequest } from "@directus/sdk";

export async function handleForgotPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;

  try {
    await directus.request(passwordRequest(email, resetUrl));
    return { success: true };
  } catch (error) {
    // 1. We log the general error first
    console.error("Directus Request Failed");

    // 2. We check if this is an object with a 'response' property safely
    if (typeof error === "object" && error !== null && "response" in error) {
      const response = (error as { response: unknown }).response;
      
      if (typeof response === "object" && response !== null && "data" in response) {
        console.error("Error Data:", response.data);
      }
    }

    return { error: "Something went wrong." };
  }
}
