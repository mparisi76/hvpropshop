"use client";

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Avatar, type AccountMenuUser } from "@/components/AccountMenu";
import { compressImage } from "@/lib/images";
import { logout } from "@/app/(auth)/logout-action";
import PasswordInput from "@/components/ui/PasswordInput";
import {
  removeAvatar,
  updateAvatar,
  updateDetails,
  updateEmail,
  updatePassword,
  type AccountState,
} from "./actions";

export interface AccountUser {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  shop_name?: string | null;
}

export default function AccountForms({
  user,
  avatar,
}: {
  user: AccountUser;
  avatar: AccountMenuUser;
}) {
  return (
    <div className="mt-6 space-y-6">
      <PhotoForm avatar={avatar} />
      <DetailsForm user={user} />
      <EmailForm email={user.email ?? ""} />
      <PasswordForm />

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="text-base font-semibold">Sign out</h2>
          <p className="text-sm text-neutral-500">
            You stay signed in on this device until you sign out.
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-secondary">
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}

/* ---------- Submit handling ---------- */

/**
 * Like useActionState, but submits manually so React doesn't clear the form
 * after every submit. Fields keep what was typed when there's an error, and
 * reset only after a successful save (to their new defaults — empty for passwords).
 */
function useAccountForm(fn: (prev: AccountState, formData: FormData) => Promise<AccountState>) {
  const [state, action, pending] = useActionState<AccountState, FormData>(fn, null);
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  };

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return { state, pending, formRef, onSubmit };
}

/* ---------- Sections ---------- */

function PhotoForm({ avatar }: { avatar: AccountMenuUser }) {
  const [state, setState] = useState<AccountState>(null);
  const [pending, startPhoto] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const upload = (file: File | undefined) => {
    if (!file) return;
    startPhoto(async () => {
      const small = await compressImage(file, 512, 0.9);
      const fd = new FormData();
      fd.append("avatar", small);
      setState(await updateAvatar(fd));
      if (input.current) input.current.value = "";
    });
  };

  const remove = () =>
    startPhoto(async () => {
      setState(await removeAvatar());
    });

  return (
    <Section title="Profile photo" description="Shown in the menu at the top right. Your initials are used if there's no photo.">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Avatar user={avatar} size="lg" />
          {pending && (
            <span className="absolute inset-0 grid place-items-center rounded-full bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-700" aria-hidden />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`btn-secondary cursor-pointer ${pending ? "pointer-events-none opacity-50" : ""}`}>
            {avatar.avatarUrl ? "Change photo" : "Upload photo"}
            <input
              ref={input}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
          {avatar.avatarUrl && (
            <button type="button" onClick={remove} disabled={pending} className="btn-ghost">
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
    </Section>
  );
}

function DetailsForm({ user }: { user: AccountUser }) {
  const { state, pending, formRef, onSubmit } = useAccountForm(updateDetails);
  const v = { first_name: user.first_name ?? "", last_name: user.last_name ?? "", phone: user.phone ?? "", ...state?.values };

  return (
    <Section title="Your details" description="So HV Prop Shop can reach you about requests.">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="first_name">
            <input id="first_name" name="first_name" defaultValue={v.first_name} autoComplete="given-name" className="input" />
          </Field>
          <Field label="Last name" htmlFor="last_name">
            <input id="last_name" name="last_name" defaultValue={v.last_name} autoComplete="family-name" className="input" />
          </Field>
        </div>
        <Field label="Phone" htmlFor="phone">
          <input id="phone" name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" className="input" />
        </Field>
        <Footer state={state} pending={pending} label="Save details" />
      </form>
    </Section>
  );
}

function EmailForm({ email }: { email: string }) {
  const { state, pending, formRef, onSubmit } = useAccountForm(updateEmail);
  // Latest value: what was just submitted (saved or not), else the saved email
  const value = state?.values?.email ?? email;

  return (
    <Section title="Login email" description="The address you log in with.">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={value}
            className="input"
          />
        </Field>
        <Field label="Current password" htmlFor="email_current_password" hint="Required to change your email.">
          <PasswordInput
            id="email_current_password"
            name="current_password"
            required
            autoComplete="current-password"
          />
        </Field>
        <Footer state={state} pending={pending} label="Change email" />
      </form>
    </Section>
  );
}

function PasswordForm() {
  const { state, pending, formRef, onSubmit } = useAccountForm(updatePassword);

  return (
    <Section title="Password">
      <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
        <Field label="Current password" htmlFor="current_password">
          <PasswordInput
            id="current_password"
            name="current_password"
            required
            autoComplete="current-password"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="New password" htmlFor="new_password" hint="At least 8 characters.">
            <PasswordInput
              id="new_password"
              name="new_password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirm_password">
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <Footer state={state} pending={pending} label="Change password" />
      </form>
    </Section>
  );
}

/* ---------- Building blocks ---------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card space-y-5 p-6">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      {children}
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

function Footer({ state, pending, label }: { state: AccountState; pending: boolean; label: string }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {state?.error && <p className="mr-auto text-sm text-red-700" role="alert">{state.error}</p>}
      {state?.success && !pending && (
        <p className="mr-auto flex items-center gap-1 text-sm text-accent" role="status">
          <Check className="h-4 w-4" /> {state.success}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}
