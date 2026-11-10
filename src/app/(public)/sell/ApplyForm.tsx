"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import Select from "@/components/ui/Select";
import TrackEvent from "@/components/TrackEvent";
import { applyAsVendor, type ApplyState } from "@/app/actions/applyAsVendor";

export default function ApplyForm() {
  const [state, action, pending] = useActionState<ApplyState, FormData>(applyAsVendor, null);
  const v = state?.values ?? {};

  if (state?.success) {
    return (
      <div className="card space-y-2 p-6">
        <TrackEvent name="Vendor application sent" />
        <Check className="h-7 w-7 text-accent" aria-hidden />
        <h3 className="text-lg font-semibold">Application sent</h3>
        <p className="text-sm text-neutral-600">
          Thanks! We&apos;ll review it and email you, usually within a few days. If you&apos;re approved, you&apos;ll
          get a link to set up your account.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-5 p-6">
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      {state?.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="a-name" label="Your name">
          <input id="a-name" name="name" required autoComplete="name" defaultValue={v.name} className="input" />
        </Field>
        <Field id="a-email" label="Email">
          <input id="a-email" name="email" type="email" required autoComplete="email" defaultValue={v.email} className="input" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="a-shop" label="Shop or business name">
          <input id="a-shop" name="shop_name" required defaultValue={v.shop_name} className="input" />
        </Field>
        <Field id="a-phone" label="Phone" optional>
          <input id="a-phone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} className="input" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_6rem]">
        <Field id="a-city" label="Where's your inventory?">
          <input id="a-city" name="city" required placeholder="e.g. Kingston" autoComplete="address-level2" defaultValue={v.city} className="input" />
        </Field>
        <Field id="a-state" label="State">
          <input id="a-state" name="state" maxLength={2} placeholder="NY" autoComplete="address-level1" defaultValue={v.state} className="input uppercase" />
        </Field>
      </div>

      <Field id="a-inventory" label="What do you rent?">
        <textarea
          id="a-inventory"
          name="inventory"
          required
          rows={3}
          defaultValue={v.inventory}
          placeholder="e.g. Mid-century furniture, vintage signage, 70s kitchenware"
          className="input resize-y"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="a-count" label="Roughly how many items?">
          <Select id="a-count" name="item_count" defaultValue={v.item_count ?? ""}>
            <option value="">Choose…</option>
            <option>Under 25</option>
            <option>25–100</option>
            <option>100–500</option>
            <option>500+</option>
          </Select>
        </Field>
        <Field id="a-website" label="Website or Instagram" optional>
          <input id="a-website" name="website" inputMode="url" defaultValue={v.website} className="input" />
        </Field>
      </div>

      <Field id="a-message" label="Anything else?" optional>
        <textarea id="a-message" name="message" rows={3} defaultValue={v.message} className="input resize-y" />
      </Field>

      <button type="submit" disabled={pending} className="btn-accent h-11! w-full sm:w-auto sm:px-8!">
        {pending ? "Sending…" : "Apply to list"}
      </button>
    </form>
  );
}

function Field({ id, label, optional, children }: { id: string; label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {optional && <span className="font-normal text-neutral-500">(optional)</span>}
      </label>
      {children}
    </div>
  );
}
