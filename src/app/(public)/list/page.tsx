import { Suspense } from "react";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import PullListView from "@/components/pullList/PullListView";

export const metadata: Metadata = pageMeta({
  title: "Pull list | HV Prop Shop",
  path: "/list",
  noindex: true,
});

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
