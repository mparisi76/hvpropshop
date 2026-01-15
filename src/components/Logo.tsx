import Link from "next/link";

export default function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <Link href="/" className="text-xl font-black tracking-tighter hover:opacity-80 transition flex items-center">
      <span className={variant === "dark" ? "text-slate-900" : "text-white"}>
        HV
      </span>
      <span className="text-blue-600">
        PROPSHOP
      </span>
    </Link>
  );
}