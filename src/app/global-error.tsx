"use client";

// Last resort: an error in the root layout itself. Must render its own <html>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "-apple-system, Segoe UI, sans-serif", color: "#171717", margin: 0 }}>
        <div style={{ maxWidth: 480, margin: "15vh auto", padding: "0 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: "#525252" }}>Sorry about that. We&apos;ve been notified.</p>
          <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{ background: "#171717", color: "#fff", border: 0, borderRadius: 6, padding: "10px 16px", cursor: "pointer" }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ border: "1px solid #d4d4d4", borderRadius: 6, padding: "10px 16px", color: "#171717", textDecoration: "none" }}>
              Go home
            </a>
          </div>
          {error.digest && <p style={{ marginTop: 32, fontSize: 12, color: "#a3a3a3" }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
