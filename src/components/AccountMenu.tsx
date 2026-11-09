/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LayoutDashboard, LogOut, Settings, ShieldCheck } from "lucide-react";
import { logout } from "@/app/(auth)/logout-action";

export interface AccountMenuUser {
  name: string;
  role: string;
  isAdmin?: boolean;
  email: string | null;
  initials: string;
  avatarUrl: string | null;
}

export function Avatar({
  user,
  size = "sm",
}: {
  user: Pick<AccountMenuUser, "initials" | "avatarUrl">;
  size?: "sm" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dims = size === "lg" ? "h-16 w-16 text-lg" : "h-8 w-8 text-xs";

  if (user.avatarUrl && !failed) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        onError={() => setFailed(true)}
        className={`${dims} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`${dims} grid shrink-0 place-items-center rounded-full bg-neutral-900 font-semibold text-white`}
      aria-hidden
    >
      {user.initials}
    </span>
  );
}

export default function AccountMenu({ user }: { user: AccountMenuUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="group flex items-center gap-3 rounded-md py-1 pl-2 pr-1 transition-colors hover:bg-neutral-100"
      >
        <span className="hidden min-w-0 text-right leading-tight sm:block">
          <span className="block max-w-40 truncate text-sm font-medium text-neutral-900">{user.name}</span>
          <span className="block max-w-40 truncate text-xs text-neutral-500">{user.role}</span>
        </span>
        <span className="relative">
          <Avatar user={user} />
          <span
            className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm"
            aria-hidden
          >
            <ChevronDown className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={3} />
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-60 mt-2 w-60 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg"
        >
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              {user.email && <p className="truncate text-xs text-neutral-500">{user.email}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-neutral-200" />
          <Link href="/dashboard" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <LayoutDashboard className="h-4 w-4" aria-hidden /> Dashboard
          </Link>
          {user.isAdmin && (
            <Link href="/admin" role="menuitem" className={item} onClick={() => setOpen(false)}>
              <ShieldCheck className="h-4 w-4" aria-hidden /> Admin
            </Link>
          )}
          <Link href="/dashboard/account" role="menuitem" className={item} onClick={() => setOpen(false)}>
            <Settings className="h-4 w-4" aria-hidden /> Settings
          </Link>
          <div className="my-1 h-px bg-neutral-200" />
          <form action={logout}>
            <button type="submit" role="menuitem" className={item}>
              <LogOut className="h-4 w-4" aria-hidden /> Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
