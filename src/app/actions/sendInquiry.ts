"use server";

import { Resend } from "resend";
import { Prop } from "@/types";
import { createItem } from "@directus/sdk";
import directus from "@/lib/directus";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface ActionState {
  success: boolean;
  error?: string;
}

export async function sendInquiry(
  _prevState: ActionState,
  formData: FormData,
  item: Prop
): Promise<ActionState> {
  // 1. Extract and sanitize form data
  const name = (formData.get("name") as string) || "Anonymous";
  const email = (formData.get("email") as string) || "";
  const start = formData.get("start") as string;
  const end = formData.get("end") as string;
  const notes = (formData.get("notes") as string) || "";
  const quantityString = formData.get("quantity") as string;
  const quantity = parseInt(quantityString, 10) || 1;

  // 2. Safely handle vendor info
  const vendorEmail = item.user_created?.email || "hudsonvalleypropshop@gmail.com";
  const vendorName = item.user_created?.first_name || "Vendor";

  try {
    // 3. Create the entry in Directus FIRST
    await directus.request(
      createItem("inquiries", {
        prop_id: item.id,
        item_name: item.name,
        customer_name: name,
        customer_email: email,
        vendor_email: vendorEmail,
        message: notes,
        status: "new",
        start_date: start,
        end_date: end,
        quantity: quantity,
      })
    );

    // 4. Send the Email Notification via Resend
    const { error: resendError } = await resend.emails.send({
      from: "Prop Vault <onboarding@hvpropshop.com>", 
      to: vendorEmail,
      replyTo: email,
      subject: `New Inquiry: ${item.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; text-transform: uppercase; letter-spacing: -0.025em; font-weight: 800; margin-bottom: 8px;">Hi ${vendorName},</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">You have received a new availability request for your item.</p>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Item Requested</p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #0f172a;">${item.name} (Qty: ${quantity})</p>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Customer Details</p>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          </div>

          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Requested Dates</p>
            <p style="margin: 4px 0;">${start} — ${end}</p>
          </div>

          ${notes ? `
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: bold;">Production Notes</p>
            <p style="margin: 4px 0; font-style: italic;">"${notes}"</p>
          </div>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Log into Prop Vault to confirm this booking.</p>
        </div>
      `,
    });

    if (resendError) {
      console.error("Resend Error (Inquiry still saved):", resendError);
    }

    // Now correctly using vendorName and vendorEmail in the log
    console.log(`Inquiry logged for ${item.name}. Notification sent to ${vendorName} (${vendorEmail})`);
    
    return { success: true };

  } catch (err) {
    console.error("Action Error:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to log inquiry." 
    };
  }
}