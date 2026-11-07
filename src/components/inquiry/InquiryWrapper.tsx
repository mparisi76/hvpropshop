"use client";

import { useSyncExternalStore } from "react";
import InquirySection from "./InquirySection";
import { Prop } from "@/types";

// Empty subscription function
const subscribe = () => () => {};

export default function InquiryWrapper({
  item,
  compact = false,
}: {
  item: Prop;
  compact?: boolean;
}) {
  // false on the server, true on the client
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return <div className="h-10 w-full animate-pulse rounded-md bg-neutral-100" />;
  }

  return <InquirySection item={item} compact={compact} />;
}
