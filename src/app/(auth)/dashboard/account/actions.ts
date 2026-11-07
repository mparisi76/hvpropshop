"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteFile, readMe, updateMe, uploadFiles, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { updateMeFields } from "@/lib/directusUser";
import { getActionToken } from "@/lib/actionSession";
import {
  isSessionError,
  loginWithPassword,
  setSessionCookies,
  verifyPassword,
} from "@/lib/session";

export type AccountState = {
  success?: string;
  error?: string;
  /** Echo of non-secret submitted values, so React's form reset doesn't wipe them */
  values?: Record<string, string>;
} | null;

const MIN_PASSWORD = 8;

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);

async function currentEmail(token: string) {
  const me = await directus.request(withToken(token, readMe({ fields: ["email"] })));
  return String(me?.email ?? "");
}

/**
 * Changing the email or password can end the user's Directus sessions.
 * Log straight back in with the new credentials so they stay signed in.
 */
async function renewSession(email: string, password: string) {
  const tokens = await loginWithPassword(email, password);
  if (tokens) setSessionCookies(await cookies(), tokens);
  else console.warn("Couldn't renew session after account change");
}

/** Directus error → short message for known cases (session errors → back to login) */
function directusMessage(error: unknown, fallback: string) {
  if (isSessionError(error)) redirect("/login");
  const errors = (error as { errors?: { message?: string; extensions?: { code?: string } }[] })?.errors;
  const first = errors?.[0];
  if (first?.extensions?.code === "RECORD_NOT_UNIQUE") return "That email is already in use.";
  if (first?.extensions?.code === "FORBIDDEN") {
    return "Your account isn't allowed to change this yet. Please contact HV Prop Shop.";
  }
  return first?.message || fallback;
}

/* ---------- Name & phone ---------- */

export async function updateDetails(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const token = await getActionToken();
  const values = {
    first_name: clean(formData.get("first_name"), 80),
    last_name: clean(formData.get("last_name"), 80),
    phone: clean(formData.get("phone"), 40),
  };

  try {
    await directus.request(
      withToken(
        token,
        updateMeFields({
          first_name: values.first_name || null,
          last_name: values.last_name || null,
          phone: values.phone || null,
        })
      )
    );
  } catch (error) {
    console.error("Update details error:", error);
    return { error: directusMessage(error, "Couldn't save your details."), values };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Details saved.", values };
}

/* ---------- Email ---------- */

export async function updateEmail(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const token = await getActionToken();
  const email = clean(formData.get("email"), 200).toLowerCase();
  const password = String(formData.get("current_password") ?? "");
  const values = { email };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address.", values };
  }

  try {
    const existing = await currentEmail(token);
    if (email === existing.toLowerCase()) return { error: "That's already your email.", values };
    if (!(await verifyPassword(existing, password))) {
      return { error: "Your current password is incorrect.", values };
    }
    await directus.request(withToken(token, updateMe({ email })));
    await renewSession(email, password);
  } catch (error) {
    console.error("Update email error:", error);
    return { error: directusMessage(error, "Couldn't change your email."), values };
  }

  revalidatePath("/dashboard/account");
  return { success: "Email updated. Use it the next time you log in.", values };
}

/* ---------- Password ---------- */

export async function updatePassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const token = await getActionToken();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (next.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  if (next !== confirm) return { error: "The new passwords don't match." };
  if (next === current) return { error: "Choose a password different from your current one." };

  try {
    const email = await currentEmail(token);
    if (!(await verifyPassword(email, current))) {
      return { error: "Your current password is incorrect." };
    }
    await directus.request(withToken(token, updateMe({ password: next })));
    await renewSession(email, next);
  } catch (error) {
    console.error("Update password error:", error);
    return { error: directusMessage(error, "Couldn't change your password.") };
  }

  return { success: "Password changed." };
}

/* ---------- Profile photo ---------- */

async function currentAvatar(token: string) {
  const me = await directus.request(withToken(token, readMe({ fields: ["avatar"] })));
  return (me?.avatar as string | null) ?? null;
}

async function deleteFileQuietly(token: string, id: string | null) {
  if (!id) return;
  try {
    await directus.request(withToken(token, deleteFile(id)));
  } catch (error) {
    console.warn("Couldn't delete old avatar:", id, error);
  }
}

export async function updateAvatar(formData: FormData): Promise<AccountState> {
  const token = await getActionToken();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  if (!file.type.startsWith("image/")) return { error: "That file isn't an image." };

  try {
    const previous = await currentAvatar(token);
    const fd = new FormData();
    fd.append("title", "Profile photo");
    fd.append("file", file);
    const uploaded = await directus.request(withToken(token, uploadFiles(fd)));
    await directus.request(withToken(token, updateMe({ avatar: uploaded.id })));
    await deleteFileQuietly(token, previous);
  } catch (error) {
    console.error("Avatar upload error:", error);
    return { error: directusMessage(error, "Couldn't update your photo.") };
  }

  revalidatePath("/", "layout");
  return { success: "Photo updated." };
}

export async function removeAvatar(): Promise<AccountState> {
  const token = await getActionToken();
  try {
    const previous = await currentAvatar(token);
    await directus.request(withToken(token, updateMe({ avatar: null })));
    await deleteFileQuietly(token, previous);
  } catch (error) {
    console.error("Avatar remove error:", error);
    return { error: directusMessage(error, "Couldn't remove your photo.") };
  }

  revalidatePath("/", "layout");
  return { success: "Photo removed." };
}
