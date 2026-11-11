"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, Loader2 } from "lucide-react";
import Select from "@/components/ui/Select";
import PhotoGrid from "@/components/dashboard/PhotoGrid";
import { compressImage } from "@/lib/images";
import type { FieldChoice } from "@/lib/fields";
import type { CategoryGroup } from "@/lib/listings";
import {
  createListing,
  updateListing,
  type ListingState,
} from "@/app/(auth)/dashboard/listingActions";

/** A photo is either already in Directus (fileId) or newly picked (file). */
interface Photo {
  key: string;
  url: string;
  file?: File;
  fileId?: string;
}

export interface ListingInitial {
  name: string;
  price: number | null;
  quantity_available: number | null;
  category: string;
  condition: string;
  dimensions: string;
  description: string;
  status: string;
  photoIds: string[];
}

const assetUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${id}?width=400&height=300&fit=cover&format=webp`;

const MAX_PHOTOS = 12;

export default function ListingForm({
  mode,
  listingId,
  initial,
  categories,
  conditionChoices,
  statusChoices,
}: {
  mode: "create" | "edit";
  listingId?: string;
  initial?: ListingInitial;
  categories: CategoryGroup[];
  conditionChoices: FieldChoice[];
  statusChoices: FieldChoice[];
}) {
  const [state, formAction, isPending] = useActionState<ListingState, FormData>(
    mode === "edit" ? updateListing : createListing,
    null
  );
  const [photos, setPhotos] = useState<Photo[]>(() =>
    (initial?.photoIds ?? []).map((id) => ({ key: `file:${id}`, fileId: id, url: assetUrl(id) }))
  );
  const [descriptionChanged, setDescriptionChanged] = useState(mode === "create");
  const [processing, setProcessing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free preview URLs when photos are removed / on unmount
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url)),
    []
  );

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setPhotoError(null);
    const room = MAX_PHOTOS - photos.length;
    const selected = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (selected.length > room) setPhotoError(`You can add up to ${MAX_PHOTOS} photos.`);

    setProcessing(true);
    const compressed = await Promise.all(selected.slice(0, room).map((f) => compressImage(f)));
    setProcessing(false);

    setPhotos((prev) => [
      ...prev,
      ...compressed.map((file) => ({
        key: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removePhoto = (key: string) =>
    setPhotos((prev) => {
      const p = prev.find((x) => x.key === key);
      if (p?.file) URL.revokeObjectURL(p.url);
      return prev.filter((x) => x.key !== key);
    });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    fd.delete("photos_picker");
    // Photo order: existing photos by file id, new ones by upload index
    let n = 0;
    const order = photos.map((p) => (p.file ? `new:${n++}` : `file:${p.fileId}`));
    photos.forEach((p) => p.file && fd.append("photos", p.file));
    fd.set("photo_order", JSON.stringify(order));
    startTransition(() => formAction(fd));
  };

  const busy = isPending || processing;

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      {listingId && <input type="hidden" name="id" value={listingId} />}
      <input type="hidden" name="description_changed" value={descriptionChanged ? "1" : "0"} />
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      {/* PHOTOS */}
      <section className="card space-y-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Photos</h2>
          <p className="text-sm text-neutral-500">
            Drag to reorder (press and hold on a phone). The first photo is the main one shown in search. Up to {MAX_PHOTOS}.
          </p>
        </div>

        <PhotoGrid photos={photos} onChange={setPhotos} onRemove={removePhoto}>
          {photos.length < MAX_PHOTOS && (
            <label
              className={`flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 text-sm text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 ${
                processing ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="h-5 w-5" aria-hidden />
              )}
              <span>{processing ? "Processing…" : "Add photos"}</span>
              <input
                ref={fileInput}
                type="file"
                name="photos_picker"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          )}
        </PhotoGrid>

        {photoError && <p className="text-sm text-amber-700">{photoError}</p>}

        <p className="rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          <span className="font-medium text-neutral-800">Tips:</span> shoot landscape against a plain
          wall or backdrop, in even daylight, with the whole item in frame. Add close-ups of
          details, labels and any wear.
        </p>
      </section>

      {/* DETAILS */}
      <section className="card space-y-5 p-6">
        <h2 className="text-base font-semibold">Details</h2>

        <div>
          <label htmlFor="name" className="label">Item name</label>
          <input
            id="name"
            name="name"
            required
            maxLength={150}
            defaultValue={initial?.name}
            placeholder="e.g. 1960s walnut credenza"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="category" className="label">Category</label>
          <Select id="category" name="category" defaultValue={initial?.category ?? ""}>
            <option value="">Choose a category…</option>
            {categories.map((g) =>
              g.children.length === 0 ? (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ) : (
                <optgroup key={g.id} label={g.name}>
                  <option value={g.id}>{g.name} (general)</option>
                  {g.children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )
            )}
          </Select>
        </div>

        <div>
          <label htmlFor="description" className="label">
            Description <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            maxLength={5000}
            defaultValue={initial?.description}
            onChange={() => setDescriptionChanged(true)}
            placeholder="Era, materials, color, what it works for, anything a set decorator should know."
            className="input"
          />
        </div>
      </section>

      {/* RENTAL */}
      <section className="card space-y-5 p-6">
        <h2 className="text-base font-semibold">Rental</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="label">Daily rate</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                $
              </span>
              <input
                id="price"
                name="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                required
                defaultValue={initial?.price ?? undefined}
                placeholder="0"
                className="input pl-7!"
              />
            </div>
          </div>
          <div>
            <label htmlFor="quantity_available" className="label">Quantity</label>
            <input
              id="quantity_available"
              name="quantity_available"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              defaultValue={initial?.quantity_available ?? 1}
              required
              className="input"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="condition" className="label">
              Condition <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            {conditionChoices.length > 0 ? (
              <Select id="condition" name="condition" defaultValue={initial?.condition ?? ""}>
                <option value="">Select…</option>
                {initial?.condition && !conditionChoices.some((c) => c.value === initial.condition) && (
                  <option value={initial.condition}>{initial.condition}</option>
                )}
                {conditionChoices.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.text}
                  </option>
                ))}
              </Select>
            ) : (
              <input
                id="condition"
                name="condition"
                defaultValue={initial?.condition}
                placeholder="e.g. Excellent, light wear"
                className="input"
              />
            )}
          </div>
          <div>
            <label htmlFor="dimensions" className="label">
              Dimensions <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              id="dimensions"
              name="dimensions"
              defaultValue={initial?.dimensions}
              placeholder={`e.g. 72" W × 18" D × 30" H`}
              className="input"
            />
          </div>
        </div>
      </section>

      {/* ACTIONS */}
      {mode === "create" ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/dashboard" className="btn-ghost">
            Cancel
          </Link>
          <button type="submit" name="status" value="draft" disabled={busy} className="btn-secondary">
            Save as draft
          </button>
          <button type="submit" name="status" value="published" disabled={busy} className="btn-primary">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Publish listing"
            )}
          </button>
        </div>
      ) : (
        <div className="card flex flex-wrap items-end justify-between gap-4 p-4">
          <div className="w-48">
            <label htmlFor="status" className="label">Status</label>
            <Select id="status" name="status" defaultValue={initial?.status ?? "draft"}>
              {statusChoices.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.text}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn-ghost">
              Cancel
            </Link>
            <button type="submit" disabled={busy} className="btn-primary">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
