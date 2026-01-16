"use server";

import directus from "@/lib/directus";
import { passwordReset } from "@directus/sdk";
import { redirect } from "next/navigation";

export async function handleResetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token) {
    return { error: "Invalid or expired token." };
  }

  try {
    // The SDK method that actually updates the password in Directus
    await directus.request(passwordReset(token, password));
  } catch (error) {
    console.error("Reset Error:", error);
    return { error: "Failed to reset password. The link may have expired." };
  }

  // Send them to login once successful
  redirect("/login?reset=success");
}
