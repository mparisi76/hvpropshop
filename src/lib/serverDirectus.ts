import { withToken, type RestCommand } from "@directus/sdk";
import directus from "@/lib/directus";

/**
 * Run a Directus request as the site itself (not a visitor or vendor).
 *
 * Used where there's no logged-in user (Stripe webhooks, payment links) or
 * where the site must read private data (bookings, customer details).
 *
 * Requires DIRECTUS_SERVER_TOKEN: a static token for a dedicated Directus
 * user (e.g. "HV Prop Shop site") whose policy only allows what bookings need.
 */
// async so a missing token becomes a rejected promise that callers can .catch().
// The shared client has no typed schema, so commands are RestCommand<…, any>.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function asServer<Output>(command: RestCommand<Output, any>) {
  const token = process.env.DIRECTUS_SERVER_TOKEN;
  if (!token) {
    throw new Error("DIRECTUS_SERVER_TOKEN is not set — bookings can't be processed.");
  }
  return directus.request(withToken(token, command));
}
