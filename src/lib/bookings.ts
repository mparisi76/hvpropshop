import { timingSafeEqual } from "node:crypto";
import { readItems } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";

/* ---------- Statuses (inquiries.status) ---------- */

export const BOOKING_STATUS = {
  /** Waiting for the vendor to accept or decline */
  pending: "pending",
  /** Vendor accepted; holding the item until the customer pays */
  accepted: "accepted",
  declined: "declined",
  paid: "paid",
  cancelled: "cancelled",
} as const;

export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export interface Booking {
  id: string | number;
  status: string;
  item_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  phone: string | null;
  production: string | null;
  start_date: string;
  end_date: string;
  quantity: number;
  total: number | null;
  message: string | null;
  decline_reason: string | null;
  payment_token: string | null;
  date_created?: string | null;
  /** The booked item, loaded separately (inquiries.prop_id is a plain id, not a relation) */
  prop_id: BookingProp | null;
}

export interface BookingProp {
  id: string | number;
  name: string;
  thumbnail: string | null;
  price: number | null;
  quantity_available: number | null;
  user_created: { id: string; email: string | null; shop_name: string | null; first_name: string | null } | null;
}

/** An inquiry row as stored: prop_id is the item's id as text. */
type RawBooking = Omit<Booking, "prop_id"> & { prop_id: string | number | null };

export const BOOKING_FIELDS = [
  "id",
  "status",
  "item_name",
  "customer_name",
  "customer_email",
  "phone",
  "production",
  "start_date",
  "end_date",
  "quantity",
  "total",
  "message",
  "decline_reason",
  "payment_token",
  "date_created",
  "prop_id",
] as const;

/** Attach each booking's item (and its vendor) — one query for all of them. */
async function withProps(rows: RawBooking[]): Promise<Booking[]> {
  const ids = [...new Set(rows.map((r) => r.prop_id).filter((x) => x != null && x !== ""))].map(String);
  const props = ids.length
    ? ((await asServer(
        readItems("props", {
          fields: [
            "id",
            "name",
            "thumbnail",
            "price",
            "quantity_available",
            { user_created: ["id", "email", "shop_name", "first_name"] },
          ],
          filter: { id: { _in: ids } },
          limit: -1,
        })
      )) as unknown as BookingProp[])
    : [];
  const byId = new Map(props.map((p) => [String(p.id), p]));
  return rows.map((r) => ({ ...r, prop_id: r.prop_id != null ? byId.get(String(r.prop_id)) ?? null : null }));
}

/** Ids (as text, to match inquiries.prop_id) of every item a vendor has listed. */
async function vendorPropIds(vendorId: string) {
  const rows = (await asServer(
    readItems("props", { fields: ["id"], filter: { user_created: { _eq: vendorId } }, limit: -1 })
  )) as unknown as { id: string | number }[];
  return rows.map((r) => String(r.id));
}

/* ---------- Dates & money ---------- */

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
export const isIsoDate = (s: string) => isoDate.test(s);

