import { Suspense } from "react";
import type { Metadata } from "next";
import PullListView from "@/components/pullList/PullListView";

export const metadata: Metadata = {
  title: "Pull list | HV Prop Shop",
};

export default function PullListPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-neutral-100" />
        </div>
      }
    >
      <PullListView />
    </Suspense>
  );
}
