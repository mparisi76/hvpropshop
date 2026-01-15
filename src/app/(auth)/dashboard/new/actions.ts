"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import directus from "@/lib/directus";
import { createItem, uploadFiles, withToken } from "@directus/sdk";

export async function uploadProp(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get("directus_token")?.value;

  if (!token) redirect("/login");

  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const file = formData.get("thumbnail") as File;

  let thumbnailId = null;

  try {
    // 1. Upload the file first
    if (file.size > 0) {
      const fileFormData = new FormData();
      fileFormData.append("file", file);

      const uploadResult = await directus.request(
        withToken(token, uploadFiles(fileFormData))
      );
      thumbnailId = uploadResult.id;
    }

    // 2. Create the Prop item
    await directus.request(
      withToken(token, createItem("props", {
        name,
        price: parseFloat(price),
        thumbnail: thumbnailId,
        status: "published" // Or 'draft'
      }))
    );
  } catch (error) {
    console.error("Upload Error:", error);
    return;
  }

  redirect("/dashboard");
}