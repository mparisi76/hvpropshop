"use client";

import ErrorContent from "@/components/ErrorContent";

// Errors inside public pages — keeps the site header/footer
export default function PublicError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorContent {...props} />;
}
