'use client';

import { useState, useActionState } from 'react';
import { Prop } from '@/types';
import ShareButton from './ShareButton';
import { sendInquiry, ActionState } from '@/app/actions/sendInquiry';

// --- SUB-COMPONENT: Manages Form & Pending State ---
function InquiryFormContent({ item, onClose }: { item: Prop, onClose: () => void }) {
  const initialState: ActionState = { success: false };
  
  // useActionState gives us the 'isPending' boolean automatically
  const [state, formAction, isPending] = useActionState(
    (prevState: ActionState, formData: FormData) => sendInquiry(prevState, formData, item),
    initialState
  );

  // 1. Success View
  if (state?.success) {
    return (
      <div className="flex-1 flex flex-col justify-center animate-fade-in">
        <div className="mb-8">
          <div className="w-12 h-12 border-2 border-slate-900 rounded-full flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Request Received</h2>
          <div className="w-12 h-1 bg-blue-600 mt-4" />
        </div>

        <div className="space-y-4 text-slate-600 text-sm leading-relaxed max-w-70">
          <p>
            Your inquiry for the <span className="text-slate-900 font-bold">{item.name}</span> has been logged in our system.
          </p>
          <p>
            A rental coordinator will review your dates and project notes and follow up via email within 24 hours.
          </p>
        </div>

        <button 
          onClick={onClose}
          className="mt-12 self-start text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors"
        >
          Return to Gallery 
        </button>
      </div>
    );
  }

  // 2. Form View (with isPending logic)
  return (
    <form action={formAction} className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
      <div className="mb-10">
        <h2 className="text-2xl font-black tracking-tighter text-slate-900">Inquiry</h2>
        <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest font-bold">
          Item: <span className="text-slate-900 underline decoration-blue-600/30">{item.name}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Name</label>
          <input name="name" required type="text" className="w-full border-b border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors text-sm" />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
          <input name="email" required type="email" className="w-full border-b border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rental Start</label>
            <input name="start" required type="date" className="w-full border-b border-slate-200 py-3 outline-none text-sm" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rental End</label>
            <input name="end" required type="date" className="w-full border-b border-slate-200 py-3 outline-none text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes</label>
          <textarea name="notes" rows={3} className="w-full border-b border-slate-200 py-3 outline-none resize-none text-sm" placeholder="Tell us about your production..." />
        </div>
      </div>

      <div className="pt-6">
        <button 
          disabled={isPending}
          className={`
            relative w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all
            ${isPending 
              ? 'bg-slate-200 text-slate-400 cursor-wait' 
              : 'bg-slate-900 text-white hover:bg-blue-600 active:scale-95'
            }
          `}
        >
          <span className={isPending ? 'opacity-0' : 'opacity-100'}>
            Request Availability
          </span>
          
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-[1.5px] border-slate-400 border-t-slate-900 rounded-full animate-spin" />
            </div>
          )}
        </button>
      </div>
    </form>
  );
}

// --- MAIN WRAPPER ---
export default function InquirySection({ item }: { item: Prop }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="mt-10 space-y-3">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-[0.98] shadow-2xl shadow-slate-200"
        >
          Check Availability
        </button>
        <ShareButton />
      </div>

      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={() => setIsOpen(false)} 
      />
      
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-60 shadow-2xl transform transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-8 h-full flex flex-col">
          <button 
            onClick={() => setIsOpen(false)} 
            className="self-end text-slate-400 hover:text-slate-900 font-bold text-[10px] uppercase tracking-widest mb-8 px-4 py-2"
          >
            Close ✕
          </button>

          {isOpen && <InquiryFormContent item={item} onClose={() => setIsOpen(false)} />}
        </div>
      </div>
    </>
  );
}