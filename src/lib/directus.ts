import { createDirectus, rest } from "@directus/sdk";

/**
 * Shared Directus client. It holds no login state — it's used by every visitor
 * on the server. Vendor requests pass their own token with `withToken(token, …)`;
 * login/refresh/logout live in src/lib/session.ts.
 */
const directus = createDirectus(process.env.NEXT_PUBLIC_DIRECTUS_URL!).with(rest());

export default directus;
