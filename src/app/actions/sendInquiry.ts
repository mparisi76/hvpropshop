'use server';

import { Resend } from 'resend';
import { Prop } from '@/types';

// Initialize Resend with your API Key (Add this to your .env file)
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
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const start = formData.get('start') as string;
  const end = formData.get('end') as string;
  const notes = formData.get('notes') as string;

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await resend.emails.send({
      from: 'Prop Vault <onboarding@hvpropshop.com>', // You can change this once you verify a domain
      to: ['mattlparisi@gmail.com'], // Put your email here!
      subject: `New Inquiry: ${item.name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1a1a1a;">New Prop Inquiry</h2>
          <p><strong>Prop:</strong> ${item.name} (ID: ${item.id})</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p><strong>Client:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Dates:</strong> ${start} to ${end}</p>
          <p><strong>Notes:</strong> ${notes}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Server Error:', err);
    return { success: false, error: "Something went wrong on our end." };
  }
}