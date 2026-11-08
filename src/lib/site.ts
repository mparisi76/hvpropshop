export const CONTACT_EMAIL = "hudsonvalleypropshop@gmail.com";

/** The business runs on New York time — "today" means today there, not in UTC. */
export const BUSINESS_TIME_ZONE = "America/New_York";

/** Today's date (YYYY-MM-DD) in New York, regardless of the server's timezone. */
export function businessToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Absolute base URL for links in emails and Stripe redirects. */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}
