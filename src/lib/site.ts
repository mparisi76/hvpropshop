export const CONTACT_EMAIL = "hudsonvalleypropshop@gmail.com";

/** The business runs on New York time — "today" means today there, not in UTC. */
export const BUSINESS_TIME_ZONE = "America/New_York";

/** A moment's date (YYYY-MM-DD) in New York. */
export function businessDate(moment: Date | string | number = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(moment));
}

/** Today's date (YYYY-MM-DD) in New York, regardless of the server's timezone. */
export function businessToday() {
  return businessDate();
}

/** Shift a YYYY-MM-DD date by whole days. */
export function addDays(date: string, days: number) {
  const d = new Date(`${date.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Absolute base URL for links in emails and Stripe redirects.
 * SITE_URL is read at runtime (set it in Coolify); the NEXT_PUBLIC_ ones are
 * baked in at build time and kept as fallbacks.
 */
export function siteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}
