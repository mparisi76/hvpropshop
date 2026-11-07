"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginWithPassword, setSessionCookies } from "@/lib/session";

export type ActionState = {
  error?: string;
} | null;

export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const tokens = await loginWithPassword(email, password);
  if (!tokens) return { error: "Invalid email or password" };

  setSessionCookies(await cookies(), tokens);
  redirect("/dashboard");
}
