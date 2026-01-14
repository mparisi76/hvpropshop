"use server";

import Stripe from "stripe";
import { Prop } from "@/types";
import { createItem } from "@directus/sdk";
import directus from "@/lib/directus";

// Initialize Stripe with your Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface ActionState {
  success: boolean;
  url?: string;
  error?: string;
}

export async function sendStripe(
  _prevState: ActionState,
  formData: FormData,
  item: Prop
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const start = formData.get("start") as string;
  const end = formData.get("end") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
	const message = (formData.get("message") as string) || "";

  // Calculate duration
  const days =
    Math.ceil(
      Math.abs(new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  try {
    // 1. Create a "Pending" record in Directus so we don't lose the lead
    const inquiry = await directus.request(
      createItem("inquiries", {
        prop_id: item.id,
        item_name: item.name,
        customer_name: name,
        customer_email: email,
        status: "pending_payment",
        start_date: start,
        end_date: end,
        quantity,
				message
      })
    );

    // 2. Create the Stripe Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              description: `Rental from ${start} to ${end}`,
            },
            unit_amount: (item.price || 0) * 100, // Stripe expects cents
          },
          quantity: quantity * days,
        },
      ],
      mode: "payment",
      // Where to go after payment
      success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/props/${item.id}`,
      // Pass the Inquiry ID so the Webhook can find it later
      metadata: {
        inquiry_id: inquiry.id,
      },
    });

    // 3. Return the URL to the frontend
    return { success: true, url: session.url as string };
  } catch (err) {
    console.error("Stripe Error:", err);
    return { success: false, error: "Payment system unavailable." };
  }
}
