"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import VendorAvatar from "@/components/VendorAvatar";
import { compressImage } from "@/lib/images";
import { Vendor } from "@/types";
import FeaturedBadge from "@/components/FeaturedBadge";
import Select from "@/components/ui/Select";
import type { InventoryTypeField } from "@/lib/vendors";
import {
  removeShopLogo,
  updateProfile,
  updateShopLogo,
  type LogoState,
  type ProfileState,
} from "./actions";

export default function ProfileForm({
  user: initialUser,
  inventoryField,
}: {
  user: Vendor;
  /** Dropdown config from Directus; null if it couldn't be loaded */
  inventoryField: InventoryTypeField | null;
}) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateProfile,
    null
  );

  // After a save (or failed save), show what was submitted rather than the original values
  const user: Vendor = { ...initialUser, ...state?.values };

  const choices = inventoryField?.choices ?? [];
  const isMultiple =
    inventoryField?.multiple ?? Array.isArray(initialUser.inventory_type);
  const selected = (
    Array.isArray(user.inventory_type)
      ? user.inventory_type
      : user.inventory_type
        ? [user.inventory_type]
        : []
  ).map(String);
  // Keep any saved value that's no longer one of the dropdown choices
  const options = [
    ...choices,
    ...selected
      .filter((v) => !choices.some((c) => c.value === v))
      .map((v) => ({ text: v, value: v })),
  ];

  return (
    <>
    <LogoSection name={user.shop_name || "Your shop"} logo={initialUser.shop_logo ?? null} />
    <form action={formAction} className="mt-6 space-y-6">
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {/* Shop */}
      <section className="card space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Shop</h2>
            <p className="text-sm text-neutral-500">
              Shown publicly. Your name, phone and login are under Account.
            </p>
          </div>
          {user.featured_vendor && <FeaturedBadge />}
        </div>

        <Field label="Shop name" htmlFor="shop_name">
          <input
            id="shop_name"
            name="shop_name"
            required
            defaultValue={user.shop_name ?? ""}
            placeholder="e.g. Catskill Prop House"
            className="input"
          />
        </Field>

        <input type="hidden" name="inventory_type_format" value={isMultiple ? "array" : "string"} />
        {choices.length === 0 ? (
          <Field
            label="What you rent"
            htmlFor="inventory_type"
            hint={isMultiple ? "Separate multiple types with commas." : undefined}
          >
            <input
              id="inventory_type"
              name="inventory_type"
              defaultValue={selected.join(", ")}
              className="input"
            />
          </Field>
        ) : isMultiple ? (
          <fieldset>
            <legend className="label">What you rent</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {options.map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    name="inventory_type"
                    value={c.value}
                    defaultChecked={selected.includes(c.value)}
                    className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
                  />
                  {c.text}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <Field label="What you rent" htmlFor="inventory_type">
            <Select
              id="inventory_type"
              name="inventory_type"
              defaultValue={selected[0] ?? ""}
            >
              <option value="">Select…</option>
              {options.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.text}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid gap-5 sm:grid-cols-[1fr_6rem]">
          <Field label="City" htmlFor="city" hint="Where productions pick up.">
            <input
              id="city"
              name="city"
              defaultValue={user.city ?? ""}
              placeholder="e.g. Kingston"
              autoComplete="address-level2"
              className="input"
            />
          </Field>
          <Field label="State" htmlFor="state">
            <input
              id="state"
              name="state"
              defaultValue={user.state ?? ""}
              placeholder="NY"
              maxLength={2}
              autoComplete="address-level1"
              className="input uppercase"
            />
          </Field>
        </div>

        <Field label="Website" htmlFor="website" hint="Optional. Instagram links work too.">
          <input
            id="website"
            name="website"
            type="text"
            inputMode="url"
            defaultValue={user.website ?? ""}
            placeholder="yourshop.com"
            className="input"
          />
        </Field>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {user.id ? (
          <Link
            href={`/vendors/${user.id}`}
            target="_blank"
            className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
          >
            View public page <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {state?.success && !isPending && (
            <p className="flex items-center gap-1 text-sm text-accent" role="status">
              <Check className="h-4 w-4" /> Saved
            </p>
          )}
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
      <p className="text-right text-xs text-neutral-500">
        Your public page appears once you have at least one published listing.
      </p>
    </form>
    </>
  );
}

function LogoSection({ name, logo: savedLogo }: { name: string; logo: string | null }) {
  const [state, setState] = useState<LogoState>(null);
  // Use the id returned by the last upload/remove; otherwise what the page loaded
  const logo = state && "logo" in state ? (state.logo ?? null) : savedLogo;
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const upload = (file: File | undefined) => {
    if (!file) return;
    start(async () => {
      // PNG keeps transparent backgrounds; 512px is plenty for a logo
      const small = await compressImage(file, 512, 0.92, "image/png");
      const fd = new FormData();
      fd.append("logo", small);
      setState(await updateShopLogo(fd));
      if (input.current) input.current.value = "";
    });
  };

  return (
    <section className="card mt-6 space-y-4 p-6">
      <div>
        <h2 className="text-base font-semibold">Shop logo</h2>
        <p className="text-sm text-neutral-500">
          Shown on your vendor page, in the vendor directory and next to every item you list.
          Square images work best. Without one, your shop&apos;s initials are used.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <VendorAvatar key={logo ?? "none"} name={name} logo={logo} size="lg" />
          {pending && (
            <span className="absolute inset-0 grid place-items-center rounded-md bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-700" aria-hidden />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`btn-secondary cursor-pointer ${pending ? "pointer-events-none opacity-50" : ""}`}>
            {logo ? "Change logo" : "Upload logo"}
            <input
              ref={input}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          {logo && (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => setState(await removeShopLogo()))}
              className="btn-ghost"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      {state?.success && !pending && (
        <p className="flex items-center gap-1 text-sm text-accent" role="status">
          <Check className="h-4 w-4" /> {state.success}
        </p>
      )}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
