import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Prop } from "@/types";
import PullListButton from "./PullListButton";

export default function PropCard({ item }: { item: Prop }) {
  const isRented = item.availability === "rented";
  const title = item.name || "Untitled prop";
  const vendor = item.user_created?.shop_name || item.user_created?.first_name;
  const location = [item.user_created?.city, item.user_created?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative">
      <Link href={`/props/${item.id}`} className="group block">
        <div className="relative aspect-4/3 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
          {item.thumbnail ? (
            <Image
              src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${item.thumbnail}?width=600&height=450&fit=cover`}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-opacity group-hover:opacity-90"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-neutral-400">
              No photo
            </div>
          )}
          {isRented && (
            <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-xs font-medium text-neutral-700 shadow-sm">
              On a job
            </span>
          )}
        </div>

        <div className="mt-2.5 space-y-0.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-neutral-900 group-hover:underline group-hover:underline-offset-2">
              {title}
            </h3>
            {item.price != null && (
              <p className="shrink-0 text-sm tabular-nums text-neutral-900">
                ${item.price.toLocaleString()}
                <span className="text-neutral-500">/day</span>
              </p>
            )}
          </div>
          {(vendor || location) && (
            <p className="flex items-center gap-1 truncate text-xs text-neutral-500">
              {location && <MapPin className="h-3 w-3 shrink-0" aria-hidden />}
              <span className="truncate">
                {[vendor, location].filter(Boolean).join(" · ")}
              </span>
            </p>
          )}
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <PullListButton id={item.id} variant="icon" />
      </div>
    </div>
  );
}
