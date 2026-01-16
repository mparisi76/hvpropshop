// app/(auth)/forgot-password/action.ts
import directus from "@/lib/directus";
import { passwordRequest } from "@directus/sdk";

export async function handleForgotPassword(formData: FormData) {
  const email = formData.get("email") as string;
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`;

  try {
    // We pass ONLY the email and the reset_url
    await directus.request(passwordRequest(email, resetUrl));
    return { success: true };
  } catch (error: any) {
    // Check your LOCAL terminal for this log!
    console.error("Directus 400 Error Details:", error.response?.data);
    return { error: "Something went wrong." };
  }
}
