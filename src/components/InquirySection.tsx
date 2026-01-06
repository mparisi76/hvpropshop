'use client';

import { useState, useActionState } from 'react';
import { Prop } from '@/types';
import ShareButton from './ShareButton';
import { ActionState, sendInquiry } from '@/app/actions/sendInquiry';

export default function InquirySection({ item }: { item: Prop }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Define the initial state explicitly
  const initialState: ActionState = { success: false };

  // TypeScript now knows exactly what 'state' looks like
  const [state, formAction, isPending] = useActionState(
    (prevState: ActionState, formData: FormData) => sendInquiry(prevState, formData, item),
    initialState
  );

  return (
    <>
      <div className="mt-10 space-y-3">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-[0.98]"
        >
          Check Availability
        </button>
        <ShareButton />
      </div>

      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />
      
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-60 shadow-2xl transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <button onClick={() => setIsOpen(false)} className="self-end text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-8">Close ✕</button>

          {state?.success ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-black tracking-tight">Request Sent</h2>
              <p className="text-slate-500 mt-3 text-sm">We&apos;ll check availability for <strong>{item.name}</strong>.</p>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              <h2 className="text-2xl font-black tracking-tighter mb-10">Inquiry</h2>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Name</label>
                <input name="name" required type="text" className="w-full border-b border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Email</label>
                <input name="email" required type="email" className="w-full border-b border-slate-200 py-3 outline-none focus:border-blue-600 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Start Date</label>
                  <input name="start" required type="date" className="w-full border-b border-slate-200 py-3 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">End Date</label>
                  <input name="end" required type="date" className="w-full border-b border-slate-200 py-3 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes</label>
                <textarea name="notes" rows={3} className="w-full border-b border-slate-200 py-3 outline-none resize-none" />
              </div>

              <button 
                disabled={isPending}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {isPending ? 'Sending...' : 'Request Availability'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}