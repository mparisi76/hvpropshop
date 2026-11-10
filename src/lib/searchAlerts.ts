import { randomUUID } from "node:crypto";
import { createItem, readItems, updateItem } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { queryProps } from "@/lib/props";
import { emailSearchAlertMatch } from "@/lib/bookingEmails";
import { categoryPath } from "@/lib/browse";

/** Search alerts ("Notify me"), stored in the search_alerts collection. */

const ALERT_DAYS = 90;

export interface SearchAlert {
  id: string | number;
  email: string;
  query: string;
  category: string | null;
  near: string | null;
  radius: number | null;
  status: string;
  token: string;
  date_created: string;
}

/** Create an alert (or keep the existing one for the same email + search). */
export async function createSearchAlert(input: {
  email: string;
  query: string;
  category?: string | null;
  near?: string | null;
  radius?: number | null;
}) {
  const email = input.email.trim().toLowerCase();
  const query = input.query.trim().slice(0, 120);
  const [existing] = (await asServer(
    readItems("search_alerts", {
      fields: ["id"],
      filter: {
        _and: [
          { email: { _eq: email } },
          { query: { _eq: query } },
          { category: input.category ? { _eq: input.category } : { _null: true } },
          { status: { _eq: "active" } },
        ],
      },
      limit: 1,
    })
  )) as unknown as { id: string | number }[];
  if (existing) return { created: false };

  await asServer(
    createItem("search_alerts", {
      email,
      query,
      category: input.category || null,
      near: input.near || null,
      radius: input.radius || null,
      status: "active",
      token: randomUUID(),
    })
  );
  return { created: true };
}

/** Where the "see all results" link in the alert email goes. */
function resultsPath(a: Pick<SearchAlert, "query" | "category" | "near" | "radius">) {
  const params = new URLSearchParams({ search: a.query });
  if (a.near) params.set("near", a.near);
  if (a.near && a.radius) params.set("radius", String(a.radius));
  return `${a.category ? categoryPath(a.category) : "/"}?${params.toString()}`;
}

/**
 * Daily: email each active alert that has new matching listings (once — the
 * alert then closes), and expire alerts older than ALERT_DAYS.
 */
export async function runSearchAlerts() {
  const result = { checked: 0, notified: 0, expired: 0 };
  const alerts = (await asServer(
    readItems("search_alerts", {
      fields: ["id", "email", "query", "category", "near", "radius", "status", "token", "date_created"],
      filter: { status: { _eq: "active" } },
      sort: ["date_created"],
      limit: 500,
    })
  )) as unknown as SearchAlert[];

  const expiresBefore = Date.now() - ALERT_DAYS * 86_400_000;
  for (const a of alerts) {
    result.checked++;
    if (new Date(a.date_created).getTime() < expiresBefore) {
      await asServer(updateItem("search_alerts", a.id, { status: "expired" }));
      result.expired++;
      continue;
    }

    const { items, total } = await queryProps({
      search: a.query.toLowerCase(),
      category: a.category,
      near: a.near,
      radius: a.radius,
      createdAfter: a.date_created,
      sort: "newest",
    });
    if (total === 0 || items.length === 0) continue;

    await emailSearchAlertMatch({
      to: a.email,
      query: a.query,
      items: items.slice(0, 3),
      total,
      resultsPath: resultsPath(a),
      unsubscribePath: `/alerts/unsubscribe?t=${encodeURIComponent(a.token)}`,
    });
    await asServer(updateItem("search_alerts", a.id, { status: "notified", notified_at: new Date().toISOString() }));
    result.notified++;
  }
  return result;
}

/** Turn off an alert from the link in its email. */
export async function unsubscribeSearchAlert(token: string) {
  if (!token) return false;
  const [alert] = (await asServer(
    readItems("search_alerts", { fields: ["id"], filter: { token: { _eq: token } }, limit: 1 })
  )) as unknown as { id: string | number }[];
  if (!alert) return false;
  await asServer(updateItem("search_alerts", alert.id, { status: "unsubscribed" }));
  return true;
}
