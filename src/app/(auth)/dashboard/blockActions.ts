"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createItem, deleteItem, readItems } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { getActionToken } from "@/lib/actionSession";
import { getCurrentUser } from "@/lib/currentUser";
import { isIsoDate } from "@/lib/bookings";

type Result = { error?: string };

async function requireVendorId() {
  await getActionToken(); // renews the session if needed
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user.id;
}

/** The prop, only if it belongs to the vendor. */
async function ownedProp(vendorId: string, propId: string) {
  const [prop] = (await asServer(
    readItems("props", {
      fields: ["id", "quantity_available"],
      filter: { _and: [{ id: { _eq: propId } }, { user_created: { _eq: vendorId } }] },
      limit: 1,
    })
  )) as unknown as { id: string | number; quantity_available: number | null }[];
  return prop ?? null;
}

function revalidate(propId: string | number) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/props/${propId}`);
}

export async function addBlock(input: {
  propId: string;
  start: string;
  /** Empty = until further notice */
  end: string;
  /** "all" or a number of units */
  quantity: string;
  note: string;
}): Promise<Result> {
  const vendorId = await requireVendorId();

  if (!isIsoDate(input.start)) return { error: "Choose a start date." };
  if (input.end && !isIsoDate(input.end)) return { error: "Check the end date." };
  if (input.end && input.end < input.start) return { error: "The end date is before the start date." };

  try {
    const prop = await ownedProp(vendorId, input.propId);
    if (!prop) return { error: "Listing not found." };

    const total = Math.max(1, Number(prop.quantity_available) || 1);
    const quantity = input.quantity === "all" ? total : Math.min(total, Math.max(1, parseInt(input.quantity) || 1));

    await asServer(
      createItem("rentals", {
        kind: "block",
        status: "confirmed",
        prop_id: prop.id,
        start_date: input.start,
        end_date: input.end || null,
        quantity,
        note: input.note.trim().slice(0, 200) || null,
      })
    );
    revalidate(prop.id);
  } catch (error) {
    console.error("Add block error:", error);
    return { error: "Couldn't save. Please try again." };
  }
  return {};
}

export async function removeBlock(blockId: string): Promise<Result> {
  const vendorId = await requireVendorId();
  try {
    // prop_id may be a relation or plain text — read just the id either way
    const [block] = (await asServer(
      readItems("rentals", {
        fields: ["id", "prop_id"],
        filter: { _and: [{ id: { _eq: blockId } }, { kind: { _eq: "block" } }] },
        limit: 1,
      })
    )) as unknown as { id: string | number; prop_id: string | number | null }[];

    const prop = block?.prop_id != null ? await ownedProp(vendorId, String(block.prop_id)) : null;
    if (!block || !prop) return { error: "Block not found." };

    await asServer(deleteItem("rentals", block.id));
    revalidate(prop.id);
  } catch (error) {
    console.error("Remove block error:", error);
    return { error: "Couldn't remove. Please try again." };
  }
  return {};
}
