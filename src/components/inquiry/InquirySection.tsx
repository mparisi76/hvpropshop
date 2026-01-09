"use client";

import { useState, useEffect } from "react";
import { Prop } from "@/types";
import ShareButton from "../ShareButton";
import Portal from "../ui/Portal";
import InquiryForm from "./InquiryForm";

export default function InquirySection({ item }: { item: Prop }) {
  const [isOpen, setIsOpen] = useState(false);

  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // When closing, increment the key to reset the form for the next time
      // We do this after a slight delay to let the slide-out finish
      setTimeout(() => setFormKey((prev) => prev + 1), 500);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

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

      <Portal>
        <div
          className={`fixed inset-0 z-10000 transition-all duration-500 ${
            isOpen ? "visible" : "invisible pointer-events-none"
          }`}
        >
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-500 ease-in-out ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-6 md:p-10 h-full flex flex-col relative overflow-hidden">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 font-bold text-[10px] uppercase tracking-widest p-4 transition-colors z-50"
              >
                Close ✕
              </button>
              <div className="flex-1 mt-16 overflow-y-auto no-scrollbar">
                <InquiryForm
                  item={item}
                  onClose={() => setIsOpen(false)}
                  key={formKey}
                />
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
}
