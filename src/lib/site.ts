export const CONTACT_EMAIL = "hudsonvalleypropshop@gmail.com";

/** Absolute base URL for links in emails and Stripe redirects. */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}
