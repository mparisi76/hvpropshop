"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { usePullList } from "@/lib/pullList";

export default function PullListNavLink() {
  const { ids } = usePullList();
  const pathname = usePathname();
  const count = ids.length;
  const active = pathname === "/list";

  return (
    <Link
      href="/list"
      title="Pull list"
      aria-label={`Pull list${count ? `, ${count} items` : ""}`}
      aria-current={active ? "page" : undefined}
      className={`relative inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium transition-colors hover:bg-neutral-100 ${
        active ? "bg-neutral-100 text-neutral-900" : "text-neutral-600 hover:text-neutral-900"
      }`}
    >
      <ClipboardList className="h-[18px] w-[18px]" aria-hidden />
      <span className="hidden lg:inline">Pull list</span>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold tabular-nums text-white lg:static lg:h-5 lg:min-w-5 lg:px-1.5 lg:text-[11px]">
          {count}
        </span>
      )}
    </Link>
  );
}
