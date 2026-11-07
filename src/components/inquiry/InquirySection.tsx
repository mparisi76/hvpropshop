"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Prop } from "@/types";
import ShareButton from "../ShareButton";
import Portal from "../ui/Portal";
import InquiryForm from "./InquiryForm";

export default function InquirySection({
  item,
  compact = false,
}: {
  item: Prop;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Reset the form after the drawer finishes sliding out
  const resetFormSoon = () => setTimeout(() => setFormKey((prev) => prev + 1), 300);
  const close = () => {
    setIsOpen(false);
    resetFormSoon();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setTimeout(() => setFormKey((prev) => prev + 1), 300);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen]);

  return (
    <>
      {compact ? (
        <button onClick={() => setIsOpen(true)} className="btn-accent w-full">
          Request to book
        </button>
      ) : (
        <div className="space-y-2">
          <button onClick={() => setIsOpen(true)} className="btn-accent h-11! w-full">
            Request to book
          </button>
          <ShareButton />
        </div>
      )}

      <Portal>
        <div
          className={`fixed inset-0 z-100 ${isOpen ? "visible" : "invisible pointer-events-none"}`}
          role="dialog"
          aria-modal="true"
          aria-label={`Request to book ${item.name}`}
        >
          <div
            className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-300 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={close}
          />
          <div
            className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
              <p className="text-sm font-semibold">Request to book</p>
              <button
                onClick={close}
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <InquiryForm item={item} onClose={close} key={formKey} />
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
}
