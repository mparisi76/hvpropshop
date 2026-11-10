"use client";

import ErrorContent from "@/components/ErrorContent";

// Errors inside the dashboard, admin and login pages
export default function AuthError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorContent {...props} />;
}