/** Days between two YYYY-MM-DD dates, counting both ends (Nov 1–Nov 3 = 3). */
export function rentalDays(start: string, end: string) {
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime();
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

export function bookingTotal(dailyRate: number, quantity: number, start: string, end: string) {
  return Math.round(dailyRate * quantity * rentalDays(start, end) * 100) / 100;
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

export function formatDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const formatMoney = (n: number | null | undefined) =>
  `$${Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Constant-time check of the private token in a payment link. */
export function tokenMatches(expected: string | null | undefined, given: string | null | undefined) {
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- Availability ---------- */

/**
 * Units of a prop free for every day in [start, end].
 *
 * Counts confirmed rentals (paid bookings + vendor blocks, where a block with
 * no end date runs indefinitely) and accepted requests still waiting on
 * payment (they hold the item). Overlapping reservations are summed, which is
 * conservative but never over-books.
 */
export async function getAvailableUnits(
  propId: string | number,
  totalUnits: number,
  start: string,
  end: string,
  excludeInquiryId?: string | number
) {
  const [rentals, holds] = await Promise.all([
    asServer(
      readItems("rentals", {
        fields: ["quantity"],
        filter: {
          _and: [
            { prop_id: { _eq: propId } },
            { status: { _eq: "confirmed" } },
            { start_date: { _lte: end } },
            { _or: [{ end_date: { _null: true } }, { end_date: { _gte: start } }] },
          ],
        },
        limit: -1,
      })
    ),
    asServer(
      readItems("inquiries", {
        fields: ["id", "quantity"],
        filter: {
          _and: [
            { prop_id: { _eq: String(propId) } },
            { status: { _eq: BOOKING_STATUS.accepted } },
            { start_date: { _lte: end } },
            { end_date: { _gte: start } },
          ],
        },
        limit: -1,
      })
    ),
  ]);

  const reserved =
    (rentals as { quantity: number | string }[]).reduce((n, r) => n + (Number(r.quantity) || 0), 0) +
    (holds as { id: string | number; quantity: number | string }[])
      .filter((h) => String(h.id) !== String(excludeInquiryId ?? ""))
      .reduce((n, h) => n + (Number(h.quantity) || 0), 0);

  return Math.max(0, (Number(totalUnits) || 0) - reserved);
}

/* ---------- Vendor queries ---------- */

/** All booking requests for a vendor's items, newest first. */
export async function getVendorBookings(vendorId: string) {
  const propIds = await vendorPropIds(vendorId);
  if (propIds.length === 0) return [] as Booking[];
  const rows = (await asServer(
    readItems("inquiries", {
      fields: [...BOOKING_FIELDS],
      filter: {
        _and: [{ prop_id: { _in: propIds } }, { status: { _in: Object.values(BOOKING_STATUS) } }],
      },
      sort: ["-date_created"],
      limit: 200,
    })
  )) as unknown as RawBooking[];
  return withProps(rows);
}

export async function getPendingCount(vendorId: string) {
  try {
    const propIds = await vendorPropIds(vendorId);
    if (propIds.length === 0) return 0;
    const [row] = (await asServer(
      readItems("inquiries", {
        aggregate: { count: "*" },
        filter: { _and: [{ prop_id: { _in: propIds } }, { status: { _eq: BOOKING_STATUS.pending } }] },
      })
    )) as unknown as { count: string | number }[];
    return Number(row?.count) || 0;
  } catch {
    return 0;
  }
}

/** A single booking (server access — check ownership/token before using). */
export async function getBooking(id: string | number) {
  const rows = (await asServer(
    readItems("inquiries", {
      fields: [...BOOKING_FIELDS],
      filter: { id: { _eq: id } },
      limit: 1,
    })
  )) as unknown as RawBooking[];
  if (rows.length === 0) return null;
  const [booking] = await withProps(rows);
  return booking;
}

/* ---------- Blocks (vendor-entered unavailability, stored as rentals) ---------- */

export interface Block {
  id: string | number;
  prop_id: string | number;
  start_date: string;
  end_date: string | null;
  quantity: number;
  note: string | null;
}

/** Current and upcoming blocks for the given props. */
export async function getActiveBlocks(propIds: (string | number)[]) {
  if (propIds.length === 0) return [] as Block[];
  return (await asServer(
    readItems("rentals", {
      fields: ["id", "prop_id", "start_date", "end_date", "quantity", "note"],
      filter: {
        _and: [
          { prop_id: { _in: propIds } },
          { kind: { _eq: "block" } },
          { status: { _eq: "confirmed" } },
          { _or: [{ end_date: { _null: true } }, { end_date: { _gte: todayIso() } }] },
        ],
      },
      sort: ["start_date"],
      limit: -1,
    })
  )) as unknown as Block[];
}
