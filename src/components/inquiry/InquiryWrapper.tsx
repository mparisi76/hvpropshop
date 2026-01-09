"use client";

import { useSyncExternalStore } from "react";
import InquirySection from "./InquirySection";
import { Prop } from "@/types";

// Empty subscription function
const subscribe = () => () => {};

export default function InquiryWrapper({ item }: { item: Prop }) {
  // This returns 'false' on the server and 'true' on the client
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="h-13 w-full bg-slate-50 animate-pulse rounded-xl border border-slate-100" />
    );
  }

  return <InquirySection item={item} />;
}