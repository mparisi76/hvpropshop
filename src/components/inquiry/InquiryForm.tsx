"use client";

import { useActionState, useState } from "react";
import { Prop } from "@/types";
import { sendInquiry, ActionState } from "@/app/actions/sendInquiry";

interface InquiryFormProps {
  item: Prop;
  onClose: () => void;
}

export default function InquiryForm({ item, onClose }: InquiryFormProps) {
  const today = new Date().toLocaleDateString("en-CA");
  const initialState: ActionState = { success: false };
  const [minEndDate, setMinEndDate] = useState(today);
  const [state, formAction, isPending] = useActionState(
    (prevState: ActionState, formData: FormData) =>
      sendInquiry(prevState, formData, item),
    initialState
  );

  if (state?.success) {
    return (
      <div className="flex-1 flex flex-col justify-center animate-fade-in px-2">
        <div className="mb-8">
          <div className="w-12 h-12 border-2 border-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-900">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">
            Request Received
          </h2>
          <div className="w-12 h-1 bg-blue-600 mt-4" />
        </div>
        <p className="text-slate-600 text-sm leading-relaxed mb-12">
          Your inquiry for{" "}
          <span className="text-slate-900 font-bold">{item.name}</span> has been
          logged.
        </p>
        <button
          onClick={onClose}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8 flex-1 px-2">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">
          Inquiry
        </h2>
        <div className="flex flex-col gap-1 mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
          <p>
            Item: <span className="text-slate-900 underline">{item.name}</span>
          </p>
          <p>
            Vendor:{" "}
            <span className="text-slate-900">
              {item.user_created?.shop_name ||
                item.user_created?.first_name ||
                "Independent"}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Name
          </label>
          <input
            name="name"
            required
            type="text"
            className="w-full border-b border-slate-200 py-3 outline-none focus:border-blue-600 text-sm bg-transparent"
          />
        </div>
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Email
          </label>
          <input
            name="email"
            required
            type="email"
            className="w-full border-b border-slate-200 py-3 outline-none focus:border-blue-600 text-sm bg-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Start
            </label>
            <input
              name="start"
              required
              type="date"
              min={today}
              onChange={(e) => setMinEndDate(e.target.value)}
              className="w-full border-b border-slate-200 py-3 outline-none text-sm bg-transparent"
            />
          </div>
          <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              End
            </label>
            <input
              name="end"
              required
              type="date"
              min={minEndDate}
              className="w-full border-b border-slate-200 py-3 outline-none text-sm bg-transparent"
            />
          </div>
        </div>
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full border-b border-slate-200 py-3 outline-none resize-none text-sm bg-transparent"
            placeholder="Production notes..."
          />
        </div>
      </div>

      <div className="pt-4 pb-10">
        <button
          disabled={isPending}
          className="relative w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] bg-slate-900 text-white hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 shadow-xl transition-all"
        >
          {isPending ? "Sending..." : "Request Availability"}
        </button>
      </div>
    </form>
  );
}
