import Script from "next/script";

/**
 * Privacy-friendly analytics (no cookies, no banner needed). Configure ONE of:
 *
 *   Umami (e.g. self-hosted on Coolify):
 *     NEXT_PUBLIC_UMAMI_SRC=https://analytics.yourdomain.com/script.js
 *     NEXT_PUBLIC_UMAMI_WEBSITE_ID=<website id from Umami>
 *
 *   Plausible (hosted):
 *     NEXT_PUBLIC_PLAUSIBLE_DOMAIN=hvpropshop.com
 *     NEXT_PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.js   (optional)
 *
 * Nothing loads when unconfigured, or outside production.
 */
export default function Analytics() {
  if (process.env.NODE_ENV !== "production") return null;

  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (umamiSrc && umamiId) {
    return <Script src={umamiSrc} data-website-id={umamiId} strategy="afterInteractive" />;
  }

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (plausibleDomain) {
    return (
      <Script
        src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js"}
        data-domain={plausibleDomain}
        strategy="afterInteractive"
      />
    );
  }

  return null;
}
