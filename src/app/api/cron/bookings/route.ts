import { NextResponse } from "next/server";
import { runDailyBookingJobs } from "@/lib/bookingJobs";

export const dynamic = "force-dynamic";

/**
 * Daily booking jobs (reminders, releasing unpaid holds).
 * Called once a day by a Coolify Scheduled Task with
 * `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await runDailyBookingJobs());
  } catch (error) {
    console.error("[cron] Booking jobs failed:", error);
    return NextResponse.json({ error: "Booking jobs failed" }, { status: 500 });
  }
}
