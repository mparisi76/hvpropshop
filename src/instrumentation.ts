import type { Instrumentation } from "next";

export async function register() {}

/**
 * Called by Next.js for every unhandled server error (pages, server actions,
 * route handlers). Emails an alert via lib/alerts.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportError } = await import("./lib/alerts");
  await reportError(`Server error on ${request.method} ${request.path}`, error, {
    route: context.routePath,
    type: `${context.routerKind} ${context.routeType}`,
    ...(context.renderSource ? { source: context.renderSource } : {}),
  });
};
