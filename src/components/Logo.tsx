import Link from "next/link";

export default function Logo({
  variant = "dark",
  compact = false,
}: {
  variant?: "dark" | "light";
  /** Show only the "HV" mark on small screens */
  compact?: boolean;
}) {
  const isDark = variant === "dark";
  return (
    <Link
      href="/"
      className="flex items-center gap-2 shrink-0"
      aria-label="HV Prop Shop home"
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-md text-[11px] font-bold tracking-tight ${
          isDark ? "bg-neutral-900 text-white" : "bg-white text-neutral-900"
        }`}
      >
        HV
      </span>
      <span
        className={`text-[15px] font-semibold tracking-tight ${compact ? "hidden sm:inline " : ""}${
          isDark ? "text-neutral-900" : "text-white"
        }`}
      >
        Prop Shop
      </span>
    </Link>
  );
}
