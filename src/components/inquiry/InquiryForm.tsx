"use client";

import { useActionState, useState, useMemo } from "react";
import { Prop } from "@/types";
import { sendInquiry, ActionState } from "@/app/actions/sendInquiry";

interface InquiryFormProps {
  item: Prop;
  onClose: () => void;
}

export default function InquiryForm({ item, onClose }: InquiryFormProps) {
  const today = new Date().toLocaleDateString("en-CA");
  const initialState: ActionState = { success: false };
  
  // State for dynamic calculations
  const [dates, setDates] = useState({ start: "", end: "" });
  const [selectedQty, setSelectedQty] = useState(1);
  
  const dailyPrice = item.price || 0;
  const maxAvailable = item.quantity_available ?? 1;

  // Calculate rental duration and total cost
  const { days, total } = useMemo(() => {
    if (!dates.start || !dates.end) return { days: 0, total: 0 };
    
    const start = new Date(dates.start);
    const end = new Date(dates.end);
    
    // Calculate difference in days (inclusive of start/end)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      days: diffDays,
      total: diffDays * dailyPrice * selectedQty
    };
  }, [dates, selectedQty, dailyPrice]);

  const [state, formAction, isPending] = useActionState(
    (prevState: ActionState, formData: FormData) =>
      sendInquiry(prevState, formData, item),
    initialState
  );

  // 1. SUCCESS STATE
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
          className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  // 2. "SOLD OUT" STATE
  if (maxAvailable <= 0) {
    return (
      <div className="flex-1 flex flex-col justify-center animate-fade-in px-2">
        <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">
          Fully Booked
        </h2>
        <p className="text-slate-600 text-sm mt-4 mb-8">
          This item is currently unavailable for the selected period.
        </p>
        <button onClick={onClose} className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400">
          Back to Props
        </button>
      </div>
    );
  }

  // 3. ACTIVE FORM STATE
  return (
    <form action={formAction} className="space-y-8 flex-1 px-2">
      <div>
        <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase leading-none">
          Inquiry
        </h2>
        <div className="flex flex-col gap-1 mt-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
          <p>
            Item: <span className="text-slate-900 underline underline-offset-4 decoration-slate-200">{item.name}</span>
          </p>
          <p>
            Vendor:{" "}
            <span className="text-slate-900">
              {item.user_created?.shop_name || "Independent"}
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Name (Full Row) */}
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

        {/* Email (Full Row) */}
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

        {/* Quantity Dropdown */}
        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Quantity <span className="text-blue-600">({maxAvailable} available)</span>
          </label>
          <div className="relative">
            <select
              name="quantity"
              required
              onChange={(e) => setSelectedQty(parseInt(e.target.value))}
              className="w-full border-b border-slate-200 py-3 outline-none focus:border-blue-600 text-sm bg-transparent appearance-none cursor-pointer"
            >
              {Array.from({ length: maxAvailable }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i + 1 === 1 ? "Unit" : "Units"}
                </option>
              ))}
            </select>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Date Inputs */}
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
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) => setDates({ ...dates, start: e.target.value })}
              className="w-full border-b border-slate-200 py-3 outline-none text-sm bg-transparent cursor-pointer"
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
              min={dates.start || today}
              onClick={(e) => e.currentTarget.showPicker()}
              onChange={(e) => setDates({ ...dates, end: e.target.value })}
              className="w-full border-b border-slate-200 py-3 outline-none text-sm bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* Price Summary Box */}
        {days > 0 && dailyPrice > 0 && (
          <div className="bg-slate-50 p-6 rounded-2xl space-y-3 animate-fade-in border border-slate-100">
            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-slate-400">
              <span>Duration</span>
              <span className="text-slate-900">{days} {days === 1 ? 'Day' : 'Days'}</span>
            </div>
            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-slate-400">
              <span>Daily Rate</span>
              <span className="text-slate-900">${dailyPrice}</span>
            </div>
            <div className="h-px bg-slate-200 my-2" />
            <div className="flex justify-between items-end">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-blue-600">Est. Total</span>
              <span className="text-2xl font-black text-slate-900 leading-none">
                ${total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="group">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            rows={2}
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