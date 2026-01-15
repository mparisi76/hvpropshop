"use server";

import directus from "@/lib/directus";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Define a proper type for the form state
export type ActionState = {
  error?: string;
} | null;

export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const response = await directus.login({ email, password });
    const accessToken = response.access_token;

    if (!accessToken) throw new Error("No token");

    const cookieStore = await cookies();
    cookieStore.set("directus_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    
  } catch (error: unknown) {
    // If it's a redirect error, we must re-throw it so Next.js can handle it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    return { error: "Invalid email or password" };
  }

  redirect("/dashboard");
}