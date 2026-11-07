"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE, logoutSession } from "@/lib/session";

export async function logout() {
  const cookieStore = await cookies();

  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;
  if (refresh) await logoutSession(refresh);

  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);

  redirect("/login");
}
