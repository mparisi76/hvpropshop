"use client";

/**
 * Shrink an image in the browser before upload (longest side ≤ maxDim).
 *
 * - "image/jpeg" (default): best for photos. Transparent areas are filled white.
 * - "image/png": keeps transparency — use for logos.
 *
 * Falls back to the original file if the browser can't decode it (e.g. HEIC in
 * Chrome) or if the result isn't smaller.
 */
export async function compressImage(
  file: File,
  maxDim = 2400,
  quality = 0.85,
  type: "image/jpeg" | "image/png" = "image/jpeg"
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    if (!blob || (blob.size >= file.size && scale === 1)) return file;
    const ext = type === "image/png" ? ".png" : ".jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ext, { type });
  } catch {
    return file;
  }
}
