import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import directus from "@/lib/directus";
import { readItem, createItem, updateItem } from "@directus/sdk";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const inquiryId = session.metadata?.inquiry_id;

    if (inquiryId) {
      try {
        // 1. Fetch the data from the Inquiry collection
        const inquiry = await directus.request(
          readItem("inquiries", inquiryId)
        );

        if (!inquiry) {
          throw new Error(`Inquiry ${inquiryId} not found in database.`);
        }

        // 2. Create the permanent record in the Rentals collection
        await directus.request(
          createItem("rentals", {
            prop_id: inquiry.prop_id,
            customer_name: inquiry.customer_name,
            customer_email: inquiry.customer_email,
            start_date: inquiry.start_date,
            end_date: inquiry.end_date,
            quantity: inquiry.quantity,
            total_paid: (session.amount_total || 0) / 100,
            source_inquiry: inquiry.id,
            status: "confirmed",
            stripe_payment_id: session.payment_intent as string,
          })
        );

        // 3. Mark the Inquiry as 'processed' (Ensure this exists in your Directus status choices)
        await directus.request(
          updateItem("inquiries", inquiryId, {
            status: "processed",
          })
        );

				const propId = typeof inquiry.prop_id === 'object' ? inquiry.prop_id.id : inquiry.prop_id;
				const prop = await directus.request(readItem("props", propId));
				
				console.log(`Checking Prop ID: ${propId} | Current Stock: ${prop?.quantity_available}`);

				if (prop) {
					const currentStock = Number(prop.quantity_available) || 0;
					const subtractQty = Number(inquiry.quantity) || 0;

					await directus.request(updateItem("props", propId, {
						quantity_available: currentStock - subtractQty
					}));
					console.log("✅ Stock updated successfully");
				}

        console.log(`✅ Success: Inquiry ${inquiryId} promoted to Rental.`);
      } catch (error: unknown) {
        console.error(
          "❌ Database Error:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
