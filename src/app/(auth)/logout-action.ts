"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  
  // Delete the session cookie we created during login
  cookieStore.delete("directus_token");
  
  // Send them back to the login page
  redirect("/login");
}